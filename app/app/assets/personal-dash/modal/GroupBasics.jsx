export default function GroupBasics() {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5">
      <Field label="Circle Name" placeholder="e.g. Tech Cohort Savings" />
      <Field label="Contribution Amount" placeholder="₦ 0.00" />
      <Field label="Cycle Frequency" placeholder="Weekly" />
    </section>
  );
}

function Field({ label, placeholder }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-neutral-500">{label}</span>
      <input
        type="text"
        placeholder={placeholder}
        className="mt-2 w-full border-0 border-b border-neutral-300 px-0 py-3 text-sm outline-none placeholder:text-neutral-400 focus:border-black focus:ring-0"
      />
    </label>
  );
}
