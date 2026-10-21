import Link from "next/link";

const principles = [
  {
    number: "01",
    title: "Make the agreement clear",
    description:
      "Set the contribution, cadence, membership, and payout order before the circle begins. Everyone should know what they are joining.",
  },
  {
    number: "02",
    title: "Keep every member informed",
    description:
      "Give members one place to review their circle, upcoming contributions, and payout position—without relying on scattered messages.",
  },
  {
    number: "03",
    title: "Show what has happened",
    description:
      "Keep payment states and activity visible. A contribution should not be presented as settled until it has been recorded.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#f7f7f3] text-[#17211c]">
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Link href="/" className="flex items-center gap-3" aria-label="Monicare home">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#183d32] text-sm font-black text-white">
            M
          </span>
          <span className="text-lg font-bold tracking-tight">Monicare</span>
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-5 sm:gap-8">
          <a href="#how-it-works" className="hidden text-sm font-medium text-[#5c6961] transition hover:text-[#183d32] sm:inline">
            How it works
          </a>
          <a href="#trust" className="hidden text-sm font-medium text-[#5c6961] transition hover:text-[#183d32] sm:inline">
            Our commitment
          </a>
          <Link
            href="/auth/login#login"
            className="rounded-full border border-[#cdd6cf] px-4 py-2 text-sm font-semibold transition hover:border-[#183d32] hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183d32]"
          >
            Log in
          </Link>
          <Link
            href="/auth/login#signup"
            className="rounded-full bg-[#183d32] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#245545] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183d32]"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main>
        <section className="relative mx-auto grid min-h-[620px] max-w-7xl items-center gap-12 px-5 pb-20 pt-12 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-12 lg:pb-28 lg:pt-16">
          <div className="relative z-[1] max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#cad8ca] bg-white/70 px-3 py-1.5 text-xs font-semibold text-[#315b48]">
              <span className="h-2 w-2 rounded-full bg-[#4d8063]" />
              A clearer way to save together
            </p>
            <h1 className="mt-7 max-w-[11ch] text-5xl font-semibold leading-[1.02] tracking-[-0.055em] text-[#183d32] sm:text-6xl lg:text-7xl">
              Trust grows when everyone can see the plan.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#58675e] sm:text-lg">
              Monicare helps people organize trusted savings circles, keep contribution plans in view, and follow each member&apos;s turn—together, with fewer uncertainties.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/auth/login#signup"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#183d32] px-6 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#245545] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183d32]"
              >
                Start a savings circle
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#cdd6cf] px-6 text-sm font-semibold text-[#274c3a] transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183d32]"
              >
                See how it works
              </a>
            </div>
            <p className="mt-5 max-w-lg text-xs leading-5 text-[#718077]">
              Built to support trust and transparency. Members should still agree on circle rules and only invite people they know.
            </p>
          </div>

          <div aria-label="Illustration of a savings circle plan" className="relative mx-auto w-full max-w-lg">
            <div className="absolute -right-6 -top-6 h-44 w-44 rounded-full bg-[#e4e8d5] blur-2xl" />
            <div className="absolute -bottom-8 -left-6 h-48 w-48 rounded-full bg-[#d7e5d8] blur-2xl" />
            <div className="relative rounded-[2rem] border border-white/80 bg-[#e9eee5] p-4 shadow-[0_28px_70px_rgba(31,66,47,0.12)] sm:p-6">
              <div className="rounded-[1.5rem] bg-white p-5 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-[#78867b]">EXAMPLE CIRCLE</p>
                    <h2 className="mt-2 text-xl font-bold tracking-tight text-[#183d32]">The Sunday Table</h2>
                  </div>
                  <span className="rounded-md bg-[#edf4ed] px-2.5 py-1.5 text-xs font-semibold text-[#396647]">In progress</span>
                </div>
                <div className="mt-7 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-[#f6f8f4] p-4">
                    <p className="text-xs text-[#748176]">Contribution</p>
                    <p className="mt-2 text-lg font-bold tabular-nums text-[#183d32]">₦25,000</p>
                    <p className="mt-1 text-xs text-[#748176]">Every month</p>
                  </div>
                  <div className="rounded-xl bg-[#f6f8f4] p-4">
                    <p className="text-xs text-[#748176]">Your turn</p>
                    <p className="mt-2 text-lg font-bold text-[#183d32]">Round 3</p>
                    <p className="mt-1 text-xs text-[#748176]">Payout position</p>
                  </div>
                </div>
                <div className="mt-6">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#334b3c]">Circle setup</span>
                    <span className="text-[#748176]">4 of 6 members</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e8ede7]">
                    <div className="h-full w-2/3 rounded-full bg-[#5c8668]" />
                  </div>
                </div>
                <div className="mt-6 border-t border-[#edf0eb] pt-5">
                  <p className="text-xs font-semibold text-[#748176]">NEXT CONTRIBUTION</p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#25392c]">Due 12 November</p>
                      <p className="mt-1 text-xs text-[#748176]">Check status in your account</p>
                    </div>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f2f5ef] text-[#4d7559]" aria-hidden="true">↗</span>
                  </div>
                </div>
              </div>
              <div className="absolute -left-5 top-[48%] hidden items-center gap-3 rounded-xl border border-[#e6ebe3] bg-white px-4 py-3 shadow-lg sm:flex">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#edf4ed] text-[#3d6a4a]" aria-hidden="true">✓</span>
                <span>
                  <span className="block text-xs font-semibold text-[#25392c]">Shared expectations</span>
                  <span className="mt-0.5 block text-[11px] text-[#748176]">Visible to the circle</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-y border-[#e5e9e1] bg-white">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-24">
            <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#647a68]">A shared process</p>
                <h2 className="mt-4 max-w-sm text-3xl font-semibold leading-tight tracking-[-0.04em] text-[#183d32] sm:text-4xl">
                  Good circles start with clarity.
                </h2>
                <p className="mt-4 max-w-md text-sm leading-6 text-[#657268]">
                  Put the practical details in one place so members can make informed decisions before they commit.
                </p>
              </div>
              <div className="grid gap-8 sm:grid-cols-3">
                {principles.map((principle) => (
                  <article key={principle.number} className="border-t border-[#b9c9ba] pt-4">
                    <p className="font-mono text-xs text-[#718374]">{principle.number}</p>
                    <h3 className="mt-7 text-lg font-semibold tracking-tight text-[#25392c]">{principle.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#68766c]">{principle.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="trust" className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_1fr] lg:items-center lg:px-12 lg:py-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#647a68]">Trust is a practice</p>
            <h2 className="mt-4 max-w-lg text-3xl font-semibold leading-tight tracking-[-0.04em] text-[#183d32] sm:text-4xl">
              Clear records. Shared rules. No guesswork.
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-6 text-[#657268]">
              Monicare is being built to make group saving more transparent—not to replace the conversations and mutual care that make a circle work. Review the terms with your group and confirm each payment through its recorded status.
            </p>
          </div>
          <div className="rounded-2xl border border-[#dfe6dd] bg-white p-6 sm:p-8">
            <div className="flex items-start gap-4 border-b border-[#edf0eb] pb-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#edf4ed] font-mono text-xs font-semibold text-[#396647]">01</span>
              <div>
                <h3 className="text-sm font-semibold text-[#25392c]">Agree before you join</h3>
                <p className="mt-1.5 text-sm leading-6 text-[#68766c]">Contribution amounts, timing, and payout order should be visible to members.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 border-b border-[#edf0eb] py-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#edf4ed] font-mono text-xs font-semibold text-[#396647]">02</span>
              <div>
                <h3 className="text-sm font-semibold text-[#25392c]">Check payment status</h3>
                <p className="mt-1.5 text-sm leading-6 text-[#68766c]">A pending payment is not the same as a confirmed one. Check your activity record.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 pt-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#edf4ed] font-mono text-xs font-semibold text-[#396647]">03</span>
              <div>
                <h3 className="text-sm font-semibold text-[#25392c]">Protect your information</h3>
                <p className="mt-1.5 text-sm leading-6 text-[#68766c]">Use your own account, keep sign-in details private, and share sensitive information only when required.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#183d32]">
          <div className="mx-auto flex max-w-7xl flex-col gap-7 px-5 py-14 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b6cdb9]">Start with your people</p>
              <h2 className="mt-3 max-w-xl text-2xl font-semibold tracking-[-0.035em] text-white sm:text-3xl">
                Build a circle around the trust you already share.
              </h2>
            </div>
            <Link
              href="/auth/login#signup"
              className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-[#e7e9c9] px-6 text-sm font-semibold text-[#183d32] transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Create your account
            </Link>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-xs text-[#718077] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
        <p>Monicare — saving together, with clarity.</p>
        <a href="mailto:hello@monicare.app" className="font-medium transition hover:text-[#183d32]">Contact Monicare</a>
      </footer>
    </div>
  );
}
