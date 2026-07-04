"use client";

import { useEffect, useState } from "react";
import { circles as fallbackCircles } from "./dashboardData";

const RECORDS_STORAGE_KEY = "monicare_circle_records";

function safeParse(value, fallback) {
  if (!value) return fallback;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export default function ActiveCircles() {
  const [circles, setCircles] = useState(fallbackCircles);

  useEffect(() => {
    const stored = safeParse(window.localStorage.getItem(RECORDS_STORAGE_KEY), []);
    if (Array.isArray(stored) && stored.length) {
      setCircles(
        stored.map((item) => ({
          name: item.name,
          status: item.status,
          position: item.selectedSlot || item.position || "Pending slot",
          amount: item.amount,
          cadence: item.cadence,
        }))
      );
    }
  }, []);

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-base font-black">My Active Circles</h2>
        <button className="text-xs font-semibold text-neutral-500 hover:text-black">View all --&gt;</button>
      </div>

      <div className="space-y-3">
        {circles.map((circle) => (
          <CircleRow key={circle.name} circle={circle} />
        ))}
      </div>
    </section>
  );
}

function CircleRow({ circle }) {
  const statusTone =
    circle.status === "Manual Pay"
      ? "bg-neutral-100 text-neutral-500"
      : "bg-emerald-50 text-emerald-500";

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-black">{circle.name}</h3>
          <span className={`rounded px-2 py-1 font-mono text-[10px] font-bold ${statusTone}`}>
            {circle.status}
          </span>
        </div>
        <p className="mt-3 font-mono text-[11px] text-neutral-500">
          Your Position: <span className="font-black text-black">{circle.position}</span>
          <span className="mx-4" />
          <span className="font-black text-black">{circle.amount}</span> /{circle.cadence}
        </p>
      </div>

      <button className="h-10 rounded-lg bg-black px-5 text-sm font-black text-white transition hover:bg-neutral-800">
        View Circle
      </button>
    </div>
  );
}
