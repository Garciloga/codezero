import type { NextConfig } from "next";
import { codeRuntimeConfiguration } from "./lib/code-runtime-policy";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
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
    const codeRuntime = codeRuntimeConfiguration(process.env);
    const privateHeaders = [
      { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
      { key: "Cache-Control", value: "private, no-store, max-age=0" },
    ];

    const privateApiHeaders = [
      { key: "Cache-Control", value: "private, no-store, max-age=0" },
      { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
    ];

    return [
      { source: "/admin/:path*", headers: privateHeaders },
      { source: "/dashboard/:path*", headers: privateHeaders },
      { source: "/learn/:path*", headers: privateHeaders },
      { source: "/profile/:path*", headers: privateHeaders },
      ...["practice", "modules", "teams", "diplomas", "role-training", "community", "mentoring"].map(path => ({ source: `/${path}/:path*`, headers: privateHeaders })),
      { source: "/checkout/:path*", headers: privateHeaders },
      { source: "/tutor/:path*", headers: privateHeaders },
      { source: "/certificate/:path*", headers: privateHeaders },
      { source: "/verify/:path*", headers: privateHeaders },
      { source: "/login", headers: privateHeaders },
      { source: "/reset-password", headers: privateHeaders },
      { source: "/api/:path*", headers: privateApiHeaders },
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      ...(codeRuntime ? ["/practice-preview", "/practice"].map(source => ({ source, headers: [{ key: "Content-Security-Policy",
        value: securityHeaders.find(header => header.key === "Content-Security-Policy")!.value + `; frame-src 'self' ${codeRuntime.runtimeOrigin}` }] })) : []),
    ];
  },
};

export default nextConfig;

