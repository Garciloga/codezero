import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "object-src 'none'",
      "form-action 'self'"
    ].join("; ")
  }
];

const nextConfig: NextConfig = {
  async headers() {
    const privateHeaders = [
      { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
    ];

    return [
      { source: "/admin/:path*", headers: privateHeaders },
      { source: "/dashboard/:path*", headers: privateHeaders },
      { source: "/learn/:path*", headers: privateHeaders },
      { source: "/profile/:path*", headers: privateHeaders },
      { source: "/checkout/:path*", headers: privateHeaders },
      { source: "/tutor/:path*", headers: privateHeaders },
      { source: "/certificate/:path*", headers: privateHeaders },
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
