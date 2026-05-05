"use client";

export type FmIconName =
  | "grid"
  | "alert"
  | "home"
  | "users"
  | "search"
  | "plus"
  | "x"
  | "upload"
  | "chev"
  | "img"
  | "menu"
  | "pin"
  | "wave"
  | "logout";

interface IconProps {
  n: FmIconName;
  s?: number;
  c?: string;
}

export function Ico({ n, s = 16, c = "currentColor" }: IconProps) {
  const paths: Record<FmIconName, React.ReactNode> = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" stroke={c} strokeWidth="1.5" fill="none" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" stroke={c} strokeWidth="1.5" fill="none" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" stroke={c} strokeWidth="1.5" fill="none" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" stroke={c} strokeWidth="1.5" fill="none" />
      </>
    ),
    alert: (
      <>
        <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.5" fill="none" />
        <line x1="12" y1="8" x2="12" y2="12.5" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="16" r=".8" fill={c} />
      </>
    ),
    home: (
      <>
        <path d="M3 21V9l9-6 9 6v12" stroke={c} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
        <rect x="9" y="14" width="6" height="7" rx="1" stroke={c} strokeWidth="1.5" fill="none" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="7" r="4" stroke={c} strokeWidth="1.5" fill="none" />
        <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke={c} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.87" stroke={c} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" stroke={c} strokeWidth="1.5" fill="none" />
        <line x1="17" y1="17" x2="22" y2="22" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
    plus: (
      <>
        <line x1="12" y1="5" x2="12" y2="19" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="5" y1="12" x2="19" y2="12" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
    x: (
      <>
        <line x1="18" y1="6" x2="6" y2="18" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="6" y1="6" x2="18" y2="18" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
    upload: (
      <>
        <polyline points="16 16 12 12 8 16" stroke={c} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
        <line x1="12" y1="12" x2="12" y2="21" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" stroke={c} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </>
    ),
    chev: (
      <polyline points="6 9 12 15 18 9" stroke={c} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
    ),
    img: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" stroke={c} strokeWidth="1.5" fill="none" />
        <circle cx="8.5" cy="8.5" r="1.5" fill="none" stroke={c} strokeWidth="1.5" />
        <polyline points="21 15 16 10 5 21" stroke={c} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      </>
    ),
    menu: (
      <>
        <line x1="3" y1="7" x2="21" y2="7" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="3" y1="12" x2="21" y2="12" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="3" y1="17" x2="21" y2="17" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
    pin: (
      <>
        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" stroke={c} strokeWidth="1.5" fill="none" />
        <circle cx="12" cy="10" r="3" stroke={c} strokeWidth="1.5" fill="none" />
      </>
    ),
    wave: (
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke={c} strokeWidth="1.5" fill="none" strokeLinejoin="round" strokeLinecap="round" />
    ),
    logout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke={c} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="16 17 21 12 16 7" stroke={c} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="21" y1="12" x2="9" y2="12" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
  };
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      {paths[n]}
    </svg>
  );
}
