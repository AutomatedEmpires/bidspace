import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "signal" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-[3px] font-medium tracking-[0.01em] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:cursor-not-allowed disabled:opacity-45 select-none";

const VARIANTS: Record<ButtonVariant, string> = {
  // Structural default — ink on light, bone on dark.
  primary: "bg-ink text-canvas hover:bg-ink-soft dark:bg-canvas dark:text-ink dark:hover:bg-line",
  // Reserved for the high-commitment marketplace actions: bid, publish, book.
  signal: "bg-signal text-white hover:bg-signal-deep",
  secondary:
    "border border-strong bg-transparent text-ink hover:border-ink hover:bg-ink/[0.04] dark:text-canvas dark:hover:border-canvas dark:hover:bg-canvas/[0.06]",
  ghost: "text-ink hover:bg-ink/[0.06] dark:text-canvas dark:hover:bg-canvas/[0.08]",
  danger: "bg-alert text-white hover:bg-alert/90",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-[15px]",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  extra?: string,
): string {
  return cn(BASE, VARIANTS[variant], SIZES[size], extra);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

export function Button({ variant = "primary", size = "md", className, children, ...rest }: ButtonProps) {
  return (
    <button className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}
