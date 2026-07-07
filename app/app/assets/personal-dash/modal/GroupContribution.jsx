export default function GroupContribution() {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-neutral-500">
        Payment Selection
      </p>
      <div className="mt-4 flex gap-3">
        <Option active>Manual</Option>
        <Option>AutoPay</Option>
      </div>
    </section>
  );
}

function Option({ children, active = false }) {
  return (
    <button
      type="button"
      className={`rounded-md px-4 py-2 text-sm font-black transition ${
        active ? "bg-[#070707] text-white" : "bg-neutral-100 text-neutral-500"
      }`}
    >
      {children}
    </button>
  );
}
