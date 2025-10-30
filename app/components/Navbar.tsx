import { Link } from 'react-router';
import { useLangStore } from '~/lib/lang';

function Navbar() {
  const { lang, setLang } = useLangStore();
  return (
    <nav className="navbar">
      <Link to="/">
        <p className="text-2xl font-bold text-gradient"> Hireon</p>
      </Link>
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <button
            aria-label="English"
            className={`px-2 py-1 rounded ${lang === 'en' ? 'ring-2 ring-black/20' : ''}`}
            onClick={() => setLang('en')}
            title="English"
          >
            <span style={{ fontSize: 18 }}>🇬🇧</span>
          </button>
          <button
            aria-label="Shqip"
            className={`px-2 py-1 rounded ${lang === 'sq' ? 'ring-2 ring-black/20' : ''}`}
            onClick={() => setLang('sq')}
            title="Shqip"
          >
            <span style={{ fontSize: 18 }}>🇦🇱</span>
          </button>
        </div>
        <Link to="/upload" className="primary-button w-fit">
          {lang === 'sq' ? 'Ngarko CV' : 'Upload Resume'}
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
