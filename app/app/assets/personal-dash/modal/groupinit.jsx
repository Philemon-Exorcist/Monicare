"use client";

import { useMemo, useState } from "react";
import { createSavingsGroup, activateSavingsGroup } from "../../../components/api";

const CYCLE_OPTIONS = ["WEEKLY", "BI_WEEKLY", "MONTHLY"];

function getToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("monicare_access_token") || window.sessionStorage.getItem("monicare_access_token") || "";
}

export default function GroupInit() {
  const [form, setForm] = useState({
    group_name: "",
    contribution_amount: "",
    cycle_period: "WEEKLY",
    max_slots: 10,
  });
  const [status, setStatus] = useState("");
  const [createdGroup, setCreatedGroup] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  const inviteLink = useMemo(() => createdGroup?.group_link || "", [createdGroup]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = async () => {
    const token = getToken();
    if (!token) {
      setStatus("Please sign in before creating a group.");
      return;
    }

    setIsSubmitting(true);
    setStatus("");

    try {
      const response = await createSavingsGroup(
        {
          group_name: form.group_name,
          contribution_amount: Number(form.contribution_amount),
          cycle_period: form.cycle_period,
          max_slots: Number(form.max_slots),
        },
        token
      );
      setCreatedGroup(response?.data || null);
      setStatus(response?.message || "Savings group created.");
    } catch (error) {
      setStatus(error?.message || "Unable to create savings group.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivate = async () => {
    const token = getToken();
    if (!token || !createdGroup?.group_id) return;

    setIsActivating(true);
    setStatus("");
    try {
      const response = await activateSavingsGroup({ group_id: createdGroup.group_id }, token);
      setStatus(response?.message || "Group activated.");
    } catch (error) {
      setStatus(error?.message || "Unable to activate group.");
    } finally {
      setIsActivating(false);
    }
  };

  if (createdGroup) {
    return (
      <SuccessState
        inviteLink={inviteLink}
        onCopy={async () => {
          if (inviteLink) {
            await navigator.clipboard.writeText(inviteLink);
            setStatus("Invite link copied.");
          }
        }}
        onActivate={handleActivate}
        isActivating={isActivating}
        onBack={() => setCreatedGroup(null)}
        status={status}
      />
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-6 sm:px-6 lg:px-10">
      <div className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.12)]">
        <div className="bg-[linear-gradient(180deg,#f4f4f4_0%,#ffffff_32%)] px-5 py-8 sm:px-10 sm:py-10">
          <header className="max-w-2xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-neutral-500">Setup Flow</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-black sm:text-4xl">Create New Esusu Circle</h1>
            <p className="mt-3 text-sm leading-6 text-neutral-500">Configure your circle, invite members, and lock in the contribution plan in one place.</p>
          </header>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <section className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-5">
              <Field label="Circle Name" value={form.group_name} onChange={(value) => handleChange("group_name", value)} placeholder="e.g. Tech Cohort Savings" />
              <Field label="Contribution Amount" value={form.contribution_amount} onChange={(value) => handleChange("contribution_amount", value)} placeholder="50000" type="number" />
              <Field label="Max Slots" value={form.max_slots} onChange={(value) => handleChange("max_slots", value)} placeholder="10" type="number" />
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-neutral-500">Cycle Frequency</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CYCLE_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleChange("cycle_period", option)}
                      className={`rounded-md px-4 py-2 text-sm font-black transition ${
                        form.cycle_period === option ? "bg-[#070707] text-white" : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <aside className="space-y-5">
              <section className="rounded-2xl border border-neutral-200 bg-white p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-neutral-500">Invite Preview</p>
                <p className="mt-3 text-sm leading-6 text-neutral-600">
                  Your invite link appears after creation, and you can share it directly from the success screen.
                </p>
              </section>
              <section className="rounded-2xl border border-neutral-200 bg-[#fbfbfa] p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-neutral-500">Circle Rules</p>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-neutral-600">
                  <li>Set the contribution cadence before sending invitations.</li>
                  <li>Confirm the payout order so every member knows their slot.</li>
                  <li>Review the invite text and make sure the group details are correct.</li>
                </ul>
              </section>
            </aside>
          </div>

          {status ? <p className="mt-6 text-sm text-neutral-600">{status}</p> : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleCreate}
              disabled={isSubmitting}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#ffc400] px-5 text-sm font-black text-black transition hover:bg-[#ffd33d] disabled:opacity-60"
            >
              {isSubmitting ? "Creating..." : "Initialize Circle & Generate Link"}
            </button>
            <p className="text-xs text-neutral-500">By submitting, you agree to the Monicare circle terms.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, placeholder, onChange, type = "text" }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-neutral-500">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full border-0 border-b border-neutral-300 px-0 py-3 text-sm outline-none placeholder:text-neutral-400 focus:border-black focus:ring-0"
      />
    </label>
  );
}

function SuccessState({ inviteLink, onCopy, onActivate, onBack, isActivating, status }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f4f4f4_0%,#ffffff_25%)] px-4 py-8">
      <div className="w-full max-w-3xl rounded-[28px] border border-neutral-200 bg-white px-6 py-12 text-center shadow-[0_28px_90px_rgba(15,23,42,0.12)] sm:px-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-50">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-emerald-400 text-emerald-500">✓</div>
        </div>
        <h2 className="mt-6 text-3xl font-black tracking-tight text-black sm:text-4xl">Your Esusu Circle is Live!</h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-neutral-500">
          Collective prosperity starts now. Invite your trusted community members to begin the cycle of growth.
        </p>

        <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-neutral-200 p-4 text-left">
          <p className="text-center font-mono text-[10px] uppercase tracking-[0.32em] text-neutral-500">Invitation Link</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <div className="flex-1 rounded-lg border border-neutral-200 px-4 py-3">
              <p className="break-all font-mono text-xs text-neutral-700">{inviteLink}</p>
            </div>
            <button type="button" onClick={onCopy} className="inline-flex h-11 items-center justify-center rounded-lg bg-[#ffc400] px-5 text-sm font-black text-black transition hover:bg-[#ffd33d]">
              Copy
            </button>
          </div>
        </div>

        {status ? <p className="mt-4 text-sm text-neutral-600">{status}</p> : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" onClick={onActivate} disabled={isActivating} className="inline-flex h-12 items-center justify-center rounded-lg bg-black px-5 text-sm font-black text-white transition hover:bg-neutral-900 disabled:opacity-60">
            {isActivating ? "Activating..." : "Activate Circle"}
          </button>
          <button type="button" onClick={onBack} className="inline-flex h-12 items-center justify-center rounded-lg border border-neutral-300 px-5 text-sm font-black text-black transition hover:bg-neutral-50">
            Create Another
          </button>
        </div>
      </div>
    </div>
  );
}
