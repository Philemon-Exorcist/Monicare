"use client";

export default function DashboardHeader({ name }) {
  const displayName = name || "there";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getCurrentDate = () => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date());
  };

  return (
    <>
      <section className="mt-2">
        <h1 className="text-2xl font-black leading-tight tracking-tight sm:text-3xl">{getGreeting()}, {displayName}</h1>
        <p className="mt-1 text-sm text-neutral-500">{getCurrentDate()} - your circles are active and on track.</p>
      </section>
    </>
  );
}
