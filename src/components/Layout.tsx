import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { cn } from '../utils/cn';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('zh') ? 'en' : 'zh';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 transition-colors duration-300">
      <header className="sticky top-0 z-10 backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold bg-gradient-to-r from-emerald-500 to-sky-500 bg-clip-text text-transparent">
            {t('app.title')}
          </Link>
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
            >
              <Languages className="w-4 h-4" />
              <span>{i18n.language.startsWith('zh') ? 'English' : '中文'}</span>
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};
