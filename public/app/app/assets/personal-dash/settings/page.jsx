"use client";

import { useEffect, useState } from "react";
import { getDashboardProfile, setAutoDebitPreference } from "../../../components/api";
import Sidebar from "../dash-comp/Sidebar";

export default function SettingsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [error, setError] = useState("");
  const [autoDebitEnabled, setAutoDebitEnabled] = useState(false);
  const [isSavingAutoDebit, setIsSavingAutoDebit] = useState(false);
  const [autoDebitMessage, setAutoDebitMessage] = useState("");

  useEffect(() => {
    const token =
      window.localStorage.getItem("monicare_access_token") ||
      window.sessionStorage.getItem("monicare_access_token");

    if (!token) {
      setError("No active session found.");
      setIsLoadingProfile(false);
      return;
    }

    let isMounted = true;

    async function loadProfile() {
      try {
        const response = await getDashboardProfile(token);
        if (isMounted) {
          setProfile(response?.data || null);
          setAutoDebitEnabled(Boolean(response?.data?.auto_debit_enabled));
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || "Failed to load profile.");
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

  const handleToggleAutoDebit = async () => {
    const token =
      window.localStorage.getItem("monicare_access_token") ||
      window.sessionStorage.getItem("monicare_access_token");

    if (!token || isSavingAutoDebit) {
      return;
    }

    const nextValue = !autoDebitEnabled;
    setIsSavingAutoDebit(true);
    setAutoDebitMessage("");

    try {
      const response = await setAutoDebitPreference(nextValue, token);
      setAutoDebitEnabled(Boolean(response?.data?.auto_debit_enabled ?? nextValue));
      setAutoDebitMessage(nextValue ? "Auto debit is now enabled." : "Auto debit is now disabled.");
    } catch (err) {
      setAutoDebitMessage(err?.message || "Unable to update auto debit right now.");
    } finally {
      setIsSavingAutoDebit(false);
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

          <section className="mx-auto max-w-4xl rounded-[28px] border border-neutral-200 bg-white px-6 py-8 shadow-[0_28px_90px_rgba(15,23,42,0.08)] sm:px-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-neutral-500">Account Settings</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-black">Your account</h1>
            <p className="mt-3 text-sm leading-6 text-neutral-500">
              Manage your personal details and security settings from one place.
            </p>

            {isLoadingProfile ? (
              <div className="mt-10 rounded-3xl border border-dashed border-neutral-300 bg-[#fafafa] px-6 py-10 text-center text-neutral-500 shadow-sm">
                Loading account settings...
              </div>
            ) : error ? (
              <div className="mt-10 rounded-3xl border border-dashed border-neutral-300 bg-[#fff4f2] px-6 py-10 text-center text-red-600 shadow-sm">
                {error}
              </div>
            ) : (
              <div className="mt-10 space-y-6">
                <div className="rounded-3xl border border-neutral-200 bg-[#fafafa] p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.35em] text-neutral-400">Auto debit</p>
                      <p className="mt-3 text-lg font-black text-black">Debit from virtual account</p>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
                        When enabled, Monicare can automatically collect your contribution from your virtual account whenever a payment is due.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleAutoDebit}
                      disabled={isSavingAutoDebit}
                      className={`inline-flex h-12 min-w-[170px] items-center justify-center rounded-full px-5 text-sm font-black transition ${
                        autoDebitEnabled
                          ? "bg-emerald-600 text-white hover:bg-emerald-500"
                          : "bg-neutral-200 text-black hover:bg-neutral-300"
                      } ${isSavingAutoDebit ? "cursor-not-allowed opacity-70" : ""}`}
                    >
                      {isSavingAutoDebit ? "Saving..." : autoDebitEnabled ? "Auto Debit ON" : "Auto Debit OFF"}
                    </button>
                  </div>
                  {autoDebitMessage ? (
                    <p className="mt-4 text-sm font-medium text-neutral-600">{autoDebitMessage}</p>
                  ) : null}
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-3xl border border-neutral-200 bg-[#fafafa] p-6">
                  <p className="text-sm uppercase tracking-[0.35em] text-neutral-400">Name</p>
                  <p className="mt-3 text-lg font-black text-black">{profile?.first_name} {profile?.last_name}</p>
                </div>
                <div className="rounded-3xl border border-neutral-200 bg-[#fafafa] p-6">
                  <p className="text-sm uppercase tracking-[0.35em] text-neutral-400">Email</p>
                  <p className="mt-3 text-lg font-black text-black">{profile?.email}</p>
                </div>
                <div className="rounded-3xl border border-neutral-200 bg-[#fafafa] p-6">
                  <p className="text-sm uppercase tracking-[0.35em] text-neutral-400">Phone</p>
                  <p className="mt-3 text-lg font-black text-black">{profile?.phone || "Not set"}</p>
                </div>
                <div className="rounded-3xl border border-neutral-200 bg-[#fafafa] p-6">
                  <p className="text-sm uppercase tracking-[0.35em] text-neutral-400">Member since</p>
                  <p className="mt-3 text-lg font-black text-black">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "Unknown"}</p>
                </div>
              </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
