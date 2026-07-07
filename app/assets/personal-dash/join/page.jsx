"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "../dash-comp/Sidebar";
import { acceptGroupInvitation, joinGroupViaLink } from "../../../components/api";

export const dynamic = "force-dynamic";

function getToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("monicare_access_token") || window.sessionStorage.getItem("monicare_access_token") || "";
}

function extractGroupLink(rawInvite) {
  if (!rawInvite) return "";
  if (rawInvite.startsWith("http")) return rawInvite;
  return `https://monicare-theta.vercel.app/group/${rawInvite}`;
}

export default function JoinCirclePage() {
  return (
    <Suspense fallback={<JoinCircleLoadingState />}>
      <JoinCircleContent />
    </Suspense>
  );
}

function JoinCircleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState("Slot 3");
  const [joinState, setJoinState] = useState("form");
  const [error, setError] = useState("");
  const [groupData, setGroupData] = useState(null);

  const rawInvite = searchParams.get("invite") || searchParams.get("group_link") || "";
  const inviteLink = useMemo(() => extractGroupLink(rawInvite), [rawInvite]);

  useEffect(() => {
    setIsLoadingProfile(false);
  }, []);

  useEffect(() => {
    if (!inviteLink) return;

    const token = getToken();
    if (!token) return;

    let isMounted = true;
    joinGroupViaLink(inviteLink, token)
      .then((response) => {
        if (!isMounted) return;
        setGroupData(response?.data || null);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err?.message || "Unable to load invite details.");
      });

    return () => {
      isMounted = false;
    };
  }, [inviteLink]);

  const circle = useMemo(
    () => ({
      name: groupData?.group_name || "Savings Circle",
      amount: Number(groupData?.contribution_amount || 0),
      frequency: groupData?.cycle_period || "WEEKLY",
      payoutMode: "Member slot based",
      inviteLink,
    }),
    [groupData, inviteLink]
  );

  const handleRequireAuth = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("monicare_post_auth_redirect", `/assets/personal-dash/join?invite=${encodeURIComponent(rawInvite)}`);
    }
    router.push("/auth/login#signup");
  };

  const handleAccept = async () => {
    const token = getToken();
    if (!token) {
      setError("Please register or log in to continue your invite.");
      handleRequireAuth();
      return;
    }

    try {
      const response = await acceptGroupInvitation(inviteLink, token);
      setJoinState("success");
      setError("");
      setGroupData(response?.data || groupData);
    } catch (err) {
      setError(err?.message || "Unable to accept invite.");
    }
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="relative mx-auto flex w-full max-w-[1440px] flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
        <div className={`fixed inset-0 z-40 transform bg-slate-900 transition-transform duration-300 ease-in-out lg:hidden ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <Sidebar profile={profile} isLoading={isLoadingProfile} />
          <button onClick={() => setIsSidebarOpen(false)} className="absolute right-4 top-4 text-white" aria-label="Close sidebar">
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
            <h1 className="mt-3 text-3xl font-black tracking-tight text-black sm:text-4xl">You&apos;ve been invited to join an Esusu Circle</h1>
            <p className="mt-3 text-sm leading-6 text-neutral-500">Review the circle details, pick your payout slot, and accept the invite to join.</p>

            <div className="mt-8 rounded-2xl border border-neutral-200 bg-[#fbfbfa] p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoCard label="Circle" value={circle.name} />
                <InfoCard label="Contribution" value={new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(circle.amount)} />
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
                {["Slot 1", "Slot 2", "Slot 3", "Slot 4", "Slot 5"].map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-4 text-left transition ${
                      selectedSlot === slot ? "border-emerald-400 bg-emerald-50" : "border-neutral-200 bg-white hover:border-neutral-300"
                    }`}
                  >
                    <span className="text-sm font-semibold text-black">{slot}</span>
                    <span className="text-xs font-medium text-neutral-500">{slot === "Slot 3" ? "Best fit" : "Available"}</span>
                  </button>
                ))}
              </div>
            </div>

            {error ? <p className="mt-6 text-sm text-rose-500">{error}</p> : null}

            {joinState === "success" ? (
              <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                <p className="text-2xl font-black text-emerald-700">You&apos;re in.</p>
                <p className="mt-2 text-sm text-emerald-700">Your circle has been recorded in My Savings Circles.</p>
                <button type="button" onClick={() => router.push("/assets/personal-dash/my-circle")} className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-[#ffc400] px-5 text-sm font-black text-black transition hover:bg-[#ffd33d]">
                  View My Circles
                </button>
              </div>
            ) : (
              <button type="button" onClick={handleAccept} className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#ffc400] px-5 text-sm font-black text-black transition hover:bg-[#ffd33d]">
                Accept Invite & Join Circle
              </button>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

function JoinCircleLoadingState() {
  return (
    <div className="min-h-screen bg-white text-black">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] items-center justify-center px-4">
        <p className="text-sm font-medium text-neutral-500">Loading invite details...</p>
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
