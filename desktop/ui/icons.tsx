import React from 'react';

const paths: Record<string, React.ReactNode> = {
  plus: <path d="M12 5v14M5 12h14" />,
  mic: <path d="M12 3a3 3 0 013 3v6a3 3 0 01-6 0V6a3 3 0 013-3zM6 11a6 6 0 0012 0M12 19v2" />,
  upload: <path d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" />,
  play: <path d="M7 5l12 7-12 7V5z" />,
  folder: <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />,
  trash: <path d="M4 7h16M10 11v6m4-6v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4h6v3" />,
  copy: <path d="M9 9h10v10H9zM5 15V5h10" />,
  download: <path d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />,
  back: <path d="M15 5l-7 7 7 7" />,
  film: <path d="M4 4h16v16H4zM8 4v16M16 4v16M4 8h4M4 12h4M4 16h4M16 8h4M16 12h4M16 16h4" />,
  book: <path d="M5 4h10a4 4 0 014 4v12H9a4 4 0 01-4-4V4zM5 16a4 4 0 014-4h10" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  search: <path d="M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4" />,
  more: <path d="M5 12h.01M12 12h.01M19 12h.01" />,
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />,
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" />,
  check: <path d="M5 12l5 5L20 7" />,
  alert: <path d="M12 8v5m0 3h.01M10.3 3.9L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />,
  palette: <path d="M12 21a9 9 0 110-18c4.97 0 9 3.58 9 8a5 5 0 01-5 5h-1.8a1.7 1.7 0 00-1.2 2.9A1.2 1.2 0 0112 21zM7.5 11.5h.01M10 7.5h.01M14.5 7.5h.01M17 11h.01" />,
  star: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5z" />,
  image: <path d="M4 5h16v14H4zM4 16l5-5 4 4 2-2 5 5M15.5 9.5h.01" />,
  refresh: <path d="M20 11a8 8 0 10-2.3 5.7M20 5v6h-6" />,
  save: <path d="M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6" />,
};

export const Icon: React.FC<{ name: keyof typeof paths | string; size?: number; className?: string }> = ({ name, size = 18, className }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {paths[name]}
  </svg>
);

export const LogoMark: React.FC<{ size?: number; color?: string; dot?: string }> = ({ size = 28, color = '#fff', dot = '#00D26A' }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
    <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="11" />
    <circle cx="36" cy="31" r="7.5" fill={color} />
    <circle cx="36" cy="50" r="7.5" fill={dot} />
    <circle cx="36" cy="69" r="7.5" fill={color} />
  </svg>
);
