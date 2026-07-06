import { BellIcon, ChatIcon, GridIcon, SettingsIcon, UsersIcon, LogoutIcon } from "./icons";

export const navItems = [
  { label: "Personal Dashboard", icon: GridIcon, href: "/assets/personal-dash" },
  { label: "My Savings Circles", icon: UsersIcon, href: "/assets/personal-dash/my-circle" },
  { label: "Notifications", icon: BellIcon, href: "/assets/personal-dash/notifications" },
  { label: "Help & Community Hub", icon: ChatIcon, href: "/assets/personal-dash/community" },
];

export const utilityNavItems = [
  { label: "Account Settings", icon: SettingsIcon, href: "/assets/personal-dash/settings" },
  { label: "Log Out", icon: LogoutIcon },
];

export const circles = [
  {
    id: "tech-cohort-savings",
    name: "Tech Cohort Savings",
    status: "Created",
    position: "Slot 3 of 10",
    amount: "N50,000",
    cadence: "Weekly",
  },
  {
    id: "alumni-hub-2019",
    name: "Alumni Hub 2019",
    status: "Joined",
    position: "Slot 1 of 12",
    amount: "N30,000",
    cadence: "Bi-weekly",
  },
];

export const contributions = [
  { date: "01 Jul 2026", circle: "Tech Cohort Savings", amount: "N50,000", status: "Joined circle" },
  { date: "24 Jun 2026", circle: "Alumni Hub 2019", amount: "N30,000", status: "Created circle" },
];
