import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";

const variants = {
  lime: "bg-lime text-ink hover:bg-lime-deep",
  olive: "bg-olive text-paper hover:bg-olive-deep",
  ghost: "border border-olive/25 bg-card text-ink hover:border-olive hover:bg-white",
  soft: "bg-white text-ink hover:bg-paper",
  danger: "bg-danger text-white hover:bg-olive-deep",
} as const;

const sizes = {
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
  sm: "h-9 px-3.5 text-sm",
} as const;

export function buttonClass(
  variant: keyof typeof variants = "lime",
  size: keyof typeof sizes = "md",
  className?: string,
) {
  return cx(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  href?: string;
  children: ReactNode;
};

export function Button({
  variant = "lime",
  size = "md",
  className,
  href,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  const classes = buttonClass(variant, size, className);
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}
