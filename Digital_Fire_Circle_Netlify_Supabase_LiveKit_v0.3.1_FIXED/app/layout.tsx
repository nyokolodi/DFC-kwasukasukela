import PwaRegister from '@/components/PwaRegister';
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Digital Fire Circle",
  description: "African stories. Real voices. Shared wisdom.",
  manifest: '/manifest.webmanifest'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
<PwaRegister />
        <header className="site-header">
          <Link href="/" className="brand"><span className="fire">🔥</span> Digital Fire Circle</Link>
          <nav>
            <Link href="/stories">Stories</Link>
            <Link href="/circles">Live circles</Link>
            <Link href="/elder/apply">Become a storyteller</Link>
            <Link href="/login">Sign in</Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer>Digital Fire Circle · The fire is digital. The tradition is real.</footer>
      </body>
    </html>
  );
}
