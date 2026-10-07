import test from "node:test";
import assert from "node:assert/strict";
import { registrationDetails, validRegistrationAge } from "../lib/registration-details.ts";

test("registration metadata is informational and does not invent an adult-only gate", () => {
  assert.deepEqual(registrationDetails("  Alumno Ejemplo  ", "16"), { full_name: "Alumno Ejemplo", signup_age: 16 });
  assert.deepEqual(registrationDetails("Alumno Ejemplo", ""), { full_name: "Alumno Ejemplo" });
  assert.deepEqual(Object.keys(registrationDetails("Alumno Ejemplo", "60")).sort(), ["full_name", "signup_age"]);
});
test("registration rejects malformed age values without coercing them to an adult age", () => {
  for (const age of ["-1", "18.5", "1e2", "adult", " ", "9007199254740992"]) {
    assert.equal(validRegistrationAge(age), false);
    assert.throws(() => registrationDetails("Alumno Ejemplo", age));
  }
  assert.throws(() => registrationDetails("A", "18"));
  assert.throws(() => registrationDetails("a".repeat(101), "18"));
});
