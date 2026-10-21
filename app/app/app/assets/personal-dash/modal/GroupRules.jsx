export default function GroupRules() {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-[#fbfbfa] p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-neutral-500">
        Circle Rules
      </p>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-neutral-600">
        <li>Set the contribution cadence before sending invitations.</li>
        <li>Confirm the payout order so every member knows their slot.</li>
        <li>Review the invite text and make sure the group details are correct.</li>
      </ul>
    </section>
  );
}
