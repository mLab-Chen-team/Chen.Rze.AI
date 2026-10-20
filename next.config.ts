import path from "node:path";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/* CSP dla strony publicznej. 'unsafe-inline' w script-src jest potrzebne,
   bo Next wstrzykuje skrypty inline (bez nonce); w dev dochodzi 'unsafe-eval'
   dla odświeżania na gorąco. YouTube (VideoDock) i obrazki z CDN Sanity
   są wpisane wprost. */
const siteCsp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://cdn.sanity.io https://i.ytimg.com",
  "font-src 'self' data:",
  "connect-src 'self'" + (isDev ? " ws: wss:" : ""),
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const baseHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,

  experimental: {
    globalNotFound: true,
  },

  turbopack: {
    root: path.resolve(import.meta.dirname),
  },

  redirects() {
    return [
      { source: "/panel", destination: "/studio", permanent: false },
      {
        source: "/panel/:path*",
        destination: "/studio/:path*",
        permanent: false,
      },
    ];
  },

  /* Sanity Studio (/studio) ładuje własne zasoby i osadza podglądy, więc
     dostaje tylko nagłówki bazowe, bez CSP i bez zakazu ramek strony. */
  headers() {
    return [
      {
        source: "/((?!studio).*)",
        headers: [
          ...baseHeaders,
          { key: "Content-Security-Policy", value: siteCsp },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
      { source: "/studio/:path*", headers: baseHeaders },
    ];
  },
};

export default nextConfig;
