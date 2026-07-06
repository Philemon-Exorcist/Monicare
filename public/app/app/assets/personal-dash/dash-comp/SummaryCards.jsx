"use client";

import { CopyIcon } from "./icons";
import { useState, useEffect } from "react";

export default function SummaryCards({ profile, isLoading, error }) {
  const walletBalance = profile?.wallet_balance ?? 0;

  return (
    <section className="mt-7 grid gap-4 lg:grid-cols-3">
      <AvailableBalanceCard balance={walletBalance} isLoading={isLoading} />
      <LiquidityCard />
      <VirtualAccountCard profile={profile} isLoading={isLoading} error={error} />
    </section>
  );
}

function AvailableBalanceCard({ balance, isLoading }) {
  const formattedBalance = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(balance);

  return (
    <div className="rounded-lg bg-indigo-700 p-7 text-white">
      <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-indigo-200">Available Balance</p>
      <div className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
        {isLoading ? "Loading..." : formattedBalance}
      </div>
      <p className="mt-9 text-xs text-indigo-200">This is your personal wallet balance for contributions.</p>
    </div>
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

function VirtualAccountCard({ profile, isLoading, error }) {
  const accountNumber = profile?.account_number || profile?.nomba_virtual_account || "000 000 0000";
  const bankName = profile?.bank_name || profile?.nomba_bank_name || "Bank name pending";
  const accountName = profile?.account_name || [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Account name pending";
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (isLoading || !accountNumber || accountNumber === "000 000 0000") return;
    navigator.clipboard.writeText(accountNumber).then(() => {
      setIsCopied(true);
    });
  };

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false);
      }, 2000); // Reset after 2 seconds
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  return (
    <div className="rounded-lg border border-neutral-300 bg-white p-7">
      <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-indigo-700">
        Virtual Funding Account
      </p>
      <p className="mt-1 text-xs text-neutral-500">Deposit directly to fund your wallet.</p>

      <div className="mt-5 rounded-lg bg-neutral-50 p-5">
        <p className="text-xs text-neutral-500">{bankName}</p>
        <p className="mt-2 font-mono text-2xl font-black tracking-[0.16em]">{isLoading ? "Loading..." : accountNumber}</p>
        <p className="mt-2 text-xs text-neutral-500">{accountName}</p>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <button
        onClick={handleCopy}
        disabled={isLoading || isCopied}
        className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#ffc400] px-4 text-sm font-black text-black transition hover:bg-[#ffd33d] disabled:cursor-not-allowed disabled:opacity-70"
      >
        <CopyIcon className="h-4 w-4" />
        {isCopied ? "Copied!" : "Copy Account"}
      </button>
    </div>
  );
}

function Pill({ children, tone }) {
  const styles = tone === "green" ? "bg-emerald-500/15 text-emerald-300" : "bg-yellow-400/15 text-yellow-300";
  return <span className={`rounded px-2 py-1 font-mono text-[11px] font-black ${styles}`}>{children}</span>;
}
