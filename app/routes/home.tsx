import type { Route } from './+types/home';
import Navbar from '~/components/Navbar';
import ResumeCard from '~/components/ResumeCard';
import { usePuterStore } from '~/lib/puter';
import { useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useLangStore } from '~/lib/lang';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Hireon' },
    {
      name: 'description',
      content:
        'It understands your skills, elevates your story, and helps recruiters see your full potential. All in minutes, powered by AI.',
    },
  ];
}

export default function Home() {
  const { auth, kv, fs } = usePuterStore();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLodingResumes] = useState(false);
  const { lang, setLang } = useLangStore();

  useEffect(() => {
    if (!auth.isAuthenticated) navigate('/auth?next=/');
  }, [auth.isAuthenticated]);

  useEffect(() => {
    const loadResumes = async () => {
      setLodingResumes(true);
      const resumes = (await kv.list('resume:*', true)) as KVItem[];
      const parsedResumes = resumes?.map((resume) => JSON.parse(resume.value) as Resume);
      console.log('parsedResumes', parsedResumes);
      setResumes(parsedResumes || []);
      setLodingResumes(false);
    };
    loadResumes();
  }, []);

  return (
    <main className=" bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />
      <section className="main-section">
        <div className="page-heading py-16">
          <h1>
            {lang === 'sq' ? 'Ndiq aplikimet dhe vlerësimet e CV-së' : 'Track your applications & Resume Ratings'}
          </h1>
          {!loadingResumes && resumes?.length === 0 ? (
            <h2>
              {lang === 'sq'
                ? 'Nuk u gjetën CV. Ngarko CV-në tënde të parë për të marrë feedback.'
                : 'No resumes found. Upload your first resume to get feedback.'}
            </h2>
          ) : (
            <h2>
              {lang === 'sq'
                ? 'Rishiko dërgesat dhe shiko feedback-un e mundësuar nga AI.'
                : 'Review your submissions and check Ai-Powered feedback.'}
            </h2>
          )}
        </div>
        {loadingResumes && (
          <div className="flex flex-col items-center justify-center">
            <img src="/images/resume-scan-2.gif" className="w-[200px]" />
          </div>
        )}

        {!loadingResumes && resumes.length > 0 && (
          <>
            <div className="resumes-section">
              {resumes.map((resume) => (
                <ResumeCard key={resume.id} resume={resume} />
              ))}
            </div>
            <div className="flex items-center justify-center mt-10">
              <Link to="/wipe" className="primary-button1">
                {lang === 'sq' ? 'Pastro të Dhënat' : 'Clear Data'}
              </Link>
            </div>
          </>
        )}

        {!loadingResumes && resumes?.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-10 gap-4">
            <Link to="/upload" className="primary-button w-fit text-xl font-semibold">
              {lang === 'sq' ? 'Ngarko CV' : 'Upload Resume'}
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
