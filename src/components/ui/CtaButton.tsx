import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  href: string;
  variant?: "primary" | "ghost";
  children: ReactNode;
};

const variants = {
  primary: { button: "bg-red-500 text-white", arrow: "text-white" },
  ghost: { button: "border border-sand-50/30 text-sand-50 hover:border-sand-50/60", arrow: "text-red-500" },
};

export function CtaButton({ href, variant = "primary", children }: Props) {
  const v = variants[variant];
  return (
    <Link
      href={href}
      className={`group inline-flex min-h-11 items-center gap-3 px-6 py-3 font-semibold uppercase tracking-wide transition-transform duration-150 ease-out active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-sand-50 motion-reduce:transition-none motion-reduce:active:scale-100 ${v.button}`}
    >
      {children}
      {/* arrow.svg as a mask over currentColor, so it can be white on red */}
      <span
        aria-hidden="true"
        className={`h-[0.72em] w-[1.6em] shrink-0 bg-current transition-transform duration-150 ease-out [mask:url(/brand/arrow.svg)_center/contain_no-repeat] group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 ${v.arrow}`}
      />
    </Link>
  );
}
