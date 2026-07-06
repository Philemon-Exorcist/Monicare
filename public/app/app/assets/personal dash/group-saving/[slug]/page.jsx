"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Sidebar from "../../dash-comp/Sidebar";
import { getSavingsGroupDetail } from "../../../../components/api";

const DEFAULT_GROUP = {
  id: "tech-cohort-savings",
  title: "Tech Cohort Savings",
  target: "N500,000",
  recipient: "Mama Kemi",
  status: "Live Round",
  progress: 7,
  total: 10,
  members: [
    { name: "Kwan Okon", status: "Paid" },
    { name: "Angel B.", status: "Paid" },
    { name: "Philemon", status: "Pending" },
    { name: "Abena F.", status: "Pending" },
  ],
  history: [
    { label: "Week 1: Philemon Progress", subtitle: "Cycle completed April 04, 2024", status: "Disbursed" },
    { label: "Week 2: Martin O.", subtitle: "Cycle completed April 11, 2024", status: "Disbursed" },
    { label: "Week 3: Mama Kemi", subtitle: "Primary Recipient • Lagos Mainland Collective", status: "Current" },
    { label: "Week 4: Kwan", subtitle: "Scheduled for April 25, 2024", status: "Upcoming" },
    { label: "Week 5: Angel B.", subtitle: "Scheduled for May 02, 2024", status: "Upcoming" },
  ],
  activity: [
    { time: "13:04:12", description: "Kwan successfully deposited N50,000 into the Escrow Pool." },
    { time: "12:58:45", description: "System check: Security handshake verified with Nomba Settlement." },
    { time: "12:45:01", description: "Philemon Progress verified his attendance for upcoming cycle." },
    { time: "12:38:19", description: "Ledger entry #9932 synchronized across 4 nodes." },
  ],
};

function normalizeGroupData(rawGroup) {
  const source = rawGroup || {};
  const amountValue = Number(source.contribution_amount ?? source.amount ?? 0);
  const totalSlots = Number(source.max_slots ?? DEFAULT_GROUP.total ?? 10) || DEFAULT_GROUP.total;
  const currentRound = Number(source.current_cycle_round ?? source.progress ?? DEFAULT_GROUP.progress) || DEFAULT_GROUP.progress;

  return {
    ...DEFAULT_GROUP,
    id: source.group_id || source.id || DEFAULT_GROUP.id,
    title: source.group_name || source.title || DEFAULT_GROUP.title,
    target: Number.isFinite(amountValue) && amountValue > 0 ? `N${amountValue.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : DEFAULT_GROUP.target,
    recipient: source.recipient || source.title || DEFAULT_GROUP.recipient,
    status: source.status || DEFAULT_GROUP.status,
    progress: currentRound,
    total: totalSlots,
  };
}

export default function GroupSavingDetailPage() {
  const params = useParams();
  const groupId = params?.slug || "tech-cohort-savings";
  const [groupData, setGroupData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!groupId) return;

    async function loadGroup() {
      const token =
        window.localStorage.getItem("monicare_access_token") ||
        window.sessionStorage.getItem("monicare_access_token");

      if (!token) {
        setGroupData(DEFAULT_GROUP.id === groupId ? DEFAULT_GROUP : normalizeGroupData({ id: groupId, title: groupId.replace(/-/g, " ") }));
        return;
      }

      try {
        const response = await getSavingsGroupDetail(groupId, token);
        setGroupData(normalizeGroupData(response?.data));
      } catch (error) {
        console.error("Failed to load group detail", error);
        setGroupData(DEFAULT_GROUP.id === groupId ? DEFAULT_GROUP : normalizeGroupData({ id: groupId, title: groupId.replace(/-/g, " ") }));
      }
    }

    loadGroup();
  }, [groupId]);

  useEffect(() => {
    setProfile({ first_name: "User", last_name: "Example", email: "user@example.com" });
  }, []);

  const progressPercent = useMemo(() => {
    if (!groupData) return 0;
    return Math.round((groupData.progress / groupData.total) * 100);
  }, [groupData]);

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="relative mx-auto flex w-full max-w-[1440px] flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
        <div
          className={`fixed inset-0 z-40 transform bg-slate-900 transition-transform duration-300 ease-in-out lg:hidden ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar profile={profile} isLoading={false} />
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
            <section className="rounded-[28px] border border-neutral-200 bg-white px-6 py-8 shadow-[0_28px_90px_rgba(15,23,42,0.08)] sm:px-10">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.35em] text-emerald-500">{groupData?.status ?? "Live Round"}</p>
                  <h1 className="mt-4 text-5xl font-black tracking-tight text-black">{groupData?.target ?? "N500,000"}</h1>
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
                      <p className="text-sm font-black uppercase tracking-[0.35em] text-neutral-400">Week 3: {groupData?.recipient}</p>
                      <p className="mt-2 text-sm text-neutral-500">Primary Recipient • Lagos Mainland Collective</p>
                    </div>
                    <div className="h-14 w-14 rounded-full bg-neutral-100" />
                  </div>

                  <div className="mt-6 rounded-3xl border border-neutral-200 bg-[#fafafa] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Collection progress</p>
                        <p className="mt-2 text-xl font-black tracking-tight text-black">{groupData?.progress ?? 7} of {groupData?.total ?? 10} Paid</p>
                      </div>
                      <div className="text-right text-sm text-neutral-500">{progressPercent}%</div>
                    </div>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-neutral-200">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>

                  <button className="mt-6 w-full rounded-2xl bg-black px-6 py-4 text-sm font-black uppercase tracking-[0.28em] text-white transition hover:bg-neutral-900">
                    Post Contribution
                  </button>
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
                    <p className="mt-4 text-right text-[10px] text-neutral-400">v4.0.2-stable</p>
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
                        <span className={`text-xs font-black ${member.status === "Paid" ? "text-emerald-500" : "text-neutral-400"}`}>
                          {member.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-[0_28px_90px_rgba(15,23,42,0.08)]">
                  <p className="text-sm font-black uppercase tracking-[0.35em] text-neutral-400">Expand the Circle</p>
                  <p className="mt-3 text-sm text-neutral-500">Invited members strengthen the escrow pool security.</p>
                  <button className="mt-6 w-full rounded-2xl bg-amber-400 px-5 py-3 text-sm font-black uppercase tracking-[0.28em] text-black transition hover:bg-amber-300">
                    Copy Invite Link
                  </button>
                </div>

                <div className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-[0_28px_90px_rgba(15,23,42,0.08)]">
                  <p className="text-sm font-black uppercase tracking-[0.35em] text-neutral-400">Collective Health</p>
                  <div className="mt-5 space-y-3 text-sm text-black">
                    <div className="flex items-center justify-between">
                      <span>Trust Rating</span>
                      <span className="font-black text-emerald-500">98.4%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Consecutive Payouts</span>
                      <span className="font-black">14 Rounds</span>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
