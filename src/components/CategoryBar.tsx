"use client";

import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CATEGORIES } from "@/lib/categories";

/**
 * Sunken segmented control. The active pill slides between positions;
 * it does not repaint. Filtered views stay shareable urls.
 */
export default function CategoryBar({ active }: { active: string | null }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(active);
  const barRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);

  // keep local state in sync when navigation lands
  useEffect(() => setSelected(active), [active]);

  useLayoutEffect(() => {
    const bar = barRef.current;
    const pill = pillRef.current;
    if (!bar || !pill) return;
    const el = bar.querySelector<HTMLElement>(
      `[data-cat="${selected ?? "all"}"]`
    );
    if (!el) return;
    pill.style.width = `${el.offsetWidth}px`;
    pill.style.transform = `translateX(${el.offsetLeft}px)`;
    // scroll the BAR horizontally only — scrollIntoView could scroll
    // the whole page on load of a shared category url
    const target = el.offsetLeft - bar.clientWidth / 2 + el.offsetWidth / 2;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    bar.scrollTo({ left: Math.max(0, target), behavior: reduced ? "auto" : "smooth" });
  }, [selected]);

  function pick(slug: string | null) {
    setSelected(slug);
    router.push(slug ? `/c/${slug}` : "/", { scroll: false });
  }

  const items = [{ slug: null as string | null, label: "all" }, ...CATEGORIES];

  return (
    <div className="cat-wrap" id="categories">
      <div className="cat-bar" ref={barRef} role="group" aria-label="categories">
        <span className="cat-pill" ref={pillRef} aria-hidden="true" />
        {items.map((c) => (
          <button
            key={c.slug ?? "all"}
            type="button"
            data-cat={c.slug ?? "all"}
            className="cat"
            aria-selected={selected === c.slug}
            aria-pressed={selected === c.slug}
            onClick={() => pick(c.slug)}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
