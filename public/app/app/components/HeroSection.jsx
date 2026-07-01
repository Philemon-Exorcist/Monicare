import Link from "next/link";

const stats = [
  { label: "Instant Formation", value: "Build your group in seconds" },
  { label: "Auto Tracking", value: "Automated group ledger" },
  { label: "Secure & Transparent", value: "Nomba-backed security" },
];

export default function HeroSection() {
  return (
    <section className="bg-slate-950 text-white">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-6 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:px-8">
        <div className="max-w-2xl">
          <span className="inline-flex rounded-full bg-yellow-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-yellow-300">
            Community finance made easy
          </span>
          <h1 className="mt-8 text-5xl font-semibold leading-tight tracking-tight text-white sm:text-6xl">
            Unlock Community Wealth with a Single Link.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
            Invite friends, build your Esusu group, and watch your savings grow virally. The future of cooperative finance is one share away.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center rounded-full bg-yellow-400 px-7 py-4 text-base font-semibold text-slate-950 transition hover:bg-yellow-300"
            >
              Get Started - Generate Your Link
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

        <div className="relative overflow-hidden rounded-[2rem] border border-yellow-400/20 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-800 p-8 shadow-[0_35px_120px_rgba(0,0,0,0.35)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(250,204,21,0.18),_transparent_20%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.08),_transparent_25%)]" />
          <div className="relative flex min-h-[420px] flex-col justify-between gap-6">
            <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-yellow-300">Nomba Esusu</p>
                <p className="mt-3 text-lg font-semibold text-white">Seamless digital thrift.</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-white/10 text-xl text-yellow-300">∞</div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6">
              <div className="mb-8 h-48 rounded-[1.5rem] bg-slate-900" />
              <div className="grid gap-4 text-sm text-slate-300">
                <div className="rounded-3xl bg-white/5 p-4">
                  <p className="font-semibold text-white">Precision ledger routing</p>
                  <p className="mt-2 text-slate-400">Automated group transaction tracking.</p>
                </div>
                <div className="rounded-3xl bg-white/5 p-4">
                  <p className="font-semibold text-white">Realtime contribution transparency</p>
                  <p className="mt-2 text-slate-400">Every share and payout is visible to members.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
