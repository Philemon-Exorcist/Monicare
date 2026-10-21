import "./globals.css";

export const metadata = {
  title: {
    default: "Monicare — Save together with clarity",
    template: "%s | Monicare",
  },
  description:
    "Monicare helps people organize trusted savings circles and keep contributions, schedules, and payout turns clear.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
