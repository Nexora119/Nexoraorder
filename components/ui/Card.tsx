import { HTMLAttributes } from "react";

export function Card({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`
        bg-card border border-border rounded-lg shadow-sm
        p-4 sm:p-6
        transition-shadow duration-DEFAULT ease-out
        hover:shadow-md
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
