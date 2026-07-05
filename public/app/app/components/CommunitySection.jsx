export default function CommunitySection() {
  return (
    <section id="features" className="bg-slate-950 text-white">
      <div className="mx-auto max-w-[1200px] px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-yellow-300">Built for the Modern Community.</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight">Zero-border access, link-driven virality, and no hidden fees.</h2>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:grid-rows-2">
          {/* Main Feature Card */}
          <div className="space-y-6 rounded-[2rem] border border-white/10 bg-white/5 p-8 lg:row-span-2">
            <h3 className="text-xl font-semibold text-white">Zero-Border Access</h3>
            <p className="text-sm text-slate-300">No app to download. Fully browser-based experience optimized for mobile-first communities across the continent.</p>
            <div className="border-t border-white/10 pt-6">
              <h3 className="text-xl font-semibold text-white">Link-Driven Virality</h3>
              <p className="mt-2 text-sm text-slate-300">Onboarding happens at the speed of social sharing. One link is all it takes to activate a community of savers.</p>
            </div>
          </div>

          {/* Stat Card 1 */}
          <div className="flex flex-col justify-between rounded-[2rem] border border-white/10 bg-white/5 p-8">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-yellow-300">10k+</p>
              <p className="mt-2 text-3xl font-semibold">Active circles</p>
            </div>
            <p className="mt-3 text-sm text-slate-300">Savers collaborating across groups with automated routing.</p>
          </div>

          {/* Stat Card 2 */}
          <div className="flex flex-col justify-between rounded-[2rem] border border-white/10 bg-white/5 p-8">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-yellow-300">1% flat commission</p>
              <p className="mt-2 text-3xl font-semibold">Minimal platform fee</p>
            </div>
            <p className="mt-3 text-sm text-slate-300">Transparent pricing with zero surprise charges for regular users.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
