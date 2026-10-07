"""Real Auth/PostgREST checks against the approved synthetic cloud fixture only.

Requires CODEZERO_SANDBOX_API_KEY_FILE and CODEZERO_SANDBOX_PASSWORD_FILE.
The password file contains {"password": "..."}; neither file belongs in git.
Never prints passwords, keys, session tokens or response bodies.
"""
import concurrent.futures
import json
import os
from pathlib import Path
import urllib.error
import urllib.request

ROOT = "https://sdvwkrosdnlacyhnuxwo.supabase.co"
KEY = Path(os.environ["CODEZERO_SANDBOX_API_KEY_FILE"]).read_text().strip()
PASSWORD = json.loads(Path(os.environ["CODEZERO_SANDBOX_PASSWORD_FILE"]).read_text())["password"]

def uid(n):
    return f"10000000-0000-4000-8000-{n:012}"

def email(n):
    return {1: "owner@codezero.example.test", 2: "learner@codezero.example.test"}.get(n, f"persona{n}@codezero.example.test")

def request(path, token=None, method="GET", body=None, preference=None):
    headers = {"apikey": KEY, "Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    if preference:
        headers["Prefer"] = preference
    req = urllib.request.Request(ROOT + path, data=None if body is None else json.dumps(body).encode(), headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            raw = response.read()
            return response.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as error:
        return error.code, json.loads(error.read())

def login(n):
    status, data = request("/auth/v1/token?grant_type=password", method="POST", body={"email": email(n), "password": PASSWORD})
    assert status == 200, f"Password login failed for synthetic account {n}: HTTP {status}"
    assert data["user"]["id"] == uid(n)
    return n, data["access_token"]

with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    TOKENS = dict(pool.map(login, range(1, 9)))
print("PASS real password login: 8 synthetic accounts", flush=True)
checks = 1

def check(name, condition):
    global checks
    assert condition, name
    checks += 1
    print("PASS", name, flush=True)

def api(n, path, method="GET", body=None, preference=None):
    return request("/rest/v1/" + path, TOKENS[n], method, body, preference)

def visibility(n):
    status, rows = api(n, "organization_memberships?select=user_id&order=user_id")
    assert status == 200
    return n, [r["user_id"] for r in rows]

with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    visible = dict(pool.map(visibility, range(1, 9)))
for n, expected in [(1,[1,2,3,4,5]), (2,[2,3,4]), (3,[3,4]), (4,[4]), (5,[5]), (6,[6]), (7,[]), (8,[])]:
    check(f"organization isolation and role visibility account {n}", visible[n] == [uid(i) for i in expected])

status, user = request("/auth/v1/user", TOKENS[2])
check("server-verified Auth user", status == 200 and user["id"] == uid(2))
status, rows = api(2, "profiles?select=id")
check("profile RLS returns self only", status == 200 and [r["id"] for r in rows] == [uid(2)])
status, rows = api(2, "exercise_attempts?select=user_id,is_correct")
check("own exercise outcome readable", status == 200 and len(rows) == 1 and rows[0]["user_id"] == uid(2))
status, rows = api(4, "exercise_attempts?select=user_id")
check("other learner cannot read outcome", status == 200 and rows == [])

status, _ = api(2, "user_preferences", "POST", {"user_id":uid(2), "mode":"dark", "accent":"green"}, "resolution=merge-duplicates")
check("own appearance saved", status in (200,201,204))
status, rows = api(4, "user_preferences?select=user_id")
check("appearance invisible across accounts", status == 200 and rows == [])
status, _ = api(4, "user_preferences", "POST", {"user_id":uid(2), "mode":"light", "accent":"blue"}, "resolution=merge-duplicates")
check("cross-user appearance write rejected", status in (401,403))

snapshot = {"version":"samples-v1","role":"technical_cs","passed":["handoff"],"startDay":"2026-10-07","onboarding":[0],"pulse":"Prueba sintética"}
status, rows = api(2, "private_practice_progress?select=revision")
assert status == 200
revision = rows[0]["revision"] if rows else 0
status, new_revision = api(2, "rpc/save_private_practice_progress", "POST", {"p_progress":snapshot,"p_revision":revision})
check("private progress saved with real session", status == 200 and new_revision == revision+1)
status, _ = api(2, "rpc/save_private_practice_progress", "POST", {"p_progress":snapshot,"p_revision":revision})
check("stale progress rejected without transaction retries", status == 409)
status, rows = api(4, "private_practice_progress?select=user_id")
check("private progress isolated", status == 200 and rows == [])

status, catalog = api(2, "addons?select=key,status")
check("19 coming-soon modules readable", status == 200 and len(catalog)==19 and all(r["status"]=="coming_soon" for r in catalog))
status, _ = api(2, "addon_waitlist", "POST", {"user_id":uid(2),"addon_key":"route_operations"}, "resolution=ignore-duplicates")
check("own waitlist interest saved", status in (200,201,204))
status, rows = api(4, "addon_waitlist?select=user_id")
check("waitlist interest isolated", status == 200 and rows == [])
status, _ = api(4, "addon_waitlist", "POST", {"user_id":uid(2),"addon_key":"route_qa"})
check("cross-user waitlist rejected", status in (401,403))
status, _ = api(2, "addon_waitlist", "POST", {"user_id":uid(2),"addon_key":"nonexistent_addon"})
check("unknown add-on rejected", status in (400,401,403,409))
status, _ = api(2, "addon_waitlist?addon_key=eq.route_operations", "DELETE")
check("own waitlist withdrawal works", status in (200,204))
status, _ = api(4, "organization_memberships?user_id=eq."+uid(4), "PATCH", {"role":"owner"})
check("client self-promotion rejected", status in (401,403))
status, _ = api(4, "rpc/create_workspace_organization", "POST", {"p_actor":uid(4),"p_name":"Forbidden"})
check("server-only organization RPC denied to client", status in (401,403,404))
status, _ = api(4, "rpc/issue_workspace_diploma", "POST", {"p_user":uid(4),"p_level":1})
check("client diploma forgery rejected", status in (401,403,404))
print(f"Cloud checks passed: {checks}; no provider or Stripe calls", flush=True)
