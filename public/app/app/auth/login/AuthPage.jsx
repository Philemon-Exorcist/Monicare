"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AuthImage from "../../assets/u_0skhztgdyb-african-woman-9157860_1920.jpg";

export default function AuthPage() {
  const [mode, setMode] = useState("signup");
  const [fullName, setFullName] = useState("");
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    if (mode === "signup" && password !== repeatPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 800));

    router.push("/");

    setIsLoading(false);
  };

  return (
    <div className="h-screen bg-slate-950 text-white flex items-stretch overflow-hidden">
      <div className="w-full flex flex-col lg:flex-row h-screen">
        <div className="hidden lg:block lg:w-1/2 h-screen">
          <div className="relative h-full w-full overflow-hidden">
            <Image
              src={AuthImage}
              alt="auth"
              className="object-cover"
              fill
              priority
            />
          </div>
        </div>

        <div className="w-full lg:w-1/2 bg-slate-900 p-6 lg:p-10 shadow-xl h-full flex items-center justify-center overflow-hidden">
          <div className="w-full max-w-md">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <Link href="/" className="inline-flex items-center gap-2 text-sm text-white hover:text-yellow-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </Link>
              </div>
              <div className="flex items-center gap-3">
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

            <h2 className="mb-6 text-center text-2xl font-semibold">{mode === "signup" ? "Create An Account" : "Welcome Back"}</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="grid grid-cols-2 gap-3">
                  <input
                    required
                    value={fullName.split(" ")[0] || fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="First name"
                    className="rounded-full bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none"
                  />
                  <input
                    required
                    placeholder="Last name"
                    className="rounded-full bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none"
                  />
                </div>
              )}
              {mode === "signup" && (
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <input
                    required
                    type="text"
                    value={bvn}
                    onChange={(e) => setBvn(e.target.value)}
                    placeholder="BVN"
                    className="rounded-full bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none"
                  />
                  <input
                    required
                    type="text"
                    value={nin}
                    onChange={(e) => setNin(e.target.value)}
                    placeholder="NIN"
                    className="rounded-full bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none"
                  />
                </div>
              )}
              {mode === "signup" && (
                <div className="mt-3">
                  <input
                    required
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    placeholder="Date of Birth"
                    className="w-full rounded-full bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none"
                  />
                </div>
              )}

              {mode === "login" ? (
                <div>
                  <input
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone number"
                    className="w-full rounded-full bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none"
                  />
                </div>
              ) : (
                <div>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter Your Email"
                    className="w-full rounded-full bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none"
                  />
                </div>
              )}

              <div>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full rounded-full bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none"
                />
              </div>

              {mode === "signup" && (
                <div>
                  <input
                    required
                    type="password"
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    placeholder="Confirm Password"
                    className="w-full rounded-full bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none"
                  />
                </div>
              )}

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={isLoading}
                className="mt-4 w-full rounded-full bg-yellow-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-yellow-300 disabled:opacity-60"
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
