export default function SecuritySection() {
  return (
    <section id="security" className="bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-[1200px] px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.6fr_0.4fr] lg:items-center">
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Native-Grade Security.</p>
            <h2 className="text-4xl font-semibold tracking-tight">Native-Grade Security. Nomba Infrastructure.</h2>
            <p className="max-w-xl text-lg leading-8 text-slate-600">
              Your savings are protected by the same infrastructure that powers thousands of businesses. We charge a simple, transparent 1% platform commission on every payout to keep the engine running smoothly.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                "NPM compliant",
                "PCI DSS Level 1",
                "ISO 27001 secure",
              ].map((item) => (
                <span key={item} className="inline-flex rounded-full bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-slate-700 shadow-sm">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="rounded-[1.75rem] bg-slate-100 p-6">
              <p className="font-semibold text-slate-950">Total Transparency</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">View every transaction, every member contribution, and every scheduled payout in a live, immutable ledger.</p>
            </div>
            <div className="rounded-[1.75rem] bg-slate-100 p-6">
              <p className="font-semibold text-slate-950">Escrow Protection</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">Funds are held in a secure Nomba-managed escrow account, released only when the payout cycle conditions are met.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
