import { type FormEvent, useState } from 'react';
import Navbar from '~/components/Navbar';
import FileUploader from '~/components/FileUploader';
import { usePuterStore } from '~/lib/puter';
import { useNavigate } from 'react-router';
import { convertPdfToImage } from '~/lib/pdf2img';
import { generateUUID } from '~/lib/utils';
import { prepareInstructions } from 'constans';
import { useLangStore } from '~/lib/lang';

const Upload = () => {
  const { auth, isLoading, fs, ai, kv } = usePuterStore();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [errorText, setErrorText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const { lang } = useLangStore();
  const [resetKey, setResetKey] = useState(0);

  const handleFileSelect = (file: File | null) => {
    setFile(file);
    if (file === null) {
      setResetKey((k) => k + 1);
    }
  };

  const handleAnalyze = async ({
    companyName,
    jobTitle,
    jobDescription,
    file,
  }: {
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    file: File;
  }) => {
    setIsProcessing(true);
    setErrorText('');

    let shouldResetProcessing = true;
    try {
      setStatusText(lang === 'sq' ? 'Duke ngarkuar skedarin...' : 'Uploading the file...');
      const uploadedFile = await fs.upload([file]);
      if (!uploadedFile) {
        throw new Error(lang === 'sq' ? 'Gabim: Dështoi ngarkimi i skedarit' : 'Error: Failed to upload file');
      }

      setStatusText(lang === 'sq' ? 'Duke konvertuar në imazh...' : 'Converting to image...');
      const imageFile = await convertPdfToImage(file);
      if (!imageFile.file) {
        throw new Error(
          imageFile.error ??
            (lang === 'sq' ? 'Gabim: Dështoi konvertimi i PDF në imazh' : 'Error: Failed to convert PDF to image')
        );
      }

      setStatusText(lang === 'sq' ? 'Duke ngarkuar imazhin...' : 'Uploading the image...');
      const uploadedImage = await fs.upload([imageFile.file]);
      if (!uploadedImage) {
        throw new Error(lang === 'sq' ? 'Gabim: Dështoi ngarkimi i imazhit' : 'Error: Failed to upload image');
      }

      setStatusText(lang === 'sq' ? 'Duke përgatitur të dhënat...' : 'Preparing data...');
      const uuid = generateUUID();
      const data = {
        id: uuid,
        resumePath: uploadedFile.path,
        imagePath: uploadedImage.path,
        companyName,
        jobTitle,
        jobDescription,
        lang,
        feedback: '',
      };
      await kv.set(`resume:${uuid}`, JSON.stringify(data));

      setStatusText(lang === 'sq' ? 'Duke analizuar...' : 'Analyzing...');

      const feedback = await ai.feedback(uploadedFile.path, prepareInstructions({ jobTitle, jobDescription, lang }));
      if (!feedback) {
        throw new Error(lang === 'sq' ? 'Gabim: Dështoi analiza e CV-së' : 'Error: Failed to analyze resume');
      }

      const maybeFailure = feedback as { success?: boolean; error?: string };
      if (maybeFailure && 'success' in maybeFailure && maybeFailure.success === false) {
        throw new Error(
          maybeFailure.error ??
            (lang === 'sq' ? 'Gabim: Analiza e Puter AI nuk u krye' : 'Error: Puter AI failed to analyze the resume')
        );
      }

      const rawContent = (feedback as { message?: { content?: unknown } }).message?.content;
      if (!rawContent) {
        throw new Error(
          lang === 'sq' ? 'Gabim: Nuk u mor përgjigje nga analiza' : 'Error: Did not receive analysis content from AI'
        );
      }
      let feedbackText = '';

      if (typeof rawContent === 'string') {
        feedbackText = rawContent;
      } else if (Array.isArray(rawContent)) {
        feedbackText = rawContent
          .map((chunk) => {
            if (typeof chunk === 'string') return chunk;
            if (chunk && typeof chunk === 'object' && 'text' in chunk && typeof chunk.text === 'string') {
              return chunk.text;
            }
            return '';
          })
          .filter(Boolean)
          .join('\n');
      }

      feedbackText = feedbackText
        .replace(/```json/i, '')
        .replace(/```/g, '')
        .trim();

      if (!feedbackText) {
        throw new Error(
          lang === 'sq'
            ? 'Gabim: Formati i përgjigjes nga analiza ishte bosh'
            : 'Error: Received empty analysis response'
        );
      }

      const parseFeedbackJson = (text: string) => {
        try {
          return JSON.parse(text);
        } catch (error) {
          const firstBrace = text.indexOf('{');
          const lastBrace = text.lastIndexOf('}');
          if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
            return null;
          }
          const sliced = text.slice(firstBrace, lastBrace + 1);
          try {
            return JSON.parse(sliced);
          } catch (innerError) {
            console.error('Failed to parse AI feedback JSON', { error: innerError, text });
            return null;
          }
        }
      };

      const parsedFeedback = parseFeedbackJson(feedbackText);
      if (!parsedFeedback) {
        throw new Error(
          lang === 'sq'
            ? 'Gabim: Formati i përgjigjes nga analiza ishte i pavlefshëm'
            : 'Error: Received invalid analysis format'
        );
      }

      data.feedback = parsedFeedback;
      await kv.set(`resume:${uuid}`, JSON.stringify(data));
      setStatusText(lang === 'sq' ? 'Analiza përfundoi, po ridrejtohesh...' : 'Analysis complete, redirecting...');
      console.log(data);
      navigate(`/resume/${uuid}`);
      shouldResetProcessing = false;
    } catch (error) {
      console.error('handleAnalyze failed', error);
      const fallbackMessage =
        lang === 'sq'
          ? 'Gabim: Diçka shkoi keq gjatë analizës së CV-së'
          : 'Error: Something went wrong while analyzing the resume';
      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'string' && error
            ? error
            : error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
              ? error.message
              : fallbackMessage;
      if (message === fallbackMessage && error) {
        console.error('Unhandled error shape from Puter AI', { error });
      }
      setStatusText(message);
      setErrorText(message);
    } finally {
      if (shouldResetProcessing) {
        setIsProcessing(false);
      }
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget.closest('form');
    if (!form) return;
    const formData = new FormData(form);

    const companyName = formData.get('company-name') as string;
    const jobTitle = formData.get('job-title') as string;
    const jobDescription = formData.get('job-description') as string;

    if (!file) return;

    handleAnalyze({ companyName, jobTitle, jobDescription, file });
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-16">
          <h1>{lang === 'sq' ? 'Feedback inteligjent për punën e ëndrrave' : 'Smart feedback for your dream job'}</h1>
          {isProcessing ? (
            <>
              <h2>{statusText}</h2>
              <img src="/images/resume-scan.gif" className="w-full" />
            </>
          ) : (
            <h2>
              {lang === 'sq'
                ? 'Ngarko CV-në për një vlerësim ATS dhe këshilla për përmirësim'
                : 'Drop your resume for an ATS score and improvement tips'}
            </h2>
          )}
          {!isProcessing && (
            <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
              <div className="form-div">
                <label htmlFor="company-name">{lang === 'sq' ? 'Emri i Kompanisë' : 'Company Name'}</label>
                <input
                  type="text"
                  name="company-name"
                  placeholder={lang === 'sq' ? 'Emri i Kompanisë' : 'Company Name'}
                  id="company-name"
                />
              </div>
              <div className="form-div">
                <label htmlFor="job-title">{lang === 'sq' ? 'Pozicioni' : 'Job Title'}</label>
                <input
                  type="text"
                  name="job-title"
                  placeholder={lang === 'sq' ? 'Pozicioni' : 'Job Title'}
                  id="job-title"
                />
              </div>
              <div className="form-div">
                <label htmlFor="job-description">{lang === 'sq' ? 'Përshkrimi i Punës' : 'Job Description'}</label>
                <textarea
                  rows={5}
                  name="job-description"
                  placeholder={lang === 'sq' ? 'Përshkrimi i Punës' : 'Job Description'}
                  id="job-description"
                />
              </div>

              <div className="form-div">
                <label htmlFor="uploader">{lang === 'sq' ? 'Ngarko CV' : 'Upload Resume'}</label>
                <FileUploader onFileSelect={handleFileSelect} key={resetKey} />
              </div>

              <button className="primary-button w-full" type="submit">
                {lang === 'sq' ? 'Analizo CV' : 'Analyze Resume'}
              </button>
            </form>
          )}
          {!isProcessing && errorText && <p className="text-center text-red-600 font-semibold mt-6">{errorText}</p>}
        </div>
      </section>
    </main>
  );
};
export default Upload;
