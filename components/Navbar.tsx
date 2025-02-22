'use client';

import { useLanguage } from '@/app/contexts/LanguageContext';
import Link from 'next/link';
import LanguageSwitch from './LanguageSwitch';

export default function Navbar() {
  const { language } = useLanguage();

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-16">
          {/* Logo 區塊靠左 */}
          <div className="flex-shrink-0">
            <Link 
              href="/" 
              className="font-bold text-xl hover:text-gray-700 transition-colors"
            >
              {language === 'zh' ? '北科課程助手' : 'NTUT Course Helper'}
            </Link>
          </div>

          {/* 中間空白區域 */}
          <div className="flex-grow" />

          {/* 右側連結和語言切換 */}
          <div className="flex items-center gap-4">
            <Link 
              href="/schedule" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              {language === 'zh' ? '選課系統' : 'Course Selection'}
            </Link>
            <LanguageSwitch />
          </div>
        </div>
      </div>
    </nav>
  );
}