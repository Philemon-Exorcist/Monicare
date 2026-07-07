"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDashboardProfile, getSavingsGroups } from "../../../../components/api";
import Sidebar from "../dash-comp/Sidebar";

export default function MyCirclePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    const token =
      window.localStorage.getItem("monicare_access_token") ||
      window.sessionStorage.getItem("monicare_access_token");

    if (!token) {
      setIsLoadingProfile(false);
      return;
    }

    let isMounted = true;

    async function loadProfile() {
      try {
        const response = await getDashboardProfile(token);
        if (isMounted) {
          setProfile(response?.data || null);
        }
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const token =
      window.localStorage.getItem("monicare_access_token") ||
      window.sessionStorage.getItem("monicare_access_token");

    if (!token) {
      setIsLoadingRecords(false);
      return;
    }

    let isMounted = true;

    async function loadGroups() {
      try {
        const response = await getSavingsGroups(token);
        if (!isMounted) return;

        setRecords(
          Array.isArray(response?.data)
            ? response.data.map((group, index) => ({
                ...group,
                id: group.group_id || group.id || `circle-${index}`,
                name: group.title || group.group_name,
                amount: group.contribution_amount,
                cadence: group.cycle_period,
                source: group.status,
                inviteLink: group.group_link,
              }))
            : []
        );
      } catch (error) {
        console.error("Failed to load savings groups", error);
        if (isMounted) setRecords([]);
      } finally {
        if (isMounted) setIsLoadingRecords(false);
      }
    }

    loadGroups();

    return () => {
      isMounted = false;
    };
  }, []);

  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = safeParse(window.localStorage.getItem("monicare_circle_records"), []);
      setRecords(
        Array.isArray(stored)
          ? stored.map((record, index) => ({
              ...record,
              id: record.id || record.name?.toLowerCase().replace(/\s+/g, "-") || `circle-${index}`,
            }))
          : []
      );
    } catch {
      setRecords([]);
    } finally {
      setIsLoadingRecords(false);
    }
  }, []);

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

          <section className="mx-auto max-w-4xl">
            <div className="rounded-[28px] border border-neutral-200 bg-white px-6 py-8 shadow-[0_28px_90px_rgba(15,23,42,0.08)] sm:px-10">
              <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-neutral-500">My Savings Circles</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-black">Tracked circles</h1>
              <p className="mt-3 text-sm leading-6 text-neutral-500">
                Created and joined groups are recorded here so you can keep tabs on every circle in one place.
              </p>

              <div className="mt-8 grid gap-4">
                {isLoadingRecords ? (
                  <div className="rounded-3xl border border-dashed border-neutral-300 bg-[#fafafa] px-6 py-10 text-center text-neutral-500 shadow-sm">
                    <p className="text-base font-black text-black">Loading circles...</p>
                    <p className="mx-auto mt-3 max-w-xl text-sm leading-6">
                      Your saved circles will appear here once they are retrieved from the backend.
                    </p>
                  </div>
                ) : records.length ? (
                  records.map((record) => (
                    <CircleCard
                      key={`${record.name}-${record.createdAt}`}
                      record={record}
                      onView={() => router.push(`/assets/personal-dash/group-saving/${encodeURIComponent(record.id)}`)}
                    />
                  ))
                ) : (
                  <EmptyState />
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function safeParse(value, fallback) {
  if (!value) return fallback;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function CircleCard({ record, onView }) {
  return (
    <article
      onClick={onView}
      className="group cursor-pointer rounded-2xl border border-neutral-200 bg-[#fbfbfa] p-5 transition hover:border-black"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-black text-black">{record.name}</p>
          <p className="mt-2 text-sm text-neutral-500">{record.source}</p>
        </div>
        <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-600">
          {record.status}
        </span>
      </div>
      <div className="mt-4 grid gap-2 text-sm text-neutral-600 sm:grid-cols-3">
        <div><span className="font-mono text-[10px] uppercase tracking-[0.28em] text-neutral-400">Cadence</span><p className="mt-1 font-semibold text-black">{record.cadence}</p></div>
        <div><span className="font-mono text-[10px] uppercase tracking-[0.28em] text-neutral-400">Amount</span><p className="mt-1 font-semibold text-black">{new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(Number(record.amount || 0))}</p></div>
        <div><span className="font-mono text-[10px] uppercase tracking-[0.28em] text-neutral-400">Created</span><p className="mt-1 font-semibold text-black">{new Date(record.createdAt).toLocaleString()}</p></div>
      </div>
      {record.inviteLink ? <p className="mt-4 break-all rounded-xl bg-white px-4 py-3 font-mono text-xs text-neutral-500">{record.inviteLink}</p> : null}
    </article>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-neutral-300 bg-[#fafafa] px-8 py-14 text-center text-neutral-500 shadow-sm">
      <p className="text-lg font-black text-black">No circles recorded yet</p>
      <p className="mt-3 mx-auto max-w-xl text-sm leading-6">
        Create a new circle or join an existing one, and your saved groups will appear here once the backend provides the data.
      </p>
    </div>
  );
}
