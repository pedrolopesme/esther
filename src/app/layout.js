import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import ScoreBadge from "../components/ScoreBadge";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Esther - Exercícios Escolares",
  description: "Plataforma de exercícios escolares para crianças",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <header className="app-header">
          <Link href="/" className="app-logo">Esther</Link>
          <div className="ml-auto">
            <ScoreBadge />
          </div>
        </header>
        
        <main className="flex-grow">
          {children}
        </main>
        
        <footer className="app-footer">
          <div className="app-footer-content">
            <div className="app-footer-links">
              <Link href="/">Início</Link>
              <Link href="#">Sobre</Link>
              <Link href="#">Contato</Link>
            </div>
            <div className="app-footer-copyright">
              © {new Date().getFullYear()} Esther - Exercícios Escolares
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
