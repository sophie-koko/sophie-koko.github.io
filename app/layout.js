import Link from "next/link";
import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = {
  title: "Sophie's Website",
  description: "Sophie's Website",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header className="site-header">
          <div className="page-container">
            <Link href="/" className="header-logo-link">
              <Image
                src="/stitch-logo.png"
                alt="Stitch logo"
                width={140}
                height={118}
                priority
              />
              <span className="header-title">Sophie&apos;s Website</span>
            </Link>
          </div>
        </header>
        {children}
        <footer className="site-footer">
          <div className="page-container">
            <hr className="footer-rule" />
            <div className="footer-links">
              <a href="https://kokona.website" target="_blank" rel="noopener noreferrer">Kokona Website</a>
              <span className="footer-pipe">|</span>
              <Link href="/tetrix">🎮 Tetrix</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
