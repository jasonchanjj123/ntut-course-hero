import "./globals.css";
import { LanguageProvider } from './contexts/LanguageContext';
import Navbar from '@/components/Navbar';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html>
      <body>
        <LanguageProvider>
          <Navbar />
          <main className="pt-16"> {/* 新增 padding-top 以避免內容被導航列遮擋 */}
            {children}
          </main>
        </LanguageProvider>
      </body>
    </html>
  );
}
