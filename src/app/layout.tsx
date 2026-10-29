import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import { SEEN_KEY } from "@/components/intro/bridge";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PageCurtain } from "@/components/layout/PageCurtain";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { site } from "@/content/site";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["wdth"],
});

// Static cut, not the wdth axis: WebKit on iOS ignores font-stretch and overlapped the letters.
// ExtraCondensed (wdth 62) is the width the design was approved at.
const archivoCondensed = localFont({
  variable: "--font-condensed",
  src: [
    { path: "./fonts/ArchivoExtraCondensed-Bold.woff2", weight: "700" },
    { path: "./fonts/ArchivoExtraCondensed-ExtraBold.woff2", weight: "800" },
  ],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? `https://${site.domain}`),
  title: { default: `${site.name} | ${site.tagline}`, template: `%s | ${site.name}` },
  description: site.description,
  openGraph: { siteName: site.name, locale: "pt_BR", type: "website" },
};

const INTRO_SCRIPT = `var d=document.documentElement;d.classList.add('js');try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&!/[?&](p|debug)(=|&|$)/.test(location.search))d.classList.add(sessionStorage.getItem('${SEEN_KEY}')?'intro-short':'intro-full')}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the inline script below adds the `js` class before React hydrates
    <html
      lang="pt-BR"
      className={`${archivo.variable} ${archivoCondensed.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Runs before first paint: `.js [data-reveal-immediate]` hides above-the-fold reveals, and the intro mode
            (globals.css) picks the loader on the first visit of the session, the short entrance after it. No intro
            with reduced motion or with the journey's ?p / ?debug. */}
        <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <SmoothScroll />
        <Header />
        {children}
        <Footer />
        <WhatsAppButton />
        <PageCurtain />
        {/* In dev it only fetches a debug script from Vercel's CDN, which WebKit gets a 403 for (breaks e2e). */}
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
