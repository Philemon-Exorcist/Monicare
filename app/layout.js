import "./globals.css";

export const metadata = {
  title: "Monicare",
  description: "Monicare landing page and login route for care coordination.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
