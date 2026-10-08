"""Fail on potential secrets without printing secret values or calling providers."""
import json
import subprocess
import sys
from pathlib import Path

command = [
    "detect-secrets", "scan", "--all-files", "--no-verify",
    "--exclude-files", r"(^|/)(node_modules|\.next|\.git|\.venv|venv)(/|$)|(^|/)sandbox-runtime/dist(/|$)|(^|/)package-lock\.json$|\.tsbuildinfo$|^scripts/localization-secret-allowlist\.json$",
    "--exclude-secrets", r"^(sb_(publishable|secret)_ci_placeholder|validation-placeholder)$",
    ".",
]
scan = subprocess.run(command, capture_output=True, text=True)
if scan.returncode:
    print("Secret scanner failed; review the scanner configuration.", file=sys.stderr)
    sys.exit(2)
try:
    results = json.loads(scan.stdout)["results"]
except (ValueError, KeyError):
    print("Invalid secret scanner report.", file=sys.stderr)
    sys.exit(2)
# Reviewed literal password labels, curriculum headings and one synthetic fixture
# credential placeholder only. Exact hashes,
# file and detector type; changed text or any other finding remains a failure.
allowlist = json.loads((Path(__file__).parent / "localization-secret-allowlist.json").read_text())
count = 0
for filename, findings in sorted(results.items()):
    for finding in findings:
        if {"type": finding["type"], "hashed_secret": finding["hashed_secret"]} in allowlist.get(filename, []):
            continue
        count += 1
        print(f"Potential secret: {filename}:{finding['line_number']} ({finding['type']})")
print(f"Secret scan completed: {count} potential secrets; values are never displayed.")
sys.exit(1 if count else 0)

