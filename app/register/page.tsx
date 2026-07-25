import { redirect } from "next/navigation";

// This route used to be a "coming soon" stub. Business registration now
// actually exists at /signup (create account) -> /business/register
// (business profile). Redirecting rather than deleting the route, so
// anyone with this URL bookmarked/shared doesn't hit a 404.
export default function RegisterBusinessPage() {
  redirect("/signup");
}
