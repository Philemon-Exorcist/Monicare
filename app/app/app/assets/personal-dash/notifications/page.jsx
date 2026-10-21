"use client";

import { useState } from "react";
import Sidebar from "../dash-comp/Sidebar";

export default function NotificationsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="relative mx-auto flex w-full max-w-[1440px] flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
        <div
          className={`fixed inset-0 z-40 transform bg-slate-900 transition-transform duration-300 ease-in-out lg:hidden ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar profile={null} isLoading={false} />
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="absolute right-4 top-4 text-white"
            aria-label="Close sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="hidden lg:block lg:h-full lg:flex-shrink-0 lg:overflow-y-auto">
          <Sidebar profile={null} isLoading={false} />
        </div>

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-end lg:hidden">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2" aria-label="Open sidebar">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
          </div>

          <section className="mx-auto max-w-4xl rounded-[28px] border border-neutral-200 bg-white px-6 py-8 shadow-[0_28px_90px_rgba(15,23,42,0.08)] sm:px-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-neutral-500">Notifications</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-black">Activity feed</h1>
            <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 bg-[#fafafa] px-6 py-8">
              <p className="text-sm font-semibold text-black">Notifications are not available yet.</p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
                This version does not load notifications from the backend. Check your circle page for current group information.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
