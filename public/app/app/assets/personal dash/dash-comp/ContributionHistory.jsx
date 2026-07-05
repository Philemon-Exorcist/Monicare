"use client";

import { useEffect, useState } from "react";
import { contributions as fallbackContributions } from "./dashboardData";

const RECORDS_STORAGE_KEY = "monicare_circle_records";

function safeParse(value, fallback) {
  if (!value) return fallback;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export default function ContributionHistory() {
  const [contributions, setContributions] = useState(fallbackContributions);

  useEffect(() => {
    const stored = safeParse(window.localStorage.getItem(RECORDS_STORAGE_KEY), []);
    if (Array.isArray(stored) && stored.length) {
      setContributions(
        stored.map((item, index) => ({
          date: new Date(item.createdAt || Date.now() - index * 86400000).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          circle: item.name,
          amount: item.amount,
          status: item.status === "Joined" ? "Joined circle" : "Created circle",
        }))
      );
    }
  }, []);

  const hasContributions = Array.isArray(contributions) && contributions.length > 0;

  return (
    <section className="mt-8 pb-10">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black">Contribution History</h2>
          <p className="text-sm text-neutral-500">Your transaction and contribution activity will populate once the backend sends history data.</p>
        </div>
        <button className="text-xs font-semibold text-neutral-500 hover:text-black">Export --&gt;</button>
      </div>

      {hasContributions ? (
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
      ) : (
        <div className="rounded-3xl border border-dashed border-neutral-300 bg-white px-6 py-10 text-center text-neutral-500 shadow-sm">
          <p className="text-sm font-black text-black">Waiting for contribution history</p>
          <p className="mt-3 text-sm leading-6">Your contribution history will appear here when backend data is available.</p>
        </div>
      )}
    </section>
  );
}
