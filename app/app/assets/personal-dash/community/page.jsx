"use client";

import Sidebar from "../dash-comp/Sidebar";

export default function CommunityPage() {
  const profile = null;

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="relative mx-auto flex w-full max-w-[1440px] flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
        <div className="hidden lg:block lg:h-full lg:flex-shrink-0 lg:overflow-y-auto">
          <Sidebar profile={profile} isLoading={false} />
        </div>

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <section className="mx-auto max-w-5xl">
            <div className="rounded-[28px] border border-neutral-200 bg-white px-6 py-8 shadow-[0_28px_90px_rgba(15,23,42,0.08)] sm:px-10">
              <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-neutral-500">Community Hub</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-black">Support, updates, and shared wins</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-500">
                This space can host announcements, group reminders, and community support threads for members who want to stay in sync.
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <InfoCard
                  title="Announcements"
                  description="Pin major updates here so every circle member can see payment changes, deadlines, and policy notes."
                />
                <InfoCard
                  title="Peer Support"
                  description="Help members resolve onboarding issues, wallet funding questions, and invitation link problems."
                />
                <InfoCard
                  title="Group Wins"
                  description="Celebrate successful payouts and completed cycles to keep the community momentum high."
                />
                <InfoCard
                  title="Best Practices"
                  description="Share reminders about contribution discipline, payout safety, and trusted invite hygiene."
                />
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function InfoCard({ title, description }) {
  return (
    <article className="rounded-3xl border border-neutral-200 bg-[#fafafa] p-5 shadow-sm">
      <h2 className="text-lg font-black text-black">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-neutral-500">{description}</p>
    </article>
  );
}
