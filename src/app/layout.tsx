import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Breitling Technical Exercise",
  description: "Frontend engineer technical exercise storefront starter",
};

// Bridges the OS colour-scheme preference to HeroUI v3's attribute-based dark
// theme. HeroUI activates dark via [data-theme="dark"] (no prefers-color-scheme
// support of its own), while the app's intent is auto dark mode with no manual
// toggle — so this runs before paint to set data-theme from the media query and
// keeps it in sync when the OS preference changes. See ADR 0005.
const themeBridge = `(function(){try{var d=document.documentElement;var m=window.matchMedia('(prefers-color-scheme: dark)');var set=function(e){d.dataset.theme=e.matches?'dark':'light';};set(m);if(m.addEventListener){m.addEventListener('change',set);}else if(m.addListener){m.addListener(set);}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <script dangerouslySetInnerHTML={{ __html: themeBridge }} />
        {children}
      </body>
    </html>
  );
}
