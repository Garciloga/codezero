export function validRegistrationAge(age: string) {
  return age === "" || (/^\d+$/.test(age) && Number.isSafeInteger(Number(age)));
}

// Informational account metadata only: never use these fields for authorization.
// The existing profile trigger does not copy full_name; profile editing remains separate.
export function registrationDetails(fullName: string, age: string) {
  const name = fullName.trim();
  if (name.length < 2 || name.length > 100 || !validRegistrationAge(age)) throw new Error("Invalid registration details");
  return { full_name: name, ...(age === "" ? {} : { signup_age: Number(age) }) };
}
