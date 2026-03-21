import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8">
      <Link href="/" className="text-lg font-semibold tracking-tight text-foreground">
        Owl
      </Link>
      {children}
    </div>
  );
}
