"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/climate", label: "Climate" },
  { href: "/simulator", label: "Rotations" },
  { href: "/scenarios", label: "Scenario Lab" },
  { href: "/summary", label: "Summary" },
  { href: "/science", label: "Science" },
];

function NavLinks({ query, onNavigate, onNavy }: { query: string; onNavigate?: () => void; onNavy?: boolean }) {
  const pathname = usePathname();
  return (
    <ul className="flex flex-col gap-1 md:flex-row md:gap-1">
      {LINKS.map(({ href, label }) => (
        <li key={href}>
          <Link
            href={query ? `${href}?${query}` : href}
            aria-current={pathname === href ? "page" : undefined}
            onClick={onNavigate}
            className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors aria-[current=page]:font-semibold md:py-1.5 ${
              onNavy
                ? "text-cream/80 hover:bg-white/10 hover:text-cream aria-[current=page]:bg-white/10 aria-[current=page]:text-cream aria-[current=page]:shadow-[inset_0_-2px_0_var(--color-sky)]"
                : "hover:bg-muted aria-[current=page]:bg-accent"
            }`}
          >
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Nav({ query }: { query: string }) {
  const [open, setOpen] = useState(false);
  return (
    <header data-nav data-on-navy className="sticky top-0 z-40 bg-navy text-cream print:hidden">
      <nav aria-label="Main" className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link href={query ? `/?${query}` : "/"} className="flex items-center gap-2 rounded-md font-heading text-xl font-medium tracking-tight">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6">
            <circle cx="12" cy="12" r="10.5" fill="none" stroke="var(--color-sage)" strokeWidth="1.5" />
            <path d="M12 21V11M12 11c0-3.5 2.5-5.5 6-5.5 0 3.5-2.5 5.5-6 5.5zM12 14c0-2.5-1.8-4-4.5-4 0 2.5 1.8 4 4.5 4z" fill="var(--color-sage)" stroke="var(--color-sage)" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
          RotaTerra
        </Link>
        <div className="hidden md:block">
          <NavLinks query={query} onNavy />
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className={`${buttonVariants({ variant: "outline" })} border-cream/30! bg-transparent! text-cream! hover:bg-white/10! md:hidden`}>
            <MenuIcon aria-hidden="true" />
            Menu
          </SheetTrigger>
          <SheetContent side="left" className="gap-6 p-5">
            <SheetTitle className="font-heading text-xl">RotaTerra</SheetTitle>
            <NavLinks query={query} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}

function NavWithQuery() {
  return <Nav query={useSearchParams().toString()} />;
}

export function SiteNav() {
  return (
    <Suspense fallback={<Nav query="" />}>
      <NavWithQuery />
    </Suspense>
  );
}
