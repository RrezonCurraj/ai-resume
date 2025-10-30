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

    setStatusText(lang === 'sq' ? 'Duke ngarkuar skedarin...' : 'Uploading the file...');
    const uploadedFile = await fs.upload([file]);
    if (!uploadedFile)
      return setStatusText(lang === 'sq' ? 'Gabim: Dështoi ngarkimi i skedarit' : 'Error: Failed to upload file');

    setStatusText(lang === 'sq' ? 'Duke konvertuar në imazh...' : 'Converting to image...');
    const imageFile = await convertPdfToImage(file);
    if (!imageFile.file)
      return setStatusText(
        lang === 'sq' ? 'Gabim: Dështoi konvertimi i PDF në imazh' : 'Error: Failed to convert PDF to image'
      );

    setStatusText(lang === 'sq' ? 'Duke ngarkuar imazhin...' : 'Uploading the image...');
    const uploadedImage = await fs.upload([imageFile.file]);
    if (!uploadedImage)
      return setStatusText(lang === 'sq' ? 'Gabim: Dështoi ngarkimi i imazhit' : 'Error: Failed to upload image');

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
    if (!feedback)
      return setStatusText(lang === 'sq' ? 'Gabim: Dështoi analiza e CV-së' : 'Error: Failed to analyze resume');

    const feedbackText =
      typeof feedback.message.content === 'string' ? feedback.message.content : feedback.message.content[0].text;

    data.feedback = JSON.parse(feedbackText);
    await kv.set(`resume:${uuid}`, JSON.stringify(data));
    setStatusText(lang === 'sq' ? 'Analiza përfundoi, po ridrejtohesh...' : 'Analysis complete, redirecting...');
    console.log(data);
    navigate(`/resume/${uuid}`);
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
        </div>
      </section>
    </main>
  );
};
export default Upload;
