"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoMark, LogoWord } from "./Logo";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`nav${scrolled ? " scrolled" : ""}`}>
      <div className="nav-inner">
        <Link href="/" className="nav-logo" aria-label="thespot.lol home">
          <LogoMark />
          <LogoWord />
        </Link>
        <nav className="nav-links" aria-label="site">
          <Link href="/" className={pathname === "/" ? "active" : ""}>
            Leaderboard
          </Link>
          <Link href="/#categories">Categories</Link>
          <Link href="/about" className={pathname === "/about" ? "active" : ""}>
            About
          </Link>
          <Link href="/rules" className={pathname === "/rules" ? "active" : ""}>
            Rules
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

function ThemeToggle() {
  const [, force] = useState(0);

  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    // cookie, not localStorage, so the server renders the right theme
    document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`;
    force((n) => n + 1);
  }

  return (
    <button className="theme-toggle keep" onClick={toggle} aria-label="toggle theme">
      <svg className="tt-moon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M21.64 13.65a9.6 9.6 0 0 1-11.29-11.3.75.75 0 0 0-.99-.85 10.35 10.35 0 1 0 13.13 13.14.75.75 0 0 0-.85-.99z" />
      </svg>
      <svg className="tt-sun" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0-15a1 1 0 0 1 1 1v1.5a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1zm0 17.5a1 1 0 0 1 1 1V22a1 1 0 1 1-2 0v-1.5a1 1 0 0 1 1-1zM22 11a1 1 0 1 1 0 2h-1.5a1 1 0 1 1 0-2H22zM4.5 11a1 1 0 1 1 0 2H3a1 1 0 1 1 0-2h1.5zm14.57-6.07a1 1 0 0 1 0 1.41l-1.06 1.07a1 1 0 1 1-1.42-1.42l1.07-1.06a1 1 0 0 1 1.41 0zM7.4 16.6a1 1 0 0 1 0 1.4l-1.06 1.07a1 1 0 0 1-1.42-1.41L6 16.6a1 1 0 0 1 1.4 0zm11.67 2.47a1 1 0 0 1-1.41 0l-1.07-1.06a1 1 0 0 1 1.42-1.42l1.06 1.07a1 1 0 0 1 0 1.41zM7.4 7.4A1 1 0 0 1 6 7.4L4.92 6.34a1 1 0 0 1 1.42-1.41L7.4 6a1 1 0 0 1 0 1.4z" />
      </svg>
    </button>
  );
}
