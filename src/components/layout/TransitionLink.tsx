"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { playCurtain } from "./PageCurtain";

type Props = ComponentProps<typeof Link> & { href: string };

export function TransitionLink({ href, onClick, ...rest }: Props) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();

  return (
    <Link
      href={href}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        // Let the browser/Next handle anything that isn't a plain same-tab internal navigation.
        if (
          e.defaultPrevented ||
          reducedMotion ||
          e.button !== 0 ||
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.altKey ||
          rest.target === "_blank" ||
          !href.startsWith("/") ||
          href === pathname
        )
          return;
        if (playCurtain(href)) e.preventDefault();
      }}
    />
  );
}
