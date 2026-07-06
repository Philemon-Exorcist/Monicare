export default function GroupTimeline() {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-neutral-500">
          Payout Timeline
        </p>
        <button type="button" className="text-xs font-semibold text-neutral-500 hover:text-black">
          + Add Edit
        </button>
      </div>
      <div className="mt-4 space-y-3">
        <TimelineRow label="Week 1" />
        <TimelineRow label="Week 2" />
      </div>
    </section>
  );
}

function TimelineRow({ label }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3">
      <span className="text-sm font-semibold">{label}</span>
      <span className="font-mono text-xs text-neutral-500">Slot assignment</span>
    </div>
  );
}
