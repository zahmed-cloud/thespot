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

export const metadata: Metadata = {
  title: "thespot.lol",
  description:
    "a public leaderboard where rank is decided by one thing: how much you paid.",
  icons: [
    { url: "/favicon-light.svg", media: "(prefers-color-scheme: light)" },
    { url: "/favicon-dark.svg", media: "(prefers-color-scheme: dark)" },
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
      </head>
      <body>
        <Nav />
        {children}
        <footer className="site-footer">
          <span>
            built by{" "}
            <a
              href="https://x.com/getascent"
              target="_blank"
              rel="noopener noreferrer"
            >
              @getascent
            </a>
            . no ads, no api keys, no revenue share.
          </span>
          <Link href="/terms">terms</Link>
          <Link href="/privacy">privacy</Link>
          <Link href="/refunds">refunds</Link>
        </footer>
      </body>
    </html>
  );
}
