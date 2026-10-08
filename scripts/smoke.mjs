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
  ["/api/health", 200],
  ["/.well-known/security.txt", 200],
];

let failures = 0;

for (const [path, expected] of checks) {
  try {
    const response = await fetch(base + path, {
      redirect: "manual",
      signal: AbortSignal.timeout(15000),
      headers: { "user-agent": "CodeZero-Production-Smoke/1.0" },
    });

    const ok = response.status === expected;
    console.log(`${ok ? "PASS" : "FAIL"} ${path} -> ${response.status}`);
    if (!ok) failures += 1;

    if (path === "/api/health" && response.ok) {
      const health = await response.json();
      const healthy = health?.ok === true && health?.database === true;
      console.log(`${healthy ? "PASS" : "FAIL"} health database`);
      if (!healthy) failures += 1;
    }

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

const protectedChecks = [
  "/dashboard",
  "/profile",
  "/admin",
  "/learn/1",
  "/customer-success",
  "/certificates",
  "/employment-kit",
  "/community",
  "/mentoring",
  "/admin/social",
];

for (const path of protectedChecks) {
  try {
    const response = await fetch(base + path, {
      redirect: "manual",
      signal: AbortSignal.timeout(15000),
      headers: { "user-agent": "CodeZero-Production-Smoke/1.0" },
    });
    const location = response.headers.get("location");
    const target = location ? new URL(location, base) : null;
    const protectedRoute = [302, 303, 307, 308].includes(response.status)
      && target?.origin === new URL(base).origin && target.pathname === "/login";
    console.log(`${protectedRoute ? "PASS" : "FAIL"} protected ${path} -> ${response.status}`);
    if (!protectedRoute) failures += 1;
  } catch (error) {
    failures += 1;
    console.error(`FAIL protected ${path}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const csrfChecks = [
  ["/api/locale", { locale: "en" }],
  ["/api/stripe/checkout", { plan: "starter", paymentAuthorization: true }],
  ["/api/exercises/submit", null],
  ["/api/internal/career-lab", null],
  ["/api/customer-success", null],
  ["/api/customer-success/review", null],
  ["/api/community", null],
  ["/api/mentoring", null],
];

for (const [path, body] of csrfChecks) {
  try {
    const response = await fetch(base + path, {
      method: "POST",
      redirect: "manual",
      signal: AbortSignal.timeout(15000),
      headers: {
        "user-agent": "CodeZero-Production-Smoke/1.0",
        "origin": "https://example.invalid",
        ...(body ? { "content-type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const blocked = response.status === 403;
    console.log(`${blocked ? "PASS" : "FAIL"} cross-origin POST ${path} -> ${response.status}`);
    if (!blocked) failures += 1;
  } catch (error) {
    failures += 1;
    console.error(`FAIL csrf ${path}: ${error instanceof Error ? error.message : String(error)}`);
  }
}


// Check pages through normal HTTP requests above. Next.js owns the RSC
// router state; synthetic RSC headers can trigger production runtime errors.
for (const [path, options, expected] of [
  ["/internal/career-lab", {}, 404],
  ["/api/internal/career-lab", {
    method: "POST",
    headers: { origin: new URL(base).origin, "content-type": "application/json" },
    body: "{}",
  }, 404],
]) {
  try {
    const response = await fetch(base + path, {
      ...options, redirect: "manual", signal: AbortSignal.timeout(15000),
    });
    const ok = response.status === expected;
    console.log(`${ok ? "PASS" : "FAIL"} owner-only ${path} -> ${response.status}`);
    if (!ok) failures += 1;
  } catch (error) {
    failures += 1;
    console.error(`FAIL owner-only ${path}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

for (const [locale, lang, signIn] of [
  ["es", "es-MX", "Iniciar sesión"], ["en", "en", "Sign in"],
  ["pt", "pt-BR", "Entrar"], ["fr", "fr", "Se connecter"],
]) {
  try {
    const saved = await fetch(base + "/api/locale", {
      method: "POST", headers: { origin: new URL(base).origin, "content-type": "application/json" },
      body: JSON.stringify({ locale }), signal: AbortSignal.timeout(15000),
    });
    const cookie = saved.headers.get("set-cookie") ?? "";
    const persisted = saved.ok && cookie.includes(`codezero_locale=${locale}`) && /HttpOnly/i.test(cookie) && /SameSite=Lax/i.test(cookie);
    const response = await fetch(base + "/login", {
      headers: { cookie: `codezero_locale=${locale}` }, signal: AbortSignal.timeout(15000),
    });
    const html = await response.text();
    const ok = persisted && response.ok && html.includes(`<html lang="${lang}"`) && html.includes(signIn);
    console.log(`${ok ? "PASS" : "FAIL"} locale ${locale}: cookie and translated login`);
    if (!ok) failures += 1;
  } catch (error) {
    failures += 1;
    console.error(`FAIL locale ${locale}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (failures > 0) {
  console.error(`Production smoke test failed with ${failures} issue(s).`);
  process.exit(1);
}

console.log("Production smoke test passed.");



