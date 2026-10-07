export function GET() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://codezero-nine.vercel.app";

  const body = [
    "Contact: mailto:codescerooficial@gmail.com",
    `Canonical: ${base}/.well-known/security.txt`,
    "Preferred-Languages: es, en",
    "Expires: 2027-10-01T00:00:00.000Z",
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
