"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [mode, setMode] = useState("signup");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    if (mode === "signup" && password !== repeatPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("Submitting:", { mode, fullName, email, password });

    // On successful login/signup, redirect to dashboard
    router.push("/");

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col justify-center gap-8 px-6 py-10 lg:flex-row lg:items-center lg:justify-between lg:px-12">
        <section className="mx-auto w-full max-w-xl rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_22px_80px_rgba(15,23,42,0.08)] sm:p-10">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">
              {mode === "login" ? "Sign into your account" : "Create an account"}
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Sign up and get 1 month free trial
            </h1>
          </div>

          <div className="mb-8 flex overflow-hidden rounded-full border border-slate-200 bg-slate-100">
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-full px-5 py-3 text-sm font-semibold transition ${
                mode === "signup"
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-500 hover:bg-white/80"
              }`}
            >
              Sign up
            </button>
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-full px-5 py-3 text-sm font-semibold transition ${
                mode === "login"
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-500 hover:bg-white/80"
              }`}
            >
              Log in
            </button>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Full name</span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your name"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </label>
            )}

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <div className="relative mt-2">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                  👁
                </span>
              </div>
            </label>

            {mode === "signup" && (
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Repeat the password</span>
                <div className="relative mt-2">
                  <input
                    type="password"
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                    👁
                  </span>
                </div>
              </label>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/10 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading && <svg className="-ml-1 mr-3 h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
              {isLoading ? "Processing..." : (mode === "signup" ? "Sign up" : "Log in")}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3 text-sm text-slate-500">
            <span className="h-px flex-1 bg-slate-200"></span>
            <span>Or continue with</span>
            <span className="h-px flex-1 bg-slate-200"></span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              <span>G</span>
              Google
            </button>
            <button className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              <span></span>
              Apple
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            By signing up, you agree to the <span className="font-semibold text-slate-900">Terms of Service</span> and <span className="font-semibold text-slate-900">Privacy Policy</span>.
          </p>
        </section>

        <aside className="relative mx-auto w-full max-w-xl overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-[0_32px_120px_rgba(15,23,42,0.3)] sm:mt-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.25),_transparent_25%),radial-gradient(circle_at_bottom_left,_rgba(125,211,252,0.16),_transparent_20%)]" />
          <div className="relative flex min-h-[580px] flex-col justify-between p-8 sm:p-10">
            <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-sky-300">Knowly</p>
                <p className="mt-4 text-lg font-semibold leading-snug text-white">
                  Knowly has transformed the way I learn! The courses are well-structured, engaging, and easy to follow. I highly recommend it for anyone looking to upskill.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 text-xl font-semibold text-white">K</div>
                <div>
                  <p className="text-sm font-semibold text-white">Koushik</p>
                  <p className="text-xs text-slate-300">UI/UX Designer</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <button className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-white/15 bg-white/5 text-sm font-semibold text-white transition hover:bg-white/10">
                  ← Previous
                </button>
                <button className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-white/15 bg-sky-500/90 text-sm font-semibold text-white transition hover:bg-sky-400">
                  Next →
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
