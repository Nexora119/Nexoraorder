import Image from "next/image";
import Link from "next/link";
import { getAuthUser } from "@/lib/auth/authorize";
import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";

// Rendered as a real <header> element with the logo as inline layout content
// (not an absolutely-positioned image on top of the page). Background is
// white per the Design System — the logo's own background was removed so
// it sits directly on the page rather than showing a boxed image.
//
// Logo dimensions: intrinsic 909x448 (aspect ratio ~2.03:1), displayed at
// 81x40 to keep the header a comfortable, standard height.
//
// Async Server Component: calls getAuthUser() once per page load to decide
// whether to show "Log out". When logged out, this renders identically to
// before (logo only) — the existing Login/Sign up buttons on the homepage
// itself are untouched, so there's no duplication.
export async function Header() {
  const user = await getAuthUser();

  return (
    <header className="bg-background border-b border-border">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" aria-label="My Takeaway — home">
          <Image
            src="/logo.png"
            alt="My Takeaway logo"
            width={81}
            height={40}
            priority
          />
        </Link>

        {user && (
          <form action={signOut}>
            <Button type="submit" variant="secondary" aria-label="Log out">
              Log out
            </Button>
          </form>
        )}
      </div>
    </header>
  );
}
