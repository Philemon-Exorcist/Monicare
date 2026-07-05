"use client";

import { useEffect, useState } from "react";
import Sidebar from "../dash-comp/Sidebar";

const DEFAULT_NOTIFICATIONS = [
  {
    title: "Your circle invite was accepted",
    detail: "Tech Cohort Savings now has 12 members.",
    time: "2 hours ago",
  },
  {
    title: "Payout slot confirmed",
    detail: "Your selected payout slot is now reserved.",
    time: "1 day ago",
  },
  {
    title: "New savings reminder",
    detail: "A contribution window opens tomorrow at 9:00 AM.",
    time: "3 days ago",
  },
];

export default function NotificationsPage() {
  const [profile, setProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsLoadingProfile(false);
    const timeout = window.setTimeout(() => {
      setNotifications([]);
    }, 400);
    return () => window.clearTimeout(timeout);
  }, []);

  const shouldShowPlaceholder = notifications.length === 0;

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="relative mx-auto flex w-full max-w-[1440px] flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
        <div
          className={`fixed inset-0 z-40 transform bg-slate-900 transition-transform duration-300 ease-in-out lg:hidden ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar profile={profile} isLoading={isLoadingProfile} />
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
          <Sidebar profile={profile} isLoading={isLoadingProfile} />
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
            <p className="mt-3 text-sm leading-6 text-neutral-500">
              Your saving circle notifications will appear here once the backend delivers activity data.
            </p>

            {shouldShowPlaceholder ? (
              <div className="mt-8 rounded-3xl border border-dashed border-neutral-300 bg-[#fafafa] px-6 py-10 text-center text-neutral-500 shadow-sm">
                <p className="text-base font-black text-black">Waiting for notifications</p>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6">
                  We are ready to show your activity feed when notification data is available from the backend.
                </p>
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="rounded-3xl border border-neutral-200 bg-white p-4 text-left">
                      <div className="h-3 w-24 rounded-full bg-neutral-200" />
                      <div className="mt-3 h-4 w-32 rounded-full bg-neutral-200" />
                      <div className="mt-4 h-3 w-16 rounded-full bg-neutral-200" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-8 space-y-4">
                {notifications.map((item) => (
                  <article key={item.title} className="rounded-2xl border border-neutral-200 bg-[#fbfbfa] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-sm font-black text-black">{item.title}</h2>
                        <p className="mt-2 text-sm text-neutral-500">{item.detail}</p>
                      </div>
                      <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.28em] text-neutral-400">
                        {item.time}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
