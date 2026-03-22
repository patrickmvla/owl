"use client";

import { useRouter } from "next/navigation";
import { SignOut, User } from "@phosphor-icons/react";
import { DropdownMenu } from "radix-ui";
import { useSession } from "../hooks/use-session";
import { authClient } from "../config/auth-client";

export function UserMenu() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  async function handleSignOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/sign-in");
        },
      },
    });
  }

  // Show placeholder while loading
  if (isPending) {
    return (
      <div className="flex h-8 w-8 items-center justify-center">
        <User size={16} className="text-muted-foreground" />
      </div>
    );
  }

  // Show sign-in icon if no session
  if (!session?.user) {
    return (
      <a
        href="/sign-in"
        className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Sign in"
      >
        <User size={16} />
      </a>
    );
  }

  const initials = session.user.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          aria-label="User menu"
        >
          {initials}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="right"
          sideOffset={8}
          align="end"
          className="z-50 min-w-[180px] border border-border bg-popover p-1 shadow-md"
        >
          <div className="px-2 py-1.5 text-xs">
            <div className="font-medium">{session.user.name}</div>
            <div className="text-muted-foreground">{session.user.email}</div>
          </div>

          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          <DropdownMenu.Item
            onSelect={handleSignOut}
            className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-muted-foreground outline-none hover:bg-muted hover:text-foreground"
          >
            <SignOut size={14} />
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
