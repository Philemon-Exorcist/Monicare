import Image from "next/image";
import Link from "next/link";
import heroImage from "../assets/istockphoto-1717120374-1024x1024.jpg";

const stats = [
  { label: "Instant Formation", value: "Build your group in seconds" },
  { label: "Auto Tracking", value: "Automated group ledger" },
  { label: "Secure & Transparent", value: "Nomba-backed security" },
];

export default function HeroSection() {
  return (
    <section className="w-full min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col overflow-hidden px-4 py-4 sm:px-6 lg:flex-row lg:gap-6 lg:px-8 lg:py-8">
        <div className="flex w-full flex-1 items-center justify-center rounded-[2rem] bg-slate-950 px-6 py-10 lg:justify-start lg:rounded-r-none lg:rounded-l-[2rem] lg:px-12 lg:py-16">
          <div className="w-full max-w-2xl ">
            
            <h1 className=" text-4xl font-semibold leading-tight tracking-tight text-white sm:text-6xl">
              Turn your community into a wealth-building engine.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Create, manage and grow your savings circle with automated contributions, transparent payouts and one shareable link.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/auth/login#signup"
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

            
          </div>
        </div>

        <div className="mt-6 flex w-full flex-1 items-center justify-center rounded-[2rem] bg-yellow-400 px-6 py-10 lg:mt-0 lg:justify-end lg:rounded-l-none lg:rounded-r-[2rem] lg:px-12 lg:py-16">
          <div className="relative h-[320px] w-full overflow-hidden rounded-[1.4rem] sm:h-[420px] lg:h-full">
            <Image
              src={heroImage}
              alt="Monicare community savings illustration"
              fill
              priority
              sizes="(max-width: 1023px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
