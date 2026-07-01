import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/95 backdrop-blur-xl">
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
        <div className="flex items-center gap-8" >
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
      </div>
    </header>
  );
}
