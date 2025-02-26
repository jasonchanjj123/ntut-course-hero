'use client';

import { useLanguage } from '@/app/contexts/LanguageContext';
import Link from 'next/link';
import LanguageSwitch from './LanguageSwitch';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Navbar() {
  const { language } = useLanguage();
  const [email, setEmail] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // 這裡處理登入邏輯
    console.log('Login with:', email);
    setIsOpen(false);
  };

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
            
            {/* 登入按鈕和對話框 */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  {language === 'zh' ? '登入' : 'Login'}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>
                    {language === 'zh' ? '使用電子郵件登入' : 'Login with Email'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleLogin} className="space-y-4">
                  <Input
                    type="email"
                    placeholder={language === 'zh' ? '請輸入電子郵件' : 'Enter your email'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Button type="submit" className="w-full">
                    {language === 'zh' ? '登入' : 'Login'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </nav>
  );
}