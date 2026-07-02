import { LinkIcon, PlusIcon } from "./icons";

export default function DashboardActions() {
  return (
    <section className="mt-6 grid gap-4 sm:grid-cols-2">
      <button className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#ffc400] px-5 text-sm font-black text-black transition hover:bg-[#ffd33d]">
        <PlusIcon className="h-4 w-4" />
        Create New Esusu Circle
      </button>
      <button className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-5 text-sm font-black text-black transition hover:bg-neutral-50">
        <LinkIcon className="h-4 w-4" />
        Join Circle via Invite Link
      </button>
    </section>
  );
}
