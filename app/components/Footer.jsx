import Link from "next/link";

const footerLinks = [
  { label: "Home", href: "/" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Community", href: "#community" },
  { label: "Security", href: "#security" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950 px-6 py-10 text-slate-300 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xl font-semibold text-white">Monicare</p>
          <p className="mt-2 max-w-md text-sm leading-7 text-slate-400">
            Community finance made simple with transparent savings circles and secure digital payments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          {footerLinks.map((link) => (
            <Link key={link.label} href={link.href} className="transition hover:text-yellow-300">
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-7xl flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
        <p>© 2026 Monicare. All rights reserved.</p>
        <div className="flex gap-4">
          <Link href="/auth/login#signup" className="transition hover:text-yellow-300">
            Get started
          </Link>
          <a href="mailto:hello@monicare.com" className="transition hover:text-yellow-300">
            hello@monicare.com
          </a>
        </div>
      </div>
    </footer>
  );
}
