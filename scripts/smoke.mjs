const base = (process.env.BASE_URL || "https://codezero-nine.vercel.app").replace(/\/$/, "");

const checks = [
  ["/", 200],
  ["/pricing", 200],
  ["/login", 200],
  ["/terms", 200],
  ["/privacy", 200],
  ["/refunds", 200],
  ["/contact", 200],
  ["/robots.txt", 200],
  ["/sitemap.xml", 200],
];

let failures = 0;

for (const [path, expected] of checks) {
  try {
    const response = await fetch(base + path, {
      redirect: "manual",
      headers: { "user-agent": "CodeZero-Production-Smoke/1.0" },
    });

    const ok = response.status === expected;
    console.log(`${ok ? "PASS" : "FAIL"} ${path} -> ${response.status}`);
    if (!ok) failures += 1;

    if (path === "/") {
      const requiredHeaders = [
        "x-content-type-options",
        "x-frame-options",
        "referrer-policy",
        "content-security-policy",
      ];
      for (const header of requiredHeaders) {
        const present = Boolean(response.headers.get(header));
        console.log(`${present ? "PASS" : "FAIL"} header ${header}`);
        if (!present) failures += 1;
      }
    }
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${path}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (failures > 0) {
  console.error(`Production smoke test failed with ${failures} issue(s).`);
  process.exit(1);
}

console.log("Production smoke test passed.");
