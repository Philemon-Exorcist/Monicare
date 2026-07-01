export default function CommunitySection() {
  return (
    <section id="features" className="bg-slate-950 text-white">
      <div className="mx-auto max-w-[1200px] px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.52fr_0.48fr] lg:items-center">
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-yellow-300">Built for the Modern Community.</p>
            <h2 className="text-4xl font-semibold tracking-tight">Zero-border access, link-driven virality, and no hidden fees.</h2>
            <div className="space-y-4 rounded-[2rem] border border-white/10 bg-white/5 p-7">
              <div>
                <p className="font-semibold text-white">Zero-Border Access</p>
                <p className="mt-2 text-sm text-slate-300">No app to download. Fully browser-based experience optimized for mobile-first communities across the continent.</p>
              </div>
              <div>
                <p className="font-semibold text-white">Link-Driven Virality</p>
                <p className="mt-2 text-sm text-slate-300">Onboarding happens at the speed of social sharing. One link is all it takes to activate a community of savers.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
              <p className="text-sm uppercase tracking-[0.3em] text-yellow-300">10k+</p>
              <p className="mt-4 text-3xl font-semibold">Active circles</p>
              <p className="mt-3 text-sm text-slate-300">Savers collaborating across groups with automated routing.</p>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
              <p className="text-sm uppercase tracking-[0.3em] text-yellow-300">1% flat commission</p>
              <p className="mt-4 text-3xl font-semibold">Minimal platform fee</p>
              <p className="mt-3 text-sm text-slate-300">Transparent pricing with zero surprise charges for regular users.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
