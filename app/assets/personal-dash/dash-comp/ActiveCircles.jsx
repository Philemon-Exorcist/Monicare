"use client";

import { useRouter } from "next/navigation";

export default function ActiveCircles({ groups = [] }) {
  const router = useRouter();
  const circles = Array.isArray(groups) ? groups : [];
  const hasCircles = circles.length > 0;

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black">My Active Circles</h2>
          <p className="text-sm text-neutral-500">Live circles and pending group activity from the backend appear here.</p>
        </div>
        <button className="text-xs font-semibold text-neutral-500 hover:text-black">View all --&gt;</button>
      </div>

      {hasCircles ? (
        <div className="space-y-3">
          {circles.map((circle) => (
            <CircleRow
              key={circle.group_id || circle.id}
              circle={circle}
              onView={() => router.push(`/assets/personal-dash/group-saving/${encodeURIComponent(circle.group_id || circle.id)}`)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-neutral-300 bg-white px-6 py-10 text-center text-neutral-500 shadow-sm">
          <p className="text-sm font-black text-black">No active circles available yet.</p>
          <p className="mt-3 text-sm leading-6">Once your backend sends active circle data, it will appear here with your position, amount, and cadence details.</p>
        </div>
      )}
    </section>
  );
}

function CircleRow({ circle, onView }) {
  const amount = Number(circle.contribution_amount || circle.amount || 0);
  const statusTone =
    String(circle.status || "").toUpperCase() === "MANUAL PAY"
      ? "bg-neutral-100 text-neutral-500"
      : "bg-emerald-50 text-emerald-500";

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-white px-5 py-4 transition hover:border-black sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-black">{circle.title || circle.group_name || circle.name}</h3>
          <span className={`rounded px-2 py-1 font-mono text-[10px] font-bold ${statusTone}`}>
            {circle.status}
          </span>
        </div>
        <p className="mt-3 font-mono text-[11px] text-neutral-500">
          Your Position: <span className="font-black text-black">{circle.slot_position ? `Slot ${circle.slot_position}` : "Pending slot"}</span>
          <span className="mx-4" />
          <span className="font-black text-black">
            {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount)}
          </span>{" "}
          /{circle.cycle_period || circle.cadence}
        </p>
      </div>

      <button
        type="button"
        onClick={onView}
        className="h-10 rounded-lg bg-black px-5 text-sm font-black text-white transition hover:bg-neutral-800"
      >
        View Circle
      </button>
    </div>
  );
}
