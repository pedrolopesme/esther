import { Fredoka } from "next/font/google";
import Link from "next/link";
import { Sparkles, Heart } from "lucide-react";
import HeaderUser from "../components/HeaderUser";
import AccessLogProvider from "../components/AccessLogProvider";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Esther · Aventura de Estudos ✨",
  description: "Plataforma de exercícios escolares super fofa e divertida para crianças",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={`${fredoka.variable} antialiased flex flex-col min-h-screen`}>
        <AccessLogProvider />
        {/* Floating glass pill header */}
        <header className="sticky top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-5">
          <div className="glass mx-auto flex w-full items-center gap-3 rounded-full px-4 py-2.5 shadow-[0_10px_30px_-12px_rgba(163,112,255,0.5)] sm:px-6 sm:py-3">
            <Link
              href="/"
              className="press flex items-center gap-2 font-display text-xl font-bold text-ink hover:-translate-y-0.5 sm:text-2xl"
            >
              <span className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-candy to-lilac text-white shadow-md anim-bob">
                <Sparkles className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <span className="text-gradient">Esther</span>
            </Link>

            <div className="ml-auto">
              <HeaderUser />
            </div>
          </div>
        </header>

        <main className="flex-grow">{children}</main>

        {/* Footer */}
        <footer className="mt-16 px-4 pb-8">
          <div className="glass mx-auto flex max-w-5xl flex-col items-center gap-3 rounded-[2rem] px-6 py-6 text-center">
            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-display font-semibold text-ink">
              <Link href="/" className="press hover:text-candy">Início</Link>
              <Link href="#" className="press hover:text-lilac">Sobre</Link>
              <Link href="#" className="press hover:text-sky">Contato</Link>
            </nav>
            <p className="flex items-center gap-1.5 text-sm text-ink-soft">
              Feito com <Heart className="h-4 w-4 fill-candy text-candy anim-bob" /> para a Esther
              <span className="mx-1">·</span>© {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
