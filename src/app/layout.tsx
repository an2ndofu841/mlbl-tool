import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SettingsProvider } from "@/context/SettingsContext";
import Header from "@/components/Header";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "MLBL Tool",
  description: "Internal Tools for MLBL",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900 min-h-screen flex flex-col`}
      >
        <SettingsProvider>
          <Header />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <footer className="w-full border-t border-slate-200 bg-white py-6 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-500 text-sm">
              &copy; {new Date().getFullYear()} Meshiaga Label. All rights reserved.
            </div>
          </footer>
        </SettingsProvider>
      </body>
    </html>
  );
}
