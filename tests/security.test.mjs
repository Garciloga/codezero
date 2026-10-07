import test from "node:test";
import assert from "node:assert/strict";
import { isTrustedBrowserRequest } from "../lib/security.ts";

test("same-origin browser POST is trusted", () => {
  const req = new Request("https://codezero.example/api/test", {
    method: "POST",
    headers: { origin: "https://codezero.example" },
  });
  assert.equal(isTrustedBrowserRequest(req), true);
});

test("cross-origin browser POST is rejected", () => {
  const req = new Request("https://codezero.example/api/test", {
    method: "POST",
    headers: { origin: "https://evil.example" },
  });
  assert.equal(isTrustedBrowserRequest(req), false);
});

test("missing Origin is rejected", () => {
  const req = new Request("https://codezero.example/api/test", { method: "POST" });
  assert.equal(isTrustedBrowserRequest(req), false);
});
