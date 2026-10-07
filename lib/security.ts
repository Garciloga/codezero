export function isTrustedBrowserRequest(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return false;

  const allowed = new Set<string>();
  try {
    allowed.add(new URL(req.url).origin);
  } catch {}

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      allowed.add(new URL(appUrl).origin);
    } catch {}
  }

  const forwardedHost = req.headers.get("x-forwarded-host");
  const forwardedProto = req.headers.get("x-forwarded-proto") ?? "https";
  if (forwardedHost) {
    allowed.add(`${forwardedProto}://${forwardedHost}`);
  }

  return allowed.has(origin);
}
