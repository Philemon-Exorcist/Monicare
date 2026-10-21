"use client";

import { useEffect, useState } from "react";
import { getDashboardProfile, submitWithdrawal } from "../../../components/api";
import Sidebar from "../dash-comp/Sidebar";

export default function WithdrawPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [form, setForm] = useState({
    account_number: "",
    bank_code: "",
    amount: "",
    transaction_pin: "",
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const token =
      window.localStorage.getItem("monicare_access_token") ||
      window.sessionStorage.getItem("monicare_access_token");

    if (!token) {
      setIsLoadingProfile(false);
      return;
    }

    let isMounted = true;

    async function loadProfile() {
      try {
        const response = await getDashboardProfile(token);
        if (isMounted) {
          setProfile(response?.data || null);
        }
      } catch (error) {
        console.error("Failed to load dashboard profile", error);
        if (isMounted) {
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const token =
      window.localStorage.getItem("monicare_access_token") ||
      window.sessionStorage.getItem("monicare_access_token");

    if (!token) {
      setStatusMessage("Please sign in before requesting a withdrawal.");
      return;
    }
    if (!/^\d{3}$/.test(form.bank_code)) {
      setStatusMessage("Enter your bank's 3-digit bank code.");
      return;
    }
    if (!/^\d{10}$/.test(form.account_number)) {
      setStatusMessage("Enter a valid 10-digit bank account number.");
      return;
    }
    if (!Number.isFinite(Number(form.amount)) || Number(form.amount) <= 0) {
      setStatusMessage("Enter a withdrawal amount greater than zero.");
      return;
    }
    if (!/^\d{4}$/.test(form.transaction_pin)) {
      setStatusMessage("Enter your 4-digit transaction PIN.");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("");

    try {
      const response = await submitWithdrawal(
        {
          account_number: form.account_number,
          bank_code: form.bank_code,
          amount: Number(form.amount),
          transaction_pin: form.transaction_pin,
        },
        token
      );

      setStatusMessage(response?.message || "Withdrawal request submitted.");
    } catch (error) {
      setStatusMessage(error?.message || "Unable to submit withdrawal request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="relative mx-auto flex w-full max-w-[1440px] flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
        <div
          className={`fixed inset-0 z-40 transform bg-slate-900 transition-transform duration-300 ease-in-out lg:hidden ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar profile={profile} isLoading={isLoadingProfile} />
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
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-neutral-500">Withdraw funds</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-black sm:text-4xl">
              Request a withdrawal
            </h1>
            <p className="mt-3 text-sm leading-6 text-neutral-500">
              Review your available balance and confirm the bank account before submitting a withdrawal.
            </p>

            <div className="mt-8 rounded-2xl border border-neutral-200 bg-[#fbfbfa] p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoCard label="Available balance" value={isLoadingProfile ? "Loading..." : profile ? new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(profile.wallet_balance || 0) : "Unavailable"} />
                <InfoCard label="Withdrawal method" value="Bank transfer" />
                <InfoCard label="Status" value="Not submitted" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
              <label className="grid gap-2 text-sm font-semibold">
                Bank code
                <input
                  required
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={3}
                  pattern="[0-9]{3}"
                  className="h-12 rounded-lg border border-neutral-200 px-4 text-sm font-normal"
                  placeholder="3-digit code"
                  value={form.bank_code}
                  onChange={(e) => setForm((prev) => ({ ...prev, bank_code: e.target.value.replace(/\D/g, "").slice(0, 3) }))}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Account number
                <input
                  required
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  className="h-12 rounded-lg border border-neutral-200 px-4 text-sm font-normal"
                  placeholder="10-digit account number"
                  value={form.account_number}
                  onChange={(e) => setForm((prev) => ({ ...prev, account_number: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Amount
                <input
                  required
                  min="0.01"
                  max={profile?.wallet_balance || undefined}
                  step="0.01"
                  type="number"
                  className="h-12 rounded-lg border border-neutral-200 px-4 text-sm font-normal"
                  placeholder="Amount in NGN"
                  value={form.amount}
                  onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Transaction PIN
                <input
                  required
                  inputMode="numeric"
                  autoComplete="current-password"
                  maxLength={4}
                  pattern="[0-9]{4}"
                  type="password"
                  className="h-12 rounded-lg border border-neutral-200 px-4 text-sm font-normal"
                  placeholder="4-digit PIN"
                  value={form.transaction_pin}
                  onChange={(e) => setForm((prev) => ({ ...prev, transaction_pin: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                />
              </label>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#ffc400] px-5 text-sm font-black text-black transition hover:bg-[#ffd33d] disabled:opacity-60"
              >
                {isSubmitting ? "Submitting..." : "Start Withdrawal"}
              </button>
              {statusMessage ? <p role="status" className="text-sm text-neutral-600">{statusMessage}</p> : null}
            </form>
          </section>
        </main>
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
