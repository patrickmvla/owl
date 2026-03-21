"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartLine,
  MagnifyingGlass,
  Briefcase,
  Eye,
  ListStar,
  Bell,
  CurrencyDollar,
  Gear,
  type Icon,
} from "@phosphor-icons/react";
import { Tooltip } from "radix-ui";
import { cn } from "@/lib/utils/cn";

interface NavItem {
  href: string;
  label: string;
  icon: Icon;
}

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: ChartLine },
  { href: "/market", label: "Markets", icon: MagnifyingGlass },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/watchlist", label: "Watchlist", icon: ListStar },
  { href: "/peg", label: "Peg Monitor", icon: Eye },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/settlement", label: "Settlement", icon: CurrencyDollar },
];

const bottomItems: NavItem[] = [
  { href: "/settings", label: "Settings", icon: Gear },
];

function RailItem({ href, label, icon: Icon }: NavItem) {
  const pathname = usePathname();
  const isActive = href === "/"
    ? pathname === "/"
    : pathname.startsWith(href);

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <Link
          href={href}
          aria-label={label}
          aria-current={isActive ? "page" : undefined}
          data-active={isActive}
          className={cn(
            "flex h-12 w-full items-center justify-center",
            "text-muted-foreground",
            "hover:bg-accent/50 hover:text-accent-foreground",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
            "transition-colors",
            "data-[active=true]:bg-accent/50 data-[active=true]:text-foreground",
          )}
        >
          <Icon
            size={20}
            weight={isActive ? "bold" : "regular"}
          />
        </Link>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="right"
          sideOffset={8}
          className="z-50 rounded-sm bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md border border-border"
        >
          {label}
          <Tooltip.Arrow className="fill-popover" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export function IconRail() {
  return (
    <Tooltip.Provider delayDuration={0} skipDelayDuration={0}>
      <nav
        role="navigation"
        aria-label="Main navigation"
        className="flex h-full w-[var(--rail-width)] flex-col border-r border-border bg-background"
      >
        <div className="flex flex-1 flex-col gap-1 py-2">
          {navItems.map((item) => (
            <RailItem key={item.href} {...item} />
          ))}
        </div>

        <div className="flex flex-col gap-1 py-2 border-t border-border">
          {bottomItems.map((item) => (
            <RailItem key={item.href} {...item} />
          ))}
        </div>
      </nav>
    </Tooltip.Provider>
  );
}
