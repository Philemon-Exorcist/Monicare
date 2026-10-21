import { redirect } from "next/navigation";

export default async function GroupInvitePage({ params }) {
  const { groupId } = await params;
  const baseUrl =
    process.env.GROUP_LINK_BASE_URL ||
    "https://monicare-theta.vercel.app";
  const inviteLink = `${baseUrl.replace(/\/+$/, "")}/group/${groupId}`;

  redirect(
    `/assets/personal-dash/join?invite=${encodeURIComponent(inviteLink)}`
  );
}
