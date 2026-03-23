import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils/cn";
import { QueryProvider } from "@/lib/providers/query-provider";
import { Analytics } from "@vercel/analytics/react";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Owl",
  description: "Real-time market intelligence across traditional and crypto markets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "dark",
        "antialiased",
        geistSans.variable,
        jetbrainsMono.variable,
      )}
    >
      <body className="h-dvh overflow-hidden">
          <QueryProvider>{children}</QueryProvider>
          <Analytics />
      </body>
    </html>
  );
}
