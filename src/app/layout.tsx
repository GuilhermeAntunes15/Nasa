import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { SiteNav } from "@/components/site-nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "RotaTerra — Smarter crop rotations. Stronger farms.",
  description:
    "Exploratory decision support that compares crop rotations under historical NASA POWER climate data and hypothetical scenarios.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-navy focus:px-4 focus:py-2 focus:font-medium focus:text-cream focus:outline-2 focus:outline-sky"
        >
          Skip to content
        </a>
        <SiteNav />
        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6 md:py-12">{children}</div>
        </main>
        <footer className="border-t bg-background py-6 text-sm text-muted-foreground">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 md:px-6">
            <p className="font-medium text-foreground">Smarter crop rotations. Stronger farms.</p>
            <p>
              Data: NASA POWER. Map: OpenFreeMap, © OpenMapTiles, © OpenStreetMap contributors. Exploratory decision
              support, not an agricultural prediction. RotaTerra is an independent project and is not endorsed by NASA.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
