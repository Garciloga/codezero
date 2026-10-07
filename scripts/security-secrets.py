"""Fail on potential secrets without printing secret values or calling providers."""
import json
import subprocess
import sys

command = [
    "detect-secrets", "scan", "--all-files", "--no-verify",
    "--exclude-files", r"(^|/)(node_modules|\.next|\.git|\.venv|venv)(/|$)|(^|/)sandbox-runtime/dist(/|$)|(^|/)package-lock\.json$|\.tsbuildinfo$",
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
count = 0
for filename, findings in sorted(results.items()):
    for finding in findings:
        count += 1
        print(f"Potential secret: {filename}:{finding['line_number']} ({finding['type']})")
print(f"Secret scan completed: {count} potential secrets; values are never displayed.")
sys.exit(1 if count else 0)
