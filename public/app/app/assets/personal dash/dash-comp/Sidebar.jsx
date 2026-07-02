"use client";

import { useRouter } from "next/navigation";
import { navItems, utilityNavItems } from "./dashboardData";

export default function Sidebar() {
  const router = useRouter();

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("monicare_access_token");
      window.localStorage.removeItem("monicare_refresh_token");
      window.localStorage.removeItem("monicare_user_id");
      window.sessionStorage.removeItem("monicare_access_token");
      window.sessionStorage.removeItem("monicare_refresh_token");
      window.sessionStorage.removeItem("monicare_user_id");
      window.location.hash = "";
    }

    router.push("/auth/login");
  };

  return (
    <aside className="flex w-full flex-col border-b border-neutral-200 bg-[#fbfbfa] px-5 py-6 lg:min-h-screen lg:w-[285px] lg:border-b-0 lg:border-r lg:px-8 lg:py-12">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ffc400] text-sm font-black">
          M
        </div>
        <span className="text-xl font-black tracking-tight">Monicare</span>
      </div>

      <nav className="mt-8 flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
        {navItems.map((item) => (
          <NavButton key={item.label} {...item} />
        ))}
      </nav>

      <div className="mt-6 hidden flex-1 lg:block" />

      <div className="mt-4 flex gap-2 border-neutral-200 pt-6 lg:mt-0 lg:flex-col lg:border-t">
        {utilityNavItems.map((item) => (
          <NavButton
            key={item.label}
            {...item}
            compact
            onClick={item.label === "Log Out" ? handleLogout : undefined}
          />
        ))}
      </div>
    </aside>
  );
}

function NavButton({ label, icon: Icon, active = false, compact = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-12 shrink-0 items-center gap-4 rounded-xl px-4 text-left text-base font-semibold transition ${
        active ? "bg-[#070707] text-white" : "text-neutral-500 hover:bg-neutral-100 hover:text-black"
      } ${compact ? "lg:px-0 lg:hover:bg-transparent" : ""}`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}
