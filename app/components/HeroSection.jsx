import Image from "next/image";
import Link from "next/link";
import heroImage from "../assets/istockphoto-1717120374-1024x1024.jpg";

export default function HeroSection() {
  return (
    <section className="w-full overflow-hidden bg-[#ffcc00]">
      <div className="mx-auto grid min-h-[min(100vh,760px)] max-w-[1400px] grid-cols-1 lg:grid-cols-2">
        <div className="flex h-full items-center bg-[#020724] px-6 py-12 text-white sm:px-10 lg:px-14 lg:py-16">
          <div className="mx-auto w-full max-w-[620px]">
            <h1 className="max-w-[10ch] text-[clamp(3rem,6vw,5.75rem)] font-extrabold leading-[0.95] tracking-[-0.04em] text-white">
              Turn your community into a wealth-building engine.
            </h1>

            <p className="mt-8 max-w-[560px] text-base leading-8 text-white/80 sm:text-lg">
              Create, manage and grow your savings circle with automated contributions, transparent payouts and one shareable link.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/auth/login"
                className="inline-flex h-14 items-center justify-center rounded-full bg-[#ffcc00] px-8 text-base font-bold text-black transition hover:bg-[#ffe066]"
              >
                Get Started
              </Link>
              <a
                href="#features"
                className="inline-flex h-14 items-center justify-center rounded-full border border-white/10 bg-white/5 px-8 text-base font-bold text-white transition hover:border-white/20 hover:bg-white/10"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>

        <div className="flex h-full items-center justify-center bg-[#ffcc00] px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
          <div className="relative aspect-[4/5] w-full max-w-[520px] overflow-hidden rounded-[34px] shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
            <Image
              src={heroImage}
              alt="Smiling older couple using a phone"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 520px"
              className="object-cover object-center"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
