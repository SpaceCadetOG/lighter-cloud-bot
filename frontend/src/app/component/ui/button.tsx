// frontend/src/app/component/ui/button.tsx
import * as React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
}

export function Button({
  className = "",
  variant = "primary",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-xs font-semibold " +
    "transition-colors border focus:outline-none focus:ring-2 focus:ring-purple-400/70";

  const styles =
    variant === "primary"
      ? "bg-purple-600 hover:bg-purple-500 border-purple-500 text-white"
      : "bg-transparent hover:bg-purple-900/40 border-purple-700 text-purple-100";

  return <button className={`${base} ${styles} ${className}`} {...props} />;
}