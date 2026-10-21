"use client";

import { CopyIcon } from "./icons";
import { useState, useEffect } from "react";

export default function SummaryCards({ profile, dashboardData, isLoading, error }) {
  const walletBalance = profile?.wallet_balance ?? 0;

  return (
    <section className="mt-7 grid gap-4 lg:grid-cols-3">
      <AvailableBalanceCard balance={walletBalance} isLoading={isLoading} hasProfile={Boolean(profile)} />
      <CircleSummaryCard groups={dashboardData?.groups || []} />
      <VirtualAccountCard profile={profile} isLoading={isLoading} error={error} />
    </section>
  );
}

function AvailableBalanceCard({ balance, isLoading, hasProfile }) {
  const formattedBalance = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(balance);

  return (
    <div className="rounded-lg bg-indigo-700 p-7 text-white">
      <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-indigo-200">Available Balance</p>
      <div className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
        {isLoading ? "Loading..." : hasProfile ? formattedBalance : "Unavailable"}
      </div>
      <p className="mt-9 text-xs text-indigo-200">This is your personal wallet balance for contributions.</p>
    </div>
  );
}

function CircleSummaryCard({ groups }) {
  const activeCount = groups.filter((group) => String(group?.status || "").toUpperCase() === "ACTIVE").length;

  return (
    <div className="rounded-lg bg-[#183d32] p-7 text-white">
      <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-neutral-500">
        Your savings circles
      </p>
      <div className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
        {groups.length}
      </div>
      <p className="mt-9 text-xs text-neutral-300">{activeCount} active · {groups.length - activeCount} not active</p>
    </div>
  );
}

function VirtualAccountCard({ profile, isLoading, error }) {
  const accountNumber = profile?.account_number || profile?.nomba_virtual_account || "";
  const bankName = profile?.bank_name || profile?.nomba_bank_name || "Bank name pending";
  const accountName = profile?.account_name || [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Account name pending";
  const [isCopied, setIsCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const hasAccountNumber = Boolean(
    accountNumber &&
      !accountNumber.startsWith("PENDING") &&
    !accountNumber.startsWith("FAILED") &&
    accountNumber !== "UNKNOWN"
  );

  const handleCopy = async () => {
    if (isLoading || !hasAccountNumber) return;
    setCopyError("");
    try {
      await navigator.clipboard.writeText(accountNumber);
      setIsCopied(true);
    } catch {
      setCopyError("Clipboard access is unavailable. Select and copy the account number.");
    }
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
        <p className="text-xs text-neutral-500">{hasAccountNumber ? bankName : "Funding account"}</p>
        <p className="mt-2 font-mono text-2xl font-black tracking-[0.16em]">{isLoading ? "Loading..." : hasAccountNumber ? accountNumber : "Not assigned yet"}</p>
        <p className="mt-2 text-xs text-neutral-500">{accountName}</p>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      {copyError ? <p className="mt-3 text-sm text-red-600">{copyError}</p> : null}

      <button
        onClick={handleCopy}
        disabled={isLoading || isCopied || !hasAccountNumber}
        className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#ffc400] px-4 text-sm font-black text-black transition hover:bg-[#ffd33d] disabled:cursor-not-allowed disabled:opacity-70"
      >
        <CopyIcon className="h-4 w-4" />
        {isCopied ? "Copied!" : "Copy Account"}
      </button>
    </div>
  );
}
