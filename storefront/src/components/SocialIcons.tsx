interface Props {
  size?: number;
}

/**
 * lucide-react removed brand/logo icons (Facebook, Instagram, etc.) in
 * recent versions, so these are small hand-rolled SVGs instead of a
 * dependency on a package that keeps dropping exactly the icons a
 * storefront footer needs.
 */
export const FacebookIcon = ({ size = 16 }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5H16.7V3.6c-.3-.04-1.3-.13-2.4-.13-2.4 0-4 1.46-4 4.15V10H7.6v3.1h2.7V21h3.2z" />
  </svg>
);

export const InstagramIcon = ({ size = 16 }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const TwitterIcon = ({ size = 16 }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.9 3H21l-6.6 7.55L22.3 21h-6.1l-4.8-6.2L5.9 21H3.8l7.1-8.1L2.7 3h6.2l4.3 5.7L18.9 3zm-1.1 16.2h1.2L7.3 4.7H6l11.8 14.5z" />
  </svg>
);

export const YoutubeIcon = ({ size = 16 }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M21.6 7.2s-.2-1.5-.85-2.15c-.8-.85-1.7-.85-2.1-.9C15.9 4 12 4 12 4h0s-3.9 0-6.65.15c-.4.05-1.3.05-2.1.9C2.6 5.7 2.4 7.2 2.4 7.2S2.2 9 2.2 10.75v1.5C2.2 14 2.4 15.8 2.4 15.8s.2 1.5.85 2.15c.8.85 1.85.82 2.3.9 1.7.16 7.1.2 7.45.2 0 0 3.9 0 6.65-.16.4-.05 1.3-.05 2.1-.9.65-.65.85-2.15.85-2.15s.2-1.8.2-3.55v-1.5c0-1.75-.2-3.55-.2-3.55zM9.95 14.5v-5.3l5.1 2.66z" />
  </svg>
);

export const LinkedinIcon = ({ size = 16 }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M6.94 8.5H3.56V20h3.38V8.5zM5.25 3.5a1.97 1.97 0 100 3.94 1.97 1.97 0 000-3.94zM20.45 20h-3.37v-5.6c0-1.34-.03-3.06-1.87-3.06-1.87 0-2.16 1.46-2.16 2.96V20H9.68V8.5h3.24v1.57h.05c.45-.86 1.56-1.76 3.2-1.76 3.42 0 4.05 2.25 4.05 5.18V20z" />
  </svg>
);

export const TiktokIcon = ({ size = 16 }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.6 3c.4 2.1 1.9 3.6 4 3.85v2.9a6.9 6.9 0 01-4-1.28v6.2a5.73 5.73 0 11-5.73-5.73c.16 0 .32 0 .48.02v2.98a2.8 2.8 0 102.5 2.78V3h2.75z" />
  </svg>
);

export function socialIcon(platform: string) {
  const key = platform.trim().toLowerCase();
  if (key.includes("facebook")) return FacebookIcon;
  if (key.includes("instagram")) return InstagramIcon;
  if (key.includes("twitter") || key === "x") return TwitterIcon;
  if (key.includes("youtube")) return YoutubeIcon;
  if (key.includes("linkedin")) return LinkedinIcon;
  if (key.includes("tiktok")) return TiktokIcon;
  return null;
}
