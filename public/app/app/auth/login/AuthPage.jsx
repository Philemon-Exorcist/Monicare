"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { login, signup } from "../../components/api";
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (mode === "signup") {
        if (password !== repeatPassword) {
          throw new Error("Passwords do not match.");
        }

        await signup({
          first_name: fullName,
          last_name: lastName,
          email,
          phone_no: phone,
          password,
          bvn,
          nin,
          dob,
        });
      } else {
        await login({ phone_no: phone, password });
      }

      router.push("/");
    } catch (error) {
      setError(error?.message || "Unable to connect to backend.");
    } finally {
      setIsLoading(false);
    }
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
            <div className="absolute bottom-10 left-10 text-white">
              <h1 className="text-3xl font-bold">Monicare</h1>
              <p className="mt-2 text-lg">Community savings, simplified.</p>
            </div>
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
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-slate-400 mb-1 ml-4">First Name</label>
                    <input
                      id="firstName"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="First name"
                      className="w-full rounded-full bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none"
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
                      className="w-full rounded-full bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none"
                    />
                  </div>
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
                  <div>
                    <label htmlFor="bvn" className="block text-sm font-medium text-slate-400 mb-1 ml-4">BVN</label>
                    <input
                      id="bvn"
                      required
                      type="text"
                      value={bvn}
                      onChange={(e) => setBvn(e.target.value)}
                      placeholder="BVN"
                      className="w-full rounded-full bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="nin" className="block text-sm font-medium text-slate-400 mb-1 ml-4">NIN</label>
                    <input
                      id="nin"
                      required
                      type="text"
                      value={nin}
                      onChange={(e) => setNin(e.target.value)}
                      placeholder="NIN"
                      className="w-full rounded-full bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none"
                    />
                  </div>
                </div>
              )}
              {mode === "signup" && (
                <div className="mt-3">
                  <label htmlFor="dob" className="block text-sm font-medium text-slate-400 mb-1 ml-4">Date of Birth</label>
                  <input
                    id="dob"
                    required
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    placeholder="Date of Birth"
                    className="w-full rounded-full bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none"
                    className="w-full rounded-full bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none appearance-none"
                  />
                </div>
              )}

              {mode === "login" ? (
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-400 mb-1 ml-4">Phone Number</label>
                  <input
                    id="phone"
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone number"
                    className="w-full rounded-full bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none"
                    className="w-full rounded-full bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none "
                  />
                </div>
              ) : (
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-400 mb-1 ml-4">Email</label>
                  <input
                    id="email"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter Your Email"
                    className="w-full rounded-full bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none"
                    className="w-full rounded-full bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none "
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
                  className="w-full rounded-full bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none"
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
