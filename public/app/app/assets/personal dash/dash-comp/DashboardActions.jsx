"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LinkIcon, PlusIcon } from "./icons";

export default function DashboardActions() {
  const router = useRouter();

  const handleCreateGroup = () => {
    router.push("/assets/personal%20dash/groupinit");
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={handleCreateGroup}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#ffc400] px-5 text-sm font-black text-black transition hover:bg-[#ffd33d]"
        >
          <PlusIcon className="h-4 w-4" />
          Create New Esusu Circle
        </button>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-5 text-sm font-black text-black transition hover:bg-neutral-50"
        >
          <LinkIcon className="h-4 w-4" />
          Join Circle via Invite Link
        </button>
      </section>
      {isModalOpen && <JoinCircleModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
}

function JoinCircleModal({ onClose }) {
  const router = useRouter();
  const [inviteLink, setInviteLink] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inviteLink) {
      // Assuming the link contains the group ID, we can extract it
      // For now, let's just pass the whole link as a query param
      router.push(`/assets/personal-dash/join-circle?invite=${encodeURIComponent(inviteLink)}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Join a Circle</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-black">&times;</button>
        </div>
        <p className="mt-2 text-sm text-neutral-600">
          Paste the invite link you received to join an existing Esusu circle.
        </p>
        <form onSubmit={handleSubmit} className="mt-6">
          <div>
            <label htmlFor="invite-link" className="text-sm font-semibold">Invite Link</label>
            <input
              id="invite-link"
              type="text"
              value={inviteLink}
              onChange={(e) => setInviteLink(e.target.value)}
              placeholder="https://monicare.com/join/..."
              className="mt-2 w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:border-black focus:outline-none"
              required
            />
          </div>
          <div className="mt-6 flex gap-4">
            <button type="button" onClick={onClose} className="h-11 w-full rounded-lg border border-neutral-300 bg-white text-sm font-bold text-black transition hover:bg-neutral-50">Cancel</button>
            <button type="submit" className="h-11 w-full rounded-lg bg-black text-sm font-bold text-white transition hover:bg-neutral-800">Join Circle</button>
          </div>
        </form>
      </div>
    </div>
  );
}
