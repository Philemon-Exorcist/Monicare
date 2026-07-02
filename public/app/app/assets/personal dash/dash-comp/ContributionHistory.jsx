import { contributions } from "./dashboardData";

export default function ContributionHistory() {
  return (
    <section className="mt-8 pb-10">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-base font-black">Contribution History</h2>
        <button className="text-xs font-semibold text-neutral-500 hover:text-black">Export --&gt;</button>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200">
        <div className="grid grid-cols-[1.1fr_1.7fr_1fr_0.8fr] bg-neutral-50 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.28em] text-neutral-500">
          <span>Date</span>
          <span>Circle</span>
          <span className="text-right">Amount</span>
          <span className="text-right">Status</span>
        </div>
        {contributions.map((item) => (
          <div
            key={`${item.date}-${item.circle}`}
            className="grid grid-cols-[1.1fr_1.7fr_1fr_0.8fr] items-center border-t border-neutral-200 px-5 py-4 text-xs sm:text-sm"
          >
            <span className="font-mono text-neutral-600">{item.date}</span>
            <span className="font-bold">{item.circle}</span>
            <span className="text-right font-mono font-black">{item.amount}</span>
            <span className="text-right font-mono font-bold text-emerald-500">OK {item.status}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
