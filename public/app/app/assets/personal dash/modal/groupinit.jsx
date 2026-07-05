"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CopyIcon } from "../dash-comp/icons";
import GroupBasics from "./GroupBasics";
import GroupContribution from "./GroupContribution";
import GroupInvite from "./GroupInvite";
import GroupTimeline from "./GroupTimeline";
import GroupHeader from "./GroupHeader";
import GroupRules from "./GroupRules";

export default function GroupInit() {
  const router = useRouter();
  const [step, setStep] = useState("form");
  const [copyState, setCopyState] = useState("Copy Link");
  const inviteLink = useMemo(() => "https://monicare.app/invite/tech-cohort-savings", []);
  const circleRecord = {
    name: "Tech Cohort Savings",
    status: "Created",
    cadence: "Weekly",
    amount: "N50,000",
    source: "Created circle",
    inviteLink,
    createdAt: new Date().toISOString(),
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopyState("Copied");
      window.setTimeout(() => setCopyState("Copy Link"), 1800);
    } catch {
      setCopyState("Copy Failed");
      window.setTimeout(() => setCopyState("Copy Link"), 1800);
    }
  };

  const handleInitialize = () => {
    if (typeof window !== "undefined") {
      const existing = safeParse(window.localStorage.getItem("monicare_circle_records"), []);
      const nextRecords = [circleRecord, ...existing.filter((item) => item.inviteLink !== inviteLink)];
      window.localStorage.setItem("monicare_circle_records", JSON.stringify(nextRecords));
    }

    setStep("success");
  };

  if (step === "success") {
    return (
      <SuccessState
        inviteLink={inviteLink}
        onCopy={handleCopy}
        copyState={copyState}
        onViewCircles={() => router.push("/assets/personal%20dash/my-circle")}
      />
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-6 sm:px-6 lg:px-10">
      <div className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.12)]">
        <div className="bg-[linear-gradient(180deg,#f4f4f4_0%,#ffffff_32%)] px-5 py-8 sm:px-10 sm:py-10">
          <GroupHeader />
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-5">
              <GroupBasics />
              <GroupContribution />
              <GroupTimeline />
            </div>
            <div className="space-y-5">
              <GroupInvite onCopy={handleCopy} copyState={copyState} inviteLink={inviteLink} />
              <GroupRules />
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleInitialize}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#ffc400] px-5 text-sm font-black text-black transition hover:bg-[#ffd33d]"
            >
              Initialize Circle & Generate Link
            </button>
            <p className="text-xs text-neutral-500">
              By submitting, you agree to the Monicare circle terms.
            </p>
          </div>
        </div>
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

function SuccessState({ inviteLink, onCopy, copyState, onViewCircles }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f4f4f4_0%,#ffffff_25%)] px-4 py-8">
      <div className="w-full max-w-3xl rounded-[28px] border border-neutral-200 bg-white px-6 py-12 text-center shadow-[0_28px_90px_rgba(15,23,42,0.12)] sm:px-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-50">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-emerald-400 text-emerald-500">
            ✓
          </div>
        </div>
        <h2 className="mt-6 text-3xl font-black tracking-tight text-black sm:text-4xl">
          Your Esusu Circle is Live!
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-neutral-500">
          Collective prosperity starts now. Invite your trusted community members to begin the cycle of growth.
        </p>

        <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-neutral-200 p-4 text-left">
          <p className="text-center font-mono text-[10px] uppercase tracking-[0.32em] text-neutral-500">
            Invitation Link
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <div className="flex-1 rounded-lg border border-neutral-200 px-4 py-3">
              <p className="break-all font-mono text-xs text-neutral-700">{inviteLink}</p>
            </div>
            <button
              type="button"
              onClick={onCopy}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-[#ffc400] px-5 text-sm font-black text-black transition hover:bg-[#ffd33d]"
            >
              <CopyIcon className="mr-2 h-4 w-4" />
              {copyState}
            </button>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-sm text-neutral-500">Share via preferred channel</p>
          <button
            type="button"
            onClick={onViewCircles}
            className="mt-6 inline-flex h-12 items-center justify-center rounded-lg border border-neutral-300 px-5 text-sm font-black text-black transition hover:bg-neutral-50"
          >
            View My Circles
          </button>
        </div>
      </div>
    </div>
  );
}
