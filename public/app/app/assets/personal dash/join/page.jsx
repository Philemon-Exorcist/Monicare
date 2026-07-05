"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "../dash-comp/Sidebar";

const JOIN_STORAGE_KEY = "monicare_pending_join";
const RECORDS_STORAGE_KEY = "monicare_circle_records";

function safeParse(value, fallback) {
  if (!value) return fallback;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export default function JoinCirclePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState("Slot 3");
  const [joinState, setJoinState] = useState("form");
  const [error, setError] = useState("");
  const [draft, setDraft] = useState(null);

  const inviteCode = searchParams.get("invite") || "7x92-k9lb";
  const circle = useMemo(
    () => ({
      name: "Tech Cohort Savings",
      amount: "N50,000.00",
      frequency: "Weekly",
      payoutMode: "First-Come, First-Served (Member Picked)",
      inviteLink: `https://monicare.app/join?invite=${inviteCode}`,
    }),
    [inviteCode]
  );

  useEffect(() => {
    const token =
      window.localStorage.getItem("monicare_access_token") ||
      window.sessionStorage.getItem("monicare_access_token");

    if (token) {
      setIsLoadingProfile(false);
    } else {
      setIsLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    try {
      const stored = safeParse(window.localStorage.getItem(JOIN_STORAGE_KEY), null);
      if (stored?.inviteCode === inviteCode) {
        setDraft(stored);
        if (stored.selectedSlot) {
          setSelectedSlot(stored.selectedSlot);
        }
      }
    } catch {
      setDraft(null);
    }
  }, [inviteCode]);

  const handleRequireAuth = () => {
    window.localStorage.setItem(
      JOIN_STORAGE_KEY,
      JSON.stringify({ inviteCode, selectedSlot, circle, status: "pending-auth" })
    );
    window.localStorage.setItem("monicare_post_auth_redirect", "/assets/personal%20dash/join?invite=" + inviteCode);
    router.push("/auth/login#signup");
  };

  const handleAccept = () => {
    const token =
      window.localStorage.getItem("monicare_access_token") ||
      window.sessionStorage.getItem("monicare_access_token");

    if (!token) {
      setError("Please register or log in to continue your invite.");
      handleRequireAuth();
      return;
    }

    const record = {
      name: circle.name,
      status: "Joined",
      cadence: circle.frequency,
      amount: circle.amount,
      source: "Joined circle",
      inviteLink: circle.inviteLink,
      createdAt: new Date().toISOString(),
      selectedSlot,
    };

    const existing = safeParse(window.localStorage.getItem(RECORDS_STORAGE_KEY), []);
    const nextRecords = [record, ...existing.filter((item) => item.inviteLink !== circle.inviteLink)];
    window.localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(nextRecords));
    window.localStorage.removeItem(JOIN_STORAGE_KEY);
    setJoinState("success");
  };

  useEffect(() => {
    const token =
      window.localStorage.getItem("monicare_access_token") ||
      window.sessionStorage.getItem("monicare_access_token");

    if (token && draft && draft.status === "pending-auth") {
      handleAccept();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

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

          <section className="mx-auto max-w-3xl rounded-[28px] border border-neutral-200 bg-white px-5 py-8 shadow-[0_28px_90px_rgba(15,23,42,0.08)] sm:px-8 lg:px-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-neutral-500">Invite only</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-black sm:text-4xl">
              You&apos;ve been invited to join an Esusu Circle
            </h1>
            <p className="mt-3 text-sm leading-6 text-neutral-500">
              Review the circle details, pick your payout slot, and accept the invite to join.
            </p>

            <div className="mt-8 rounded-2xl border border-neutral-200 bg-[#fbfbfa] p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoCard label="Circle" value={circle.name} />
                <InfoCard label="Contribution" value={circle.amount} />
                <InfoCard label="Payout mode" value={circle.payoutMode} />
                <InfoCard label="Frequency" value={circle.frequency} />
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between gap-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-neutral-500">Select Payout Slot</p>
                <p className="text-xs font-semibold text-neutral-400">{selectedSlot} selected</p>
              </div>
              <div className="mt-4 space-y-3">
                {[
                  "Slot 1 - Available",
                  "Slot 2 - Available",
                  "Slot 3 - Best fit",
                  "Slot 4 - Available",
                  "Slot 5 - Available",
                ].map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot.split(" - ")[0])}
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-4 text-left transition ${
                      selectedSlot === slot.split(" - ")[0]
                        ? "border-emerald-400 bg-emerald-50"
                        : "border-neutral-200 bg-white hover:border-neutral-300"
                    }`}
                  >
                    <span className="text-sm font-semibold text-black">{slot.split(" - ")[0]}</span>
                    <span className="text-xs font-medium text-neutral-500">{slot.split(" - ")[1]}</span>
                  </button>
                ))}
              </div>
            </div>

            {error ? <p className="mt-6 text-sm text-rose-500">{error}</p> : null}

            {joinState === "success" ? (
              <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                <p className="text-2xl font-black text-emerald-700">You&apos;re in.</p>
                <p className="mt-2 text-sm text-emerald-700">Your circle has been recorded in My Savings Circles.</p>
                <button
                  type="button"
                  onClick={() => router.push("/assets/personal%20dash/my-circle")}
                  className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-[#ffc400] px-5 text-sm font-black text-black transition hover:bg-[#ffd33d]"
                >
                  View My Circles
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAccept}
                className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#ffc400] px-5 text-sm font-black text-black transition hover:bg-[#ffd33d]"
              >
                Accept Invite & Join Circle
              </button>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-neutral-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-black">{value}</p>
    </div>
  );
}
