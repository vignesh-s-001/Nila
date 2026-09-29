"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/",         label: "Home",     icon: "favorite" },
  { href: "/places",   label: "Places",   icon: "cottage" },
  { href: "/tasks",    label: "Tasks",    icon: "spa" },
  { href: "/journey",  label: "Journey",  icon: "explore" },
  { href: "/ai",       label: "Nila AI",  icon: "auto_awesome" },
  { href: "/settings", label: "Settings", icon: "tune" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav shadow-[0_-8px_24px_rgba(90,39,64,0.06)]" aria-label="Main navigation">
      {NAV_ITEMS.map(({ href, label, icon }) => {
        const isActive =
          href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            id={`nav-${label.toLowerCase()}`}
            className={`nav-item${isActive ? " active" : ""}`}
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="material-symbols-outlined text-[24px]" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
              {icon}
            </span>
            <span className="nav-label font-label-sm">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
