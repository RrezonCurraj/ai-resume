import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { usePuterStore } from '~/lib/puter';
import Navbar from '~/components/Navbar';
import { useLangStore } from '~/lib/lang';

const WipeApp = () => {
  const { auth, isLoading, error, fs, kv } = usePuterStore();
  const navigate = useNavigate();
  const { lang } = useLangStore();
  const [files, setFiles] = useState<FSItem[]>([]);
  const [resumeCount, setResumeCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const loadFiles = async () => {
    const files = (await fs.readDir('./')) as FSItem[];
    setFiles(files);

    // Also load resume count from KV
    const resumes = (await kv.list('resume:*', true)) as KVItem[];
    setResumeCount(resumes?.length || 0);
  };

  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated) {
      navigate('/auth?next=/wipe');
    } else if (auth.isAuthenticated) {
      loadFiles();
    }
  }, [isLoading, auth.isAuthenticated]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Properly await all deletions
      await Promise.all(files.map((file) => fs.delete(file.path)));
      await kv.flush();
      await loadFiles();
      setShowConfirmation(false);
      // Redirect to home after successful deletion
      navigate('/');
    } catch (err) {
      console.error('Error deleting files:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="bg-[url('/images/bg-main.svg')] bg-cover">
        <Navbar />
        <section className="main-section">
          <div className="flex flex-col items-center justify-center">
            <img src="/images/resume-scan-2.gif" className="w-[200px]" />
          </div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="bg-[url('/images/bg-main.svg')] bg-cover">
        <Navbar />
        <section className="main-section">
          <div className="page-heading py-16">
            <h1>{lang === 'sq' ? 'Gabim' : 'Error'}</h1>
            <h2>{error}</h2>
            <Link to="/" className="primary-button w-fit text-xl font-semibold mt-8">
              {lang === 'sq' ? 'Kthehu në shtëpi' : 'Go Home'}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const hasData = files.length > 0 || resumeCount > 0;

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />
      <section className="main-section">
        <div className="page-heading py-16">
          <h1>{lang === 'sq' ? 'Pastro të gjitha të dhënat e aplikacionit' : 'Clear All App Data'}</h1>
          <h2>{lang === 'sq' ? 'Ky veprim nuk mund të zhbëhet' : 'This action cannot be undone'}</h2>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="gradient-border p-8 bg-white rounded-2xl">
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  {lang === 'sq' ? 'Çfarë do të fshihet:' : 'What will be deleted:'}
                </h3>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    <p className="text-gray-700">
                      {lang === 'sq' ? (
                        <>
                          <span className="font-semibold">{resumeCount}</span> {resumeCount === 1 ? 'CV' : 'CV'} dhe
                          feedback-u përkatës
                        </>
                      ) : (
                        <>
                          <span className="font-semibold">{resumeCount}</span> resume{resumeCount !== 1 ? 's' : ''} and
                          associated feedback
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    <p className="text-gray-700">
                      {lang === 'sq' ? (
                        <>
                          <span className="font-semibold">{files.length}</span> skedar{files.length !== 1 ? 'ë' : ''} në
                          ruajtje
                        </>
                      ) : (
                        <>
                          <span className="font-semibold">{files.length}</span> file{files.length !== 1 ? 's' : ''} in
                          storage
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {!hasData && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">
                    {lang === 'sq'
                      ? 'Nuk ka të dhëna për t’u fshirë. Hapësira juaj tashmë është bosh.'
                      : 'No data to delete. Your storage is already empty.'}
                  </p>
                </div>
              )}

              {showConfirmation ? (
                <div className="flex flex-col gap-4">
                  <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                    <p className="text-red-800 font-semibold mb-2">
                      {lang === 'sq' ? '⚠️ Konfirmim Përfundimtar' : '⚠️ Final Confirmation'}
                    </p>
                    <p className="text-red-700">
                      {lang === 'sq'
                        ? 'Jeni absolutisht i sigurt? Kjo do të fshijë përgjithmonë të gjitha CV-të, feedback-un dhe skedarët tuaj. Ky veprim nuk mund të zhbëhet.'
                        : 'Are you absolutely sure? This will permanently delete all your resumes, feedback, and files. This action cannot be undone.'}
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <button
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting
                        ? lang === 'sq'
                          ? 'Duke fshirë...'
                          : 'Deleting...'
                        : lang === 'sq'
                          ? 'Po, Fshij Gjithçka'
                          : 'Yes, Delete Everything'}
                    </button>
                    <button
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-xl font-semibold cursor-pointer transition-colors"
                      onClick={() => setShowConfirmation(false)}
                      disabled={isDeleting}
                    >
                      {lang === 'sq' ? 'Anulo' : 'Cancel'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className={hasData ? 'flex gap-4' : 'flex justify-center'}>
                  {hasData && (
                    <button
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      onClick={() => setShowConfirmation(true)}
                      disabled={!hasData}
                    >
                      {lang === 'sq' ? 'Pastro të gjitha të dhënat' : 'Clear All Data'}
                    </button>
                  )}
                  <Link
                    to="/"
                    className={
                      hasData
                        ? 'flex bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-xl font-semibold cursor-pointer transition-colors text-center'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-xl font-semibold cursor-pointer transition-colors text-center'
                    }
                  >
                    {lang === 'sq' ? 'Kthehu mbrapa' : 'Go Back'}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default WipeApp;
