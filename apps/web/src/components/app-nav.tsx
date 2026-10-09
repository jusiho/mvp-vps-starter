"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Navegación del panel. Agrega aquí cada sección nueva de la app.
const items = [
  { href: "/dashboard", label: "Inicio" },
  { href: "/notes", label: "Notas" },
];

export function AppNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-5 text-sm font-medium">
      {items.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "text-accent underline underline-offset-8"
                : "text-zinc-600 hover:text-foreground dark:text-zinc-400"
            }
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
