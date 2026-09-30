"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/categories", label: "Categorías" },
  { href: "/payment-methods", label: "Pagos" },
  { href: "/balance", label: "Balance" },
  { href: "/settings", label: "Ajustes" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="mx-auto flex w-full max-w-3xl gap-4 overflow-x-auto px-4 pb-2 text-sm whitespace-nowrap">
      {LINKS.map((link) => {
        const active =
          link.href === "/"
            ? pathname === "/"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              active
                ? "font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
