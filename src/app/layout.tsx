import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { cookies } from "next/headers";
import Link from "next/link";
import Nav from "@/components/Nav";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jbMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-jbmono",
});

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thespot.lol";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "thespot.lol — rank is the money",
  description:
    "a public leaderboard where your rank is decided by one thing: how much you have paid. $5 gets you on.",
  openGraph: {
    title: "thespot.lol — rank is the money",
    description:
      "a public leaderboard where your rank is decided by one thing: how much you have paid. $5 gets you on.",
    url: "/",
    siteName: "thespot.lol",
    type: "website",
    images: [{ url: "/api/og", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@getascent",
    title: "thespot.lol — rank is the money",
    description:
      "a public leaderboard where your rank is decided by one thing: how much you have paid. $5 gets you on.",
    images: ["/api/og"],
  },
  icons: [
    { url: "/favicon-light.svg", media: "(prefers-color-scheme: light)" },
    { url: "/favicon-dark.svg", media: "(prefers-color-scheme: dark)" },
    { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
    { rel: "apple-touch-icon", url: "/apple-touch-icon.png", sizes: "180x180" },
  ],
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F8FA" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0D11" },
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "thespot.lol",
      url: SITE,
      description:
        "a public leaderboard where rank is decided by one thing: how much you paid.",
    },
    {
      "@type": "Organization",
      name: "thespot.lol",
      url: SITE,
      logo: `${SITE}/icon-32.png`,
      sameAs: ["https://www.linkedin.com/in/getascent/"],
    },
  ],
};

// runs before first paint so dark-mode users never see a white flash
const themeScript = `(function(){try{var m=document.cookie.match(/(?:^|; )theme=(dark|light)/);var t=m?m[1]:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=t;}catch(e){}})()`;

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieTheme = (await cookies()).get("theme")?.value;
  const theme = cookieTheme === "dark" || cookieTheme === "light" ? cookieTheme : undefined;

  return (
    <html
      lang="en"
      data-theme={theme}
      suppressHydrationWarning
      className={`${inter.variable} ${jbMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <Nav />
        {children}
        <footer className="site-footer">
          <span>
            built by{" "}
            <a
              href="https://www.linkedin.com/in/getascent/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Jam
            </a>
            . no ads, no api keys, no revenue share.
          </span>
          <Link href="/rules">rules</Link>
          <Link href="/about">about</Link>
          <Link href="/terms">terms</Link>
          <Link href="/privacy">privacy</Link>
          <Link href="/refunds">refunds</Link>
        </footer>
      </body>
    </html>
  );
}
