import Image from "next/image";
import Link from "next/link";

// Rendered as a real <header> element with the logo as inline layout content
// (not an absolutely-positioned image on top of the page). Background is
// white per the Design System — the logo's own background was removed so
// it sits directly on the page rather than showing a boxed image.
//
// Logo dimensions: intrinsic 909x448 (aspect ratio ~2.03:1), displayed at
// 81x40 to keep the header a comfortable, standard height.
export function Header() {
  return (
    <header className="bg-background border-b border-border">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center">
        <Link href="/" aria-label="My Takeaway — home">
          <Image
            src="/logo.png"
            alt="My Takeaway logo"
            width={81}
            height={40}
            priority
          />
        </Link>
      </div>
    </header>
  );
}
