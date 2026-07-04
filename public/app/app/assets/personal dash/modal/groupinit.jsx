"use client";

import { useMemo, useState } from "react";
import { CopyIcon } from "../dash-comp/icons";
import GroupBasics from "./GroupBasics";
import GroupContribution from "./GroupContribution";
import GroupInvite from "./GroupInvite";
import GroupTimeline from "./GroupTimeline";
import GroupHeader from "./GroupHeader";
import GroupRules from "./GroupRules";

export default function GroupInit() {
  const [copyState, setCopyState] = useState("Copy Link");
  const inviteLink = useMemo(() => "https://monicare.app/invite/tech-cohort-savings", []);

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
              onClick={handleCopy}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#ffc400] px-5 text-sm font-black text-black transition hover:bg-[#ffd33d]"
            >
              <CopyIcon className="h-4 w-4" />
              {copyState}
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
