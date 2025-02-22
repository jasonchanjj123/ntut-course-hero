'use client';

import { useLanguage } from '../app/contexts/LanguageContext';

export default function LanguageSwitch() {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
      className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 transition-colors"
    >
      {language === 'zh' ?  '中文' :'English'}
    </button>
  );
}