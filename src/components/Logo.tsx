/**
 * The spot: one filled dot with a ring around it, broken at the top
 * right. A position that is not locked — nobody owns the spot.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className ?? "logo-mark"}
      aria-hidden="true"
    >
      <path
        d="M16 3 A13 13 0 1 1 15.9 3"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="60 22"
        transform="rotate(-42 16 16)"
      />
      <circle cx="16" cy="16" r="6" fill="currentColor" />
    </svg>
  );
}

export function LogoWord() {
  return (
    <span className="logo-word">
      thespot<span className="tld">.lol</span>
    </span>
  );
}
