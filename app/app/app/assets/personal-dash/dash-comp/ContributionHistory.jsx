"use client";

export default function ContributionHistory() {
  return (
    <section className="mt-8 pb-10">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black">Contribution History</h2>
          <p className="text-sm text-neutral-500">Only confirmed contribution records belong in this list.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-8 text-neutral-600">
        <p className="text-sm font-semibold text-black">Contribution history is not available yet.</p>
        <p className="mt-2 max-w-2xl text-sm leading-6">
          Your circles are shown above, but this account endpoint does not yet return confirmed contribution transactions. No activity is being inferred from group membership.
        </p>
      </div>
    </section>
  );
}
