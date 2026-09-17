import type { SVGProps } from "react";

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
    ideas: <><path d="M9 18h6"/><path d="M10 22h4"/><path d="M8.5 14.5A6.5 6.5 0 1 1 17 8.3c0 2.1-1 3.6-2.4 4.9-.5.5-.8.8-.9 1.3H10.3c-.1-.5-.4-.9-.9-1.3A6.4 6.4 0 0 1 8.5 14.5Z"/></>,
    projects: <><path d="M3 7h6l2 2h10v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M3 7V5a2 2 0 0 1 2-2h4l2 2h4"/></>,
    tasks: <><path d="M9 6h11M9 12h11M9 18h11"/><path d="m3 6 1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17"/></>,
    team: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/></>,
    game: <><path d="M7 8h10a5 5 0 0 1 4.7 6.7l-1.1 3.1a2 2 0 0 1-3.2.8L15 17H9l-2.4 1.6a2 2 0 0 1-3.2-.8l-1.1-3.1A5 5 0 0 1 7 8Z"/><path d="M7 12v4M5 14h4M16 13h.01M19 15h.01"/></>,
    code: <path d="m8 9-3 3 3 3M16 9l3 3-3 3M14 5l-4 14"/>,
    globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></>,
    phone: <><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 5h4M11 18h2"/></>,
    upgrade: <><path d="M12 19V5M6 11l6-6 6 6"/><path d="M5 21h14"/></>,
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></>,
    trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v5M14 11v5"/></>,
    convert: <><path d="M20 7h-9a4 4 0 0 0-4 4v9"/><path d="m16 3 4 4-4 4M4 17l3 3 3-3"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    reject: <path d="m7 7 10 10M17 7 7 17"/>,
    vote: <><path d="M4 4h16v12H5.5L4 18Z"/><path d="M8 8h8M8 12h5"/></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}
