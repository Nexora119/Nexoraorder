import { ButtonHTMLAttributes, forwardRef } from "react";
import Link from "next/link";

type Variant = "primary" | "secondary" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  href?: string; // when provided, renders as a navigable Link styled as a button
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-primary text-white shadow-sm hover:bg-secondary",
  secondary:
    "bg-background text-primary border border-primary hover:bg-card",
  danger:
    "bg-danger text-white shadow-sm hover:opacity-90",
};

const baseClasses = `
  inline-flex items-center justify-center
  rounded-md px-6 py-3 text-body font-medium
  transition-colors duration-DEFAULT ease-out
  disabled:opacity-50 disabled:pointer-events-none
`;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", href, className = "", children, ...props }, ref) => {
    const classes = `${baseClasses} ${variantStyles[variant]} ${className}`;

    if (href) {
      return (
        <Link href={href} className={classes}>
          {children}
        </Link>
      );
    }

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
