"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { submitAuth } from "../../components/api";
import AuthImage from "../../assets/u_0skhztgdyb-african-woman-9157860_1920.jpg";

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
  const router = useRouter();

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (mode === "signup") {
        if (password !== repeatPassword) {
          throw new Error("Passwords do not match.");
        }

        if (bvn.trim().length !== 11) {
          throw new Error("BVN must be exactly 11 digits.");
        }

        if (nin.trim().length !== 11) {
          throw new Error("NIN must be exactly 11 digits.");
        }

        if (!isAtLeast18(dob)) {
          throw new Error("You must be at least 18 years old to sign up.");
        }

        await submitAuth(
          {
            first_name: fullName.trim(),
            last_name: lastName.trim(),
            email: email.trim(),
            phone_no: phone.trim(),
            password,
            bvn: bvn.trim(),
            nin: nin.trim(),
            dob,
          },
          mode
        );
      } else {
        if (!email.trim()) {
          throw new Error("Please enter your email address.");
        }

        await submitAuth({ email: email.trim(), password }, mode);
      }

      router.push("/");
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
    <div className="min-h-screen overflow-x-hidden bg-slate-950 text-white">
      <div className="flex min-h-screen w-full flex-col lg:flex-row">
        <div className="hidden lg:block lg:w-1/2">
          <div className="relative h-full min-h-[320px] w-full overflow-hidden lg:min-h-screen">
            <Image
              src={AuthImage}
              alt="auth"
              className="object-cover"
              fill
              priority
              sizes="(max-width: 1023px) 0px, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-10 left-10 max-w-sm text-white">
              <h1 className="text-3xl font-bold">Monicare</h1>
              <p className="mt-2 text-lg">Community savings, simplified.</p>
            </div>
          </div>
        </div>

        <div className="flex w-full items-center justify-center bg-slate-900 px-4 py-6 shadow-xl sm:px-6 lg:w-1/2 lg:px-8 lg:py-8">
          <div className="w-full max-w-[440px] rounded-[1.5rem] border border-white/10 bg-slate-900/95 p-4 shadow-2xl backdrop-blur sm:p-6 lg:p-8">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Link href="/" className="inline-flex items-center gap-2 text-sm text-white hover:text-yellow-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </Link>
              </div>
              <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:w-auto sm:justify-end">
                <button
                  onClick={() => setMode("signup")}
                  className={`${mode === "signup" ? "bg-yellow-400 text-slate-950" : "bg-transparent text-slate-400"} rounded-full px-4 py-1 text-sm font-semibold`}
                >
                  Sign Up
                </button>
                <button
                  onClick={() => setMode("login")}
                  className={`${mode === "login" ? "bg-yellow-400 text-slate-950" : "bg-transparent text-slate-400"} rounded-full px-4 py-1 text-sm font-semibold`}
                >
                  Log In
                </button>
              </div>
            </div>

            <h2 className="mb-4 text-center text-xl font-semibold sm:text-left">{mode === "signup" ? "Create An Account" : "Welcome Back"}</h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === "signup" && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-slate-400 mb-1 ml-4">First Name</label>
                    <input
                      id="firstName"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="First name"
                      className="w-full rounded-full bg-slate-800 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-slate-400 mb-1 ml-4">Last Name</label>
                    <input
                      id="lastName"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                      className="w-full rounded-full bg-slate-800 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none"
                    />
                  </div>
                </div>
              )}
              {mode === "signup" && (
                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="bvn" className="mb-1 ml-4 block text-sm font-medium text-slate-400">BVN</label>
                    <input
                      id="bvn"
                      required
                      type="text"
                      inputMode="numeric"
                      maxLength={11}
                      value={bvn}
                      onChange={(e) => setBvn(e.target.value)}
                      placeholder="BVN"
                      className="w-full rounded-full bg-slate-800 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none"
                    />
                    <p className="mt-1 ml-4 text-xs text-slate-500">11 digits only.</p>
                  </div>
                  <div>
                    <label htmlFor="nin" className="mb-1 ml-4 block text-sm font-medium text-slate-400">NIN</label>
                    <input
                      id="nin"
                      required
                      type="text"
                      inputMode="numeric"
                      maxLength={11}
                      value={nin}
                      onChange={(e) => setNin(e.target.value)}
                      placeholder="NIN"
                      className="w-full rounded-full bg-slate-800 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none"
                    />
                    <p className="mt-1 ml-4 text-xs text-slate-500">11 digits only.</p>
                  </div>
                </div>
              )}
              {mode === "signup" && (
                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="dob" className="mb-1 ml-4 block text-sm font-medium text-slate-400">Date of Birth</label>
                    <input
                      id="dob"
                      required
                      type="date"
                      value={dob}
                      max={maxDobDate()}
                      onChange={(e) => setDob(e.target.value)}
                      placeholder="Date of Birth"
                      className="w-full rounded-full bg-slate-800 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none appearance-none"
                    />
                    <p className="mt-1 ml-4 text-xs text-slate-500">Use the date picker format.</p>
                  </div>
                  <div>
                    <label htmlFor="phone" className="mb-1 ml-4 block text-sm font-medium text-slate-400">Phone Number</label>
                    <input
                      id="phone"
                      required
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Phone number"
                      className="w-full rounded-full bg-slate-800 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none"
                    />
                  </div>
                </div>
              )}

              {mode === "login" ? (
                <div>
                  <label htmlFor="email-login" className="mb-1 ml-4 block text-sm font-medium text-slate-400">Email</label>
                  <input
                    id="email-login"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full rounded-full bg-slate-800 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none"
                  />
                  <p className="mt-1 ml-4 text-xs text-slate-500">Use the email you registered with.</p>
                </div>
              ) : (
                <div>
                  <label htmlFor="email" className="mb-1 ml-4 block text-sm font-medium text-slate-400">Email</label>
                  <input
                    id="email"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter Your Email"
                    className="w-full rounded-full bg-slate-800 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none"
                  />
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-400 mb-1 ml-4">Password</label>
                <input
                  id="password"
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full rounded-full bg-slate-800 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none"
                />
              </div>

              {mode === "signup" && (
                <div>
                  <label htmlFor="repeatPassword" className="block text-sm font-medium text-slate-400 mb-1 ml-4">Confirm Password</label>
                  <input
                    id="repeatPassword"
                    required
                    type="password"
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    placeholder="Confirm Password"
                    className="w-full rounded-full bg-slate-800 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none"
                  />
                </div>
              )}

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={isLoading}
                className="mt-3 w-full rounded-full bg-yellow-400 px-6 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-yellow-300 disabled:opacity-60 sm:py-3"
              >
                {isLoading ? "Processing..." : mode === "signup" ? "Create an Account" : "Log In"}
              </button>
            </form>

           
            
          </div>
        </div>
      </div>
    </div>
  );
}
