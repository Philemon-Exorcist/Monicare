import ActiveCircles from "./ActiveCircles";
import ContributionHistory from "./ContributionHistory";
import DashboardActions from "./DashboardActions";
import DashboardHeader from "./DashboardHeader";
import Sidebar from "./Sidebar";
import SummaryCards from "./SummaryCards";

export default function PersonalDashboard() {
  return (
    <div className="min-h-screen bg-white text-black">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col lg:flex-row">
        <Sidebar />
        <main className="flex-1 px-4 py-4 sm:px-6 lg:px-8">
          <DashboardHeader />
          <SummaryCards />
          <DashboardActions />
          <ActiveCircles />
          <ContributionHistory />
        </main>
      </div>
    </div>
  );
}
