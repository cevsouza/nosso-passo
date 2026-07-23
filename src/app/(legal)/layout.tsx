import React from 'react';
import Link from 'next/link';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex flex-col bg-[#f6f8f9] text-slate-900 font-sans">
      <header className="w-full max-w-3xl mx-auto px-5 md:px-8 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <img src="/icon.svg" alt="" className="w-7 h-7 select-none" />
          <span className="text-lg font-black tracking-tight font-Outfit select-none text-slate-900">
            Nosso Passo
          </span>
        </Link>
        <Link
          href="/"
          className="text-xs font-black font-Outfit text-[#2f8f86] hover:underline"
        >
          Voltar ao início
        </Link>
      </header>

      <article className="w-full max-w-3xl mx-auto px-5 md:px-8 py-6 md:py-10 flex-1">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-10 legal-prose">
          {children}
        </div>
      </article>

      <footer className="w-full max-w-3xl mx-auto px-5 md:px-8 py-6 mt-auto border-t border-slate-200 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] text-slate-400 font-bold tracking-widest uppercase">
        <Link href="/privacidade" className="hover:text-slate-600">Privacidade</Link>
        <Link href="/termos" className="hover:text-slate-600">Termos de Uso</Link>
        <span>Nosso Passo</span>
      </footer>
    </main>
  );
}
