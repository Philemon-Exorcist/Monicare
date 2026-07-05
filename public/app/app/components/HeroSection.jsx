import Link from "next/link";

const stats = [
  { label: "Instant Formation", value: "Build your group in seconds" },
  { label: "Auto Tracking", value: "Automated group ledger" },
  { label: "Secure & Transparent", value: "Nomba-backed security" },
];

export default function HeroSection() {
  return (
    <section className="w-full h-screen bg-slate-950 text-white overflow-hidden">
      <div className="flex h-full w-full flex-col overflow-hidden bg-slate-950 lg:flex-row">
        <div className="flex w-full flex-col justify-center rounded-[2rem] bg-slate-950 p-10 lg:w-1/2 lg:rounded-r-none lg:rounded-l-[2rem] lg:px-16 lg:py-20">
          <span className="inline-flex rounded-full bg-yellow-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-yellow-300">
            Community finance made easy
          </span>
          <h1 className="mt-8 text-5xl font-semibold leading-tight tracking-tight text-white sm:text-6xl">
            Turn your community into a wealth-building engine.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
            Create, manage and grow your savings circle with automated contributions, transparent payouts and one shareable link.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center rounded-full bg-yellow-400 px-7 py-4 text-base font-semibold text-slate-950 transition hover:bg-yellow-300"
            >
              Get Started
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-7 py-4 text-base font-semibold text-white transition hover:border-yellow-300 hover:text-yellow-300"
            >
              Learn More
            </a>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">{stat.label}</p>
                <p className="mt-3 text-sm text-slate-200">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center rounded-[2rem] bg-yellow-400 p-10 lg:rounded-l-none lg:rounded-r-[2rem] lg:p-16">
          <div className="flex h-full w-full min-h-[320px] items-center justify-center rounded-[2rem] border border-yellow-500/80 bg-yellow-500/90 p-8 shadow-[0_30px_70px_rgba(0,0,0,0.18)]">
            <div className="text-center text-slate-950">
              <p className="text-sm uppercase tracking-[0.3em]">Image placeholder</p>
              <p className="mt-3 text-2xl font-semibold">Your hero image will appear here</p>
              <p className="mt-4 max-w-xs text-sm text-slate-950/80">Replace this with your final artwork once the image is ready.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
