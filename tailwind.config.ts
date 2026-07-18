import type { Config } from "tailwindcss";

// NexoraOrders design tokens — do not hand-pick colors/spacing outside this file.
// Every screen should draw from these values so the product stays visually consistent.
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",
        secondary: "#1E40AF",
        accent: "#38BDF8",
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        background: "#FFFFFF",
        card: "#F8FAFC",
        border: "#E5E7EB",
        "text-primary": "#111827",
        "text-secondary": "#6B7280",
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
      },
      boxShadow: {
        sm: "0 2px 8px rgba(0,0,0,.05)",
        md: "0 8px 24px rgba(0,0,0,.08)",
        lg: "0 20px 50px rgba(0,0,0,.12)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontSize: {
        h1: ["48px", { lineHeight: "1.1", fontWeight: "700" }],
        h2: ["36px", { lineHeight: "1.15", fontWeight: "700" }],
        h3: ["28px", { lineHeight: "1.2", fontWeight: "600" }],
        h4: ["22px", { lineHeight: "1.25", fontWeight: "600" }],
        body: ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        small: ["14px", { lineHeight: "1.4", fontWeight: "400" }],
      },
      spacing: {
        // Explicit named steps matching the approved spacing scale (avoid arbitrary values)
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "6": "24px",
        "8": "32px",
        "12": "48px",
        "16": "64px",
      },
      transitionDuration: {
        DEFAULT: "250ms",
      },
      screens: {
        // Mobile-first: base styles = mobile, then min-width breakpoints layer up
        sm: "640px", // tablet
        lg: "1024px", // laptop
        xl: "1280px", // desktop
      },
    },
  },
  plugins: [],
};

export default config;
