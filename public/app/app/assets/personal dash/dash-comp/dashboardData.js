import { ChatIcon, GridIcon, SettingsIcon, StoreIcon, UsersIcon, LogoutIcon } from "./icons";

export const navItems = [
  { label: "Personal Dashboard", icon: GridIcon, active: true },
  { label: "My Savings Circles", icon: UsersIcon },
  { label: "Marketplace Overview", icon: StoreIcon },
  { label: "Help & Community Hub", icon: ChatIcon },
];

export const utilityNavItems = [
  { label: "Account Settings", icon: SettingsIcon },
  { label: "Log Out", icon: LogoutIcon },
];

export const circles = [
  {
    name: "Tech Cohort Savings",
    status: "Auto-Debit Authorized",
    position: "Slot 3 of 10",
    amount: "N50,000",
    cadence: "Weekly",
  },
  {
    name: "Alumni Hub 2019",
    status: "Auto-Debit Authorized",
    position: "Slot 1 of 12",
    amount: "N30,000",
    cadence: "Bi-weekly",
  },
  {
    name: "Startup Founders Pool",
    status: "Manual Pay",
    position: "Slot 7 of 8",
    amount: "N100,000",
    cadence: "Monthly",
  },
];

export const contributions = [
  { date: "01 Jul 2026", circle: "Tech Cohort Savings", amount: "N50,000", status: "Settled" },
  { date: "24 Jun 2026", circle: "Alumni Hub 2019", amount: "N30,000", status: "Settled" },
  { date: "17 Jun 2026", circle: "Tech Cohort Savings", amount: "N50,000", status: "Settled" },
  { date: "10 Jun 2026", circle: "Startup Founders Pool", amount: "N100,000", status: "Settled" },
];
