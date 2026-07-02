import { CopyIcon } from "./icons";

export default function SummaryCards() {
  return (
    <section className="mt-7 grid gap-4 lg:grid-cols-2">
      <LiquidityCard />
      <VirtualAccountCard />
    </section>
  );
}

function LiquidityCard() {
  return (
    <div className="rounded-lg bg-[#070707] p-7 text-white">
      <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-neutral-500">
        Total Collective Liquidity
      </p>
      <div className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">N180,000</div>
      <div className="mt-9 flex flex-wrap gap-2">
        <Pill tone="green">3 active circles</Pill>
        <Pill tone="yellow">Next payout: 9 Jul</Pill>
      </div>
    </div>
  );
}

function VirtualAccountCard() {
  return (
    <div className="rounded-lg border border-neutral-300 bg-white p-7">
      <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-indigo-700">
        Virtual Funding Account
      </p>
      <p className="mt-1 text-xs text-neutral-500">Deposit directly to fund your wallet.</p>

      <div className="mt-5 rounded-lg bg-neutral-50 p-5">
        <p className="text-xs text-neutral-500">Providus Bank</p>
        <p className="mt-2 font-mono text-2xl font-black tracking-[0.16em]">1029 3847 56</p>
        <p className="mt-2 text-xs text-neutral-500">Nomba Virtual Funding Account</p>
      </div>

      <button className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#ffc400] px-4 text-sm font-black text-black transition hover:bg-[#ffd33d]">
        <CopyIcon className="h-4 w-4" />
        Copy Account
      </button>
    </div>
  );
}

function Pill({ children, tone }) {
  const styles = tone === "green" ? "bg-emerald-500/15 text-emerald-300" : "bg-yellow-400/15 text-yellow-300";
  return <span className={`rounded px-2 py-1 font-mono text-[11px] font-black ${styles}`}>{children}</span>;
}
