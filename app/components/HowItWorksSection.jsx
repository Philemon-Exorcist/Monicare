const steps = [
  {
    title: "Create Circle",
    description: "Define your goal, contribution amount, and payout frequency in seconds.",
  },
  {
    title: "Invite Peers",
    description: "Share your unique group link. Members join with one tap via our browser-based app.",
  },
  {
    title: "Save & Payout",
    description: "Automated collections ensure consistency. Payouts rotate fairly to each member.",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-white text-slate-950">
      <div className="mx-auto max-w-[1200px] px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-yellow-500">How it Works</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight">Three simple steps to financial sovereignty.</h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.title} className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8 shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-yellow-400 text-xl font-bold text-slate-950">
                {step.title.charAt(0)}
              </div>
              <h3 className="mt-6 text-xl font-semibold text-slate-950">{step.title}</h3>
              <p className="mt-4 text-sm leading-6 text-slate-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
