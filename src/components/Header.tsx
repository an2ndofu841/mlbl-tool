'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Sparkles, Settings } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const isHidden = ['/cheki-timer', '/sales'].includes(pathname);

  if (isHidden) {
    return null;
  }

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 print:hidden">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
        <Link href="/" className="group flex items-center space-x-3 hover:opacity-80 transition-all duration-300">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-2 rounded-lg shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
            <Home size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 tracking-tight">
              株式会社めしあがレーベル
            </h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-wider">OFFICIAL BUSINESS TOOL</p>
          </div>
        </Link>
        
        <div className="flex items-center gap-4">
          <Link href="/settings" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors" title="設定">
            <Settings size={20} />
          </Link>

          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-600">
            <Sparkles size={12} className="text-yellow-500" />
            <span>Ver 1.0</span>
          </div>
        </div>
      </div>
    </header>
  );
}
