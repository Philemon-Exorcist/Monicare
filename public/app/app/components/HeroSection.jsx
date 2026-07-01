import Image from "next/image";
import Link from "next/link";
import ImageP1 from "../assets/p1.jpg";
import ImageP2 from "../assets/p2.jpg";

const stats = [
  { label: "Instant Formation", value: "Build your group in seconds" },
  { label: "Auto Tracking", value: "Automated group ledger" },
  { label: "Secure & Transparent", value: "Nomba-backed security" },
];

export default function HeroSection() {
  return (
    <section className="bg-slate-950 text-white">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-6 py-16 lg:flex-row lg:items-center lg:px-8">
        <div className="lg:w-1/2">
          <span className="inline-flex rounded-full bg-yellow-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-yellow-300">
            Community finance made easy
          </span>
          <h1 className="mt-3 text-5xl font-semibold leading-tight tracking-tight text-white sm:text-6xl">
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

        <div className="lg:w-1/2">
          <div className="grid gap-5 sm:grid-cols-[1.2fr_0.8fr]">
            <div className="grid gap-5">
              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/80 shadow-[0_30px_70px_rgba(0,0,0,0.3)]">
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem]">
                  <Image src={ImageP1} alt="Hero image p1" className="object-cover" fill priority />
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/80 shadow-[0_30px_70px_rgba(0,0,0,0.3)]">
                  <div className="relative aspect-[10/9] w-full overflow-hidden rounded-[2rem]">
                    <Image src={ImageP2} alt="Hero image p2" className="object-cover" fill priority />
                  </div>
                </div>
                <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/80 shadow-[0_30px_70px_rgba(0,0,0,0.3)]">
                  <div className="relative aspect-[10/9] w-full overflow-hidden rounded-[2rem]">
                    <Image src={ImageP1} alt="Hero image p1" className="object-cover" fill priority />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-5">
              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/80 shadow-[0_30px_70px_rgba(0,0,0,0.3)]">
                <div className="relative aspect-[5/6] w-full overflow-hidden rounded-[2rem]">
                  <Image src={ImageP2} alt="Hero image p2" className="object-cover" fill priority />
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/80 shadow-[0_30px_70px_rgba(0,0,0,0.3)]">
                  <div className="relative aspect-[8/9] w-full overflow-hidden rounded-[2rem]">
                    <Image src={ImageP1} alt="Hero image p1" className="object-cover" fill priority />
                  </div>
                </div>
                <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/80 shadow-[0_30px_70px_rgba(0,0,0,0.3)]">
                  <div className="relative aspect-[8/9] w-full overflow-hidden rounded-[2rem]">
                    <Image src={ImageP2} alt="Hero image p2" className="object-cover" fill priority />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
