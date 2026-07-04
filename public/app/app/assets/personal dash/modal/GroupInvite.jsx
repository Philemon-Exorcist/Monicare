export default function GroupInvite({ onCopy, copyState, inviteLink }) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-neutral-500">
        Invite Preview
      </p>
      <p className="mt-3 text-sm leading-6 text-neutral-600">
        Share this invite link with the people you want in the circle.
      </p>
      <div className="mt-4 rounded-xl bg-neutral-50 p-4">
        <p className="break-all font-mono text-xs text-neutral-500">{inviteLink}</p>
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg border border-neutral-300 bg-white text-sm font-black text-black transition hover:bg-neutral-50"
      >
        {copyState}
      </button>
    </section>
  );
}
