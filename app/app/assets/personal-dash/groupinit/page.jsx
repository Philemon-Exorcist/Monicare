"use client";

import { useEffect, useState } from "react";
import { getDashboardProfile } from "../../../../components/api";
import Sidebar from "../dash-comp/Sidebar";
import GroupInit from "../modal/groupinit";

export default function GroupInitPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

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

        <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-end lg:hidden">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2" aria-label="Open sidebar">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
          </div>
          <GroupInit />
        </main>
      </div>
    </div>
  );
}
