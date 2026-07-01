"use client";

import { useState } from "react";
import Link from "next/link";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-yellow-400 text-base font-bold text-slate-950">
            M
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-white">Monicare</p>
            <p className="text-xs text-slate-400">Community savings, simplified</p>
          </div>
        </div>

        <nav className="hidden items-center gap-8 md:flex">
          <Link href="#how-it-works" className="text-sm text-slate-300 transition hover:text-yellow-300">
            How it Works
          </Link>
          <Link href="#features" className="text-sm text-slate-300 transition hover:text-yellow-300">
            Join a Circle
          </Link>
          <Link href="#security" className="text-sm text-slate-300 transition hover:text-yellow-300">
            Features
          </Link>
        </nav>
        <div className="hidden items-center gap-8 md:flex">
          <Link href="/auth/login" className="text-sm font-semibold text-white transition hover:text-yellow-300">
            Login
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex items-center rounded-full bg-yellow-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-yellow-300"
          >
            Get Started
          </Link>
        </div>

        <div className="md:hidden">
          <button onClick={() => setIsMenuOpen(true)} aria-label="Open menu">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/90 backdrop-blur-lg md:hidden">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-yellow-400 text-base font-bold text-slate-950">
                  M
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.26em] text-white">Monicare</p>
                  <p className="text-xs text-slate-400">Community savings, simplified</p>
                </div>
              </div>
              <button onClick={() => setIsMenuOpen(false)} aria-label="Close menu">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex flex-1 flex-col items-center justify-center gap-8">
              <Link href="#how-it-works" onClick={() => setIsMenuOpen(false)} className="text-lg text-slate-300 transition hover:text-yellow-300">
                How it Works
              </Link>
              <Link href="#features" onClick={() => setIsMenuOpen(false)} className="text-lg text-slate-300 transition hover:text-yellow-300">
                Join a Circle
              </Link>
              <Link href="#security" onClick={() => setIsMenuOpen(false)} className="text-lg text-slate-300 transition hover:text-yellow-300">
                Features
              </Link>
            </nav>

            <div className="flex flex-col gap-4 p-6">
              <Link
                href="/auth/login"
                onClick={() => setIsMenuOpen(false)}
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-3 text-base font-semibold text-white transition hover:bg-white/10"
              >
                Login
              </Link>
              <Link
                href="/auth/login"
                onClick={() => setIsMenuOpen(false)}
                className="inline-flex items-center justify-center rounded-full bg-yellow-400 px-5 py-3 text-base font-semibold text-slate-950 transition hover:bg-yellow-300"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
