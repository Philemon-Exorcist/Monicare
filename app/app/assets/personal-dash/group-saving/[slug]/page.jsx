"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Sidebar from "../../dash-comp/Sidebar";
import { getSavingsGroupDetail } from "../../../../../components/api";

const DEFAULT_GROUP = {
  id: "",
  title: "Savings Circle",
  target: "N0",
  recipient: "Recipient",
  status: "DRAFT",
  progress: 0,
  total: 1,
  members: [],
  history: [],
  activity: [],
};

function formatNaira(value) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(Number(value || 0));
}

function normalizeGroupData(rawGroup) {
  const source = rawGroup || {};
  const totalSlots = Number(source.max_slots || 1) || 1;
  const currentRound = Number(source.current_cycle_round || 0) || 0;

  return {
    ...DEFAULT_GROUP,
    id: source.group_id || source.id || "",
    title: source.group_name || source.title || DEFAULT_GROUP.title,
    target: formatNaira(source.contribution_amount || 0),
    recipient: source.person_due_for_payout
      ? `${source.person_due_for_payout.first_name || ""} ${source.person_due_for_payout.last_name || ""}`.trim()
      : source.creator_id || DEFAULT_GROUP.recipient,
    status: source.status || DEFAULT_GROUP.status,
    progress: currentRound,
    total: totalSlots,
    members: Array.isArray(source.members)
      ? source.members.map((member) => ({
          name: `${member.first_name || ""} ${member.last_name || ""}`.trim() || "Member",
          status: member.slot_position === currentRound ? "Paid" : "Pending",
        }))
      : [],
    history: [
      { label: "Current Round", subtitle: `Round ${currentRound || 1} of ${totalSlots}`, status: source.status || "Draft" },
      { label: "Invite Link", subtitle: source.group_link || "Not generated", status: "Link" },
    ],
    activity: [
      { time: "Now", description: `Cycle status is ${source.status || "DRAFT"}.` },
      { time: "Members", description: `${Array.isArray(source.members) ? source.members.length : 0} member records loaded from backend.` },
    ],
  };
}

export default function GroupSavingDetailPage() {
  const params = useParams();
  const groupId = params?.slug || "";
  const [groupData, setGroupData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token =
      window.localStorage.getItem("monicare_access_token") ||
      window.sessionStorage.getItem("monicare_access_token");

    if (!token || !groupId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function loadGroup() {
      try {
        const response = await getSavingsGroupDetail(groupId, token);
        if (!isMounted) return;
        setGroupData(normalizeGroupData(response?.data));
        setError("");
      } catch (err) {
        if (!isMounted) return;
        setError(err?.message || "Unable to load group details.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadGroup();

    return () => {
      isMounted = false;
    };
  }, [groupId]);

  const progressPercent = useMemo(() => {
    if (!groupData) return 0;
    return Math.round((groupData.progress / groupData.total) * 100);
  }, [groupData]);

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="relative mx-auto flex w-full max-w-[1440px] flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
        <div className={`fixed inset-0 z-40 transform bg-slate-900 transition-transform duration-300 ease-in-out lg:hidden ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <Sidebar profile={profile} isLoading={false} />
          <button onClick={() => setIsSidebarOpen(false)} className="absolute right-4 top-4 text-white" aria-label="Close sidebar">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="hidden lg:block lg:h-full lg:flex-shrink-0 lg:overflow-y-auto">
          <Sidebar profile={profile} isLoading={false} />
        </div>

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-end lg:hidden">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2" aria-label="Open sidebar">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
          </div>

          <div className="mx-auto max-w-6xl space-y-8">
            {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
            <section className="rounded-[28px] border border-neutral-200 bg-white px-6 py-8 shadow-[0_28px_90px_rgba(15,23,42,0.08)] sm:px-10">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.35em] text-emerald-500">{groupData?.status ?? "Loading..."}</p>
                  <h1 className="mt-4 text-5xl font-black tracking-tight text-black">{groupData?.target ?? "N0"}</h1>
                  <p className="mt-3 text-sm text-neutral-500">Current cycle target outcome: {groupData?.recipient ?? "Recipient"}</p>
                </div>
                <div className="rounded-3xl border border-neutral-200 bg-[#f8faf9] px-5 py-4 text-sm font-bold text-neutral-600">
                  Pool Stability Index
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-200">
                    <div className="h-full w-3/4 rounded-full bg-emerald-500" />
                  </div>
                </div>
              </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
              <section className="space-y-6">
                <div className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-[0_28px_90px_rgba(15,23,42,0.08)]">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.35em] text-neutral-400">Group Overview</p>
                      <p className="mt-2 text-sm text-neutral-500">Backend-loaded group details and member state.</p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-3xl border border-neutral-200 bg-[#fafafa] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Collection progress</p>
                        <p className="mt-2 text-xl font-black tracking-tight text-black">{groupData?.progress ?? 0} of {groupData?.total ?? 1} Slots</p>
                      </div>
                      <div className="text-right text-sm text-neutral-500">{progressPercent}%</div>
                    </div>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-neutral-200">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-[0_28px_90px_rgba(15,23,42,0.08)]">
                  <p className="text-sm font-black uppercase tracking-[0.35em] text-neutral-400">Cycle timeline</p>
                  <div className="mt-6 space-y-4">
                    {groupData?.history?.map((item) => (
                      <div key={item.label} className="rounded-3xl border border-neutral-200 bg-[#fafafa] p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-semibold text-black">{item.label}</p>
                            <p className="mt-1 text-sm text-neutral-500">{item.subtitle}</p>
                          </div>
                          <span className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs font-semibold uppercase text-neutral-600">
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-[0_28px_90px_rgba(15,23,42,0.08)]">
                  <p className="text-sm font-black uppercase tracking-[0.35em] text-neutral-400">Live event log</p>
                  <div className="mt-4 rounded-3xl border border-neutral-200 bg-[#f7f7f7] p-4 font-mono text-[11px] text-neutral-600">
                    {groupData?.activity?.map((item) => (
                      <div key={`${item.time}-${item.description}`} className="mb-3">
                        <p className="font-semibold text-black">[{item.time}]</p>
                        <p>{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <aside className="space-y-6">
                <div className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-[0_28px_90px_rgba(15,23,42,0.08)]">
                  <p className="text-sm font-black uppercase tracking-[0.35em] text-neutral-400">Peer Accountability</p>
                  <div className="mt-6 space-y-3">
                    {groupData?.members?.map((member) => (
                      <div key={member.name} className="flex items-center justify-between gap-3 rounded-3xl border border-neutral-200 bg-[#fafafa] px-4 py-3">
                        <span>{member.name}</span>
                        <span className={`text-xs font-black ${member.status === "Paid" ? "text-emerald-500" : "text-neutral-400"}`}>{member.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-[0_28px_90px_rgba(15,23,42,0.08)]">
                  <p className="text-sm font-black uppercase tracking-[0.35em] text-neutral-400">Group Link</p>
                  <p className="mt-3 break-all rounded-xl bg-[#fafafa] px-4 py-3 font-mono text-xs text-neutral-500">{groupData?.group_link || "Not available yet"}</p>
                </div>
              </aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
