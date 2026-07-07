"use client";

import { useEffect, useState } from "react";
import ActiveCircles from "./dash-comp/ActiveCircles";
import ContributionHistory from "./dash-comp/ContributionHistory";
import DashboardActions from "./dash-comp/DashboardActions";
import DashboardHeader from "./dash-comp/DashboardHeader";
import Sidebar from "./dash-comp/Sidebar";
import SummaryCards from "./dash-comp/SummaryCards";
import { getDashboardProfile } from "../../../components/api";

export default function MyDash() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    const token =
      window.localStorage.getItem("monicare_access_token") ||
      window.sessionStorage.getItem("monicare_access_token");

    if (!token) {
      setProfileError("No active session was found.");
      setIsLoadingProfile(false);
      return;
    }

    let isMounted = true;

    async function loadProfile() {
      try {
        const response = await getDashboardProfile(token);

        if (!isMounted) {
          return;
        }

        setProfile(response?.data || null);
        setDashboardData(response?.data || null);
        setProfileError("");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setProfile(null);
        setProfileError(error?.message || "Unable to load account details.");
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
        {/* Sidebar for mobile (overlay) */}
        <div
          className={`fixed inset-0 z-40 transform bg-slate-900 transition-transform duration-300 ease-in-out lg:hidden ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar profile={profile} isLoading={isLoadingProfile} />
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="absolute top-4 right-4 text-white"
            aria-label="Close sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Sidebar for desktop (static) */}
        <div className="hidden lg:block lg:h-full lg:flex-shrink-0 lg:overflow-y-auto">
          <Sidebar profile={profile} isLoading={isLoadingProfile} />
        </div>
        <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <DashboardHeader name={profile?.first_name} />
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 lg:hidden" aria-label="Open sidebar">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
          </div>
          <SummaryCards profile={profile} dashboardData={dashboardData} isLoading={isLoadingProfile} error={profileError} />
          <DashboardActions />
          <ActiveCircles groups={dashboardData?.groups || []} />
          <ContributionHistory groups={dashboardData?.groups || []} />
        </main>
      </div>
    </div>
  );
}
