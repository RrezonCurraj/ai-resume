import { create } from 'zustand';

type Language = 'en' | 'sq';

interface LangStore {
  lang: Language;
  setLang: (lang: Language) => void;
}

const getInitialLang = (): Language => {
  if (typeof window === 'undefined') return 'en';
  const saved = window.localStorage.getItem('lang');
  return saved === 'sq' || saved === 'en' ? (saved as Language) : 'en';
};

export const useLangStore = create<LangStore>((set) => ({
  lang: getInitialLang(),
  setLang: (lang: Language) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('lang', lang);
    }
    set({ lang });
  },
}));
