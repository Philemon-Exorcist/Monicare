import Link from "next/link";

export default function Cta() {
  return (
    <section className="bg-yellow-400 text-slate-950">
      <div className="mx-auto max-w-[1200px] px-6 py-20 lg:px-8">
        <div className="rounded-[2rem] bg-slate-950/5 p-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-950/70">Start your first circle today.</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight">Create Your Savings Link</h2>
          <p className="mt-4 max-w-2xl mx-auto text-base leading-7 text-slate-950/75">
            Launch a new savings circle, invite peers, and manage contributions with a single secure link.
          </p>
          <div className="mt-10">
            <Link
              href="/auth/login#signup"
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-8 py-4 text-base font-semibold text-white transition hover:bg-slate-900"
            >
              Create Your Savings Link
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
