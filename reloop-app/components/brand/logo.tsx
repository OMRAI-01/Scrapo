import Link from "next/link";
import { cx } from "@/lib/cx";

function LoopMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M16.6 8.2a5.2 5.2 0 1 0 1.2 4.4" strokeLinecap="round" />
      <path d="M18.2 6.4V12h-5.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({
  tone = "olive",
  className,
}: {
  tone?: "olive" | "lime";
  className?: string;
}) {
  const ink = tone === "lime" ? "text-lime" : "text-olive";
  const border = tone === "lime" ? "border-lime/80" : "border-olive";
  return (
    <Link
      href="/"
      aria-label="Scrapo home"
      className={cx("inline-flex rounded-full", className)}
    >
      <span className={cx("inline-flex items-center rounded-full border-2 py-1 pl-3.5 pr-1.5", border)}>
        <span className={cx("font-display text-[1.05rem] leading-none font-medium tracking-tight", ink)}>
          scrapo
        </span>
        <span className="ml-2 grid h-7 w-7 place-items-center rounded-full bg-lime text-olive">
          <LoopMark />
        </span>
      </span>
    </Link>
  );
}
