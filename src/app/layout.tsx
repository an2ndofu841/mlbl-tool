import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { SettingsProvider } from "@/context/SettingsContext";

const notoSansJP = Noto_Sans_JP({ 
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-jp",
});

export const metadata: Metadata = {
  title: "株式会社めしあがレーベル 社内業務効率化ツール",
  description: "給与明細作成・従業員管理ツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${notoSansJP.className} min-h-screen bg-slate-50 text-slate-900`}>
        <SettingsProvider>
          <Header />
          <main className="container mx-auto px-4 py-8 max-w-7xl animate-fade-in">
            {children}
          </main>
        </SettingsProvider>
      </body>
    </html>
  );
}
