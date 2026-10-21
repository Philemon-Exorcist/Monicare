"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { submitAuth } from "../../components/api";

export default function AuthPage() {
  const [mode, setMode] = useState("signup");
  const [fullName, setFullName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [bvn, setBvn] = useState("");
  const [nin, setNin] = useState("");
  const [dob, setDob] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const newHash = window.location.hash.slice(1);
      if (newHash === "login" || newHash === "signup") {
        setMode(newHash);
      }

      const handleHashChange = () => {
        const newHash = window.location.hash.slice(1);
        if (newHash === "login" || newHash === "signup") {
          setMode(newHash);
        }
      };
      window.addEventListener("hashchange", handleHashChange);
      return () => window.removeEventListener("hashchange", handleHashChange);
    }
  }, []);

  const maxDobDate = () => {
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 18);
    return cutoff.toISOString().split("T")[0];
  };

  const isAtLeast18 = (value) => {
    if (!value) return false;
    const dobDate = new Date(`${value}T00:00:00`);
    if (Number.isNaN(dobDate.getTime())) return false;

    const today = new Date();
    let age = today.getFullYear() - dobDate.getFullYear();
    const monthDiff = today.getMonth() - dobDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
      age -= 1;
    }

    return age >= 18;
  };

  const getPostAuthRedirect = () => {
    if (typeof window === "undefined") return "/dashboard";
    return window.localStorage.getItem("monicare_post_auth_redirect") || "/dashboard";
  };

  const clearPostAuthRedirect = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("monicare_post_auth_redirect");
    }
  };

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setError("");
    setSuccess("");
    if (typeof window !== "undefined") {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}#${nextMode}`
      );
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      if (mode === "signup") {
        if (password !== repeatPassword) {
          throw new Error("Passwords do not match.");
        }

        if (!/^\d{11}$/.test(bvn.trim())) {
          throw new Error("BVN must contain exactly 11 digits.");
        }

        if (nin.trim() && !/^\d{11}$/.test(nin.trim())) {
          throw new Error("NIN must contain exactly 11 digits.");
        }

        if (!isAtLeast18(dob)) {
          throw new Error("You must be at least 18 years old to sign up.");
        }

        const signupResponse = await submitAuth(
          {
            first_name: fullName.trim(),
            last_name: lastName.trim(),
            email: email.trim(),
            phone_no: phone.trim(),
            password,
            bvn: bvn.trim(),
            ...(nin.trim() ? { nin: nin.trim() } : {}),
            dob,
          },
          mode
        );

        setPassword("");
        setRepeatPassword("");
        setMode("login");

        if (typeof window !== "undefined") {
          window.location.hash = "login";
        }

        setSuccess(
          signupResponse?.message ||
            "Account created successfully. Please log in with your phone number and password."
        );
      } else {
        if (!phone.trim()) {
          throw new Error("Please enter your phone number.");
        }

        const loginResponse = await submitAuth({ phone_no: phone.trim(), password }, mode);
        const authData = loginResponse?.data;

        if (typeof window !== "undefined" && authData?.access_token) {
          window.localStorage.setItem("monicare_access_token", authData.access_token);
          window.localStorage.setItem("monicare_refresh_token", authData.refresh_token || "");
          window.localStorage.setItem("monicare_user_id", authData.user_id || "");
        }

        setSuccess(loginResponse?.message || "Login successful.");
        const redirectTo = getPostAuthRedirect();
        clearPostAuthRedirect();
        router.push(redirectTo);
      }
    } catch (error) {
      const message =
        typeof error?.message === "string"
          ? error.message
          : typeof error === "string"
            ? error
            : "Unable to connect to backend.";

      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#f7f7f3] text-white lg:flex">
      <div className="hidden min-h-screen w-1/2 flex-col justify-between bg-[#183d32] p-12 lg:flex">
        <Link href="/" className="flex w-fit items-center gap-3 text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7e9c9] text-sm font-black text-[#183d32]">M</span>
          <span className="text-lg font-bold tracking-tight">Monicare</span>
        </Link>
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c1d3c2]">Trust grows in the open</p>
          <h1 className="mt-5 text-5xl font-semibold leading-[1.05] tracking-[-0.05em] text-white">
            Save together, with a clear plan.
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-[#d5e1d5]">
            Organize your circle, understand the schedule, and keep each member on the same page.
          </p>
        </div>
        <p className="text-xs text-[#c1d3c2]">Your circle is built on shared expectations and mutual care.</p>
      </div>

      <div className="flex min-h-screen w-full flex-col items-center justify-center overflow-y-auto bg-[#183d32] px-3 py-6 sm:px-6 lg:w-1/2 lg:bg-[#f7f7f3] lg:px-8 lg:py-10">
        <div className="mb-6 flex w-full max-w-xl items-center justify-between lg:hidden">
          <Link href="/" className="flex items-center gap-3 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e7e9c9] text-sm font-black text-[#183d32]">M</span>
            <span className="font-bold">Monicare</span>
          </Link>
          <span className="text-xs text-[#c1d3c2]">Built around trust</span>
        </div>
        <div
          className={`w-full max-w-[90vw] rounded-2xl border border-white/10 bg-[#21483d] p-3 text-white shadow-2xl sm:rounded-[1.5rem] sm:p-6 lg:p-8 ${
            mode === "signup"
              ? "sm:max-w-[88vw] md:max-w-[78vw] lg:max-w-[640px]"
              : "sm:max-w-[85vw] md:max-w-[80vw] lg:max-w-[440px]"
          }`}
        >
            <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Link href="/" className="inline-flex items-center gap-2 text-xs sm:text-sm text-white hover:text-yellow-300 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </Link>
              </div>
              <div className="flex w-full flex-wrap items-center justify-center gap-1.5 sm:w-auto sm:gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={() => changeMode("signup")}
                  className={`${mode === "signup" ? "bg-yellow-400 text-slate-950" : "bg-transparent text-slate-400"} rounded-full px-3 py-1 text-xs sm:px-4 sm:py-1 sm:text-sm font-semibold transition hover:text-slate-200`}
                >
                  Sign Up
                </button>
                <button
                  type="button"
                  onClick={() => changeMode("login")}
                  className={`${mode === "login" ? "bg-yellow-400 text-slate-950" : "bg-transparent text-slate-400"} rounded-full px-3 py-1 text-xs sm:px-4 sm:py-1 sm:text-sm font-semibold transition hover:text-slate-200`}
                >
                  Log In
                </button>
              </div>
            </div>

            <h2 className="mb-3 text-center text-lg sm:mb-4 sm:text-xl font-semibold sm:text-left">{mode === "signup" ? "Create An Account" : "Welcome Back"}</h2>

            <form onSubmit={handleSubmit} className={mode === "signup" ? "space-y-2 sm:space-y-3" : "space-y-2 sm:space-y-3"}>
              {mode === "signup" && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                  <div>
                    <label htmlFor="firstName" className="block text-xs sm:text-sm font-medium text-slate-400 mb-1 ml-2 sm:ml-4">First Name</label>
                    <input
                      id="firstName"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="First name"
                      className="w-full rounded-full bg-slate-800 px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 transition"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-xs sm:text-sm font-medium text-slate-400 mb-1 ml-2 sm:ml-4">Last Name</label>
                    <input
                      id="lastName"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                      className="w-full rounded-full bg-slate-800 px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 transition"
                    />
                  </div>
                </div>
              )}
              {mode === "signup" && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                  <div>
                    <label htmlFor="bvn" className="mb-1 ml-2 sm:ml-4 block text-xs sm:text-sm font-medium text-slate-400">BVN</label>
                    <input
                      id="bvn"
                      required
                      type="text"
                      inputMode="numeric"
                      maxLength={11}
                      value={bvn}
                      onChange={(e) => setBvn(e.target.value)}
                      placeholder="BVN"
                      className="w-full rounded-full bg-slate-800 px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 transition"
                    />
                    <p className="mt-0.5 ml-2 sm:ml-4 text-xs text-slate-500">11 digits only.</p>
                  </div>
                  <div>
                    <label htmlFor="nin" className="mb-1 ml-2 sm:ml-4 block text-xs sm:text-sm font-medium text-slate-400">NIN</label>
                    <input
                      id="nin"
                      type="text"
                      inputMode="numeric"
                      maxLength={11}
                      value={nin}
                      onChange={(e) => setNin(e.target.value)}
                      placeholder="NIN"
                      className="w-full rounded-full bg-slate-800 px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 transition"
                    />
                    <p className="mt-0.5 ml-2 sm:ml-4 text-xs text-slate-500">Optional, 11 digits if provided.</p>
                  </div>
                </div>
              )}
              {mode === "signup" && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                  <div>
                    <label htmlFor="dob" className="mb-1 ml-2 sm:ml-4 block text-xs sm:text-sm font-medium text-slate-400">Date of Birth</label>
                    <input
                      id="dob"
                      required
                      type="date"
                      value={dob}
                      max={maxDobDate()}
                      onChange={(e) => setDob(e.target.value)}
                      placeholder="Date of Birth"
                      className="w-full rounded-full bg-slate-800 px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 transition appearance-none"
                    />
                    <p className="mt-0.5 ml-2 sm:ml-4 text-xs text-slate-500">Use the date picker format.</p>
                  </div>
                  <div>
                    <label htmlFor="phone" className="mb-1 ml-2 sm:ml-4 block text-xs sm:text-sm font-medium text-slate-400">Phone Number</label>
                    <input
                      id="phone"
                      required
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Phone number"
                      className="w-full rounded-full bg-slate-800 px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 transition"
                    />
                  </div>
                </div>
              )}

              {mode === "login" ? (
                <div>
                  <label htmlFor="phone-login" className="mb-1 ml-2 sm:ml-4 block text-xs sm:text-sm font-medium text-slate-400">Phone Number</label>
                  <input
                    id="phone-login"
                    required
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08012345678"
                    className="w-full rounded-full bg-slate-800 px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 transition"
                  />
                  <p className="mt-0.5 ml-2 sm:ml-4 text-xs text-slate-500">Use the phone number you registered with.</p>
                </div>
              ) : (
                <div>
                  <label htmlFor="email" className="mb-1 ml-2 sm:ml-4 block text-xs sm:text-sm font-medium text-slate-400">Email</label>
                  <input
                    id="email"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter Your Email"
                    className="w-full rounded-full bg-slate-800 px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 transition"
                  />
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-slate-400 mb-1 ml-2 sm:ml-4">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full rounded-full bg-slate-800 px-3 sm:px-4 py-2 sm:py-2.5 pr-10 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 transition"
                  />
                  <PasswordToggle isVisible={showPassword} onToggle={() => setShowPassword(!showPassword)} />
                </div>
              </div>

              {mode === "signup" && (
                <div className="sm:col-span-2">
                  <label htmlFor="repeatPassword" className="block text-xs sm:text-sm font-medium text-slate-400 mb-1 ml-2 sm:ml-4">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="repeatPassword"
                      required
                      type={showRepeatPassword ? "text" : "password"}
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                      placeholder="Confirm Password"
                      className="w-full rounded-full bg-slate-800 px-3 sm:px-4 py-2 sm:py-2.5 pr-10 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 transition"
                    />
                    <PasswordToggle
                      isVisible={showRepeatPassword}
                      onToggle={() => setShowRepeatPassword(!showRepeatPassword)}
                    />
                  </div>
                </div>
              )}

              {error && <p className="text-xs sm:text-sm text-red-500 mt-2">{error}</p>}
              {success && <p className="text-xs sm:text-sm text-emerald-400 mt-2">{success}</p>}

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 sm:mt-3 w-full rounded-full bg-yellow-400 px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-sm font-semibold text-slate-950 transition hover:bg-yellow-300 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
              >
                {isLoading ? "Processing..." : mode === "signup" ? "Create an Account" : "Log In"}
              </button>
            </form>
          </div>
        </div>
      </div>
  );
}

function PasswordToggle({ isVisible, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-white"
      aria-label={isVisible ? "Hide password" : "Show password"}
    >
      {isVisible ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
    </button>
  );
}

function EyeIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639l4.43-4.43a1.012 1.012 0 0 1 1.431 0l4.43 4.43a1.012 1.012 0 0 1 0 .639l-4.43 4.43a1.012 1.012 0 0 1-1.431 0l-4.43-4.43Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function EyeOffIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.243 4.243L6.228 6.228" />
    </svg>
  );
}
