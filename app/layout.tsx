import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/components/layout/Header";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "My Takeaway — Skip the queue",
  description: "Order ahead from your favourite kota and takeaway spots, and skip the line.",
};

// Header calls getAuthUser() on every request, which depends on the
// current session cookie — this MUST never be served from a cached/static
// version, or a logged-in user could see a stale logged-out header (or
// vice versa). cookies() usage in getAuthUser() should already trigger
// Next's automatic dynamic-rendering detection, but forcing it explicitly
// removes any ambiguity while debugging exactly this class of issue.
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
