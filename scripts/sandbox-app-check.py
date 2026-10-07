"""Checks the real Next.js API with a hosted sandbox Auth session.
Uses the same external credential files as sandbox-cloud-check.py.
Starts a local server; does not deploy, call AI, or use a service-role key.
"""
import base64
import json
import os
from pathlib import Path
import subprocess
import time
import urllib.error
import urllib.request

REF = "sdvwkrosdnlacyhnuxwo"
URL = "https://" + REF + ".supabase.co"
APP = "http://127.0.0.1:3107"
KEY = Path(os.environ["CODEZERO_SANDBOX_API_KEY_FILE"]).read_text().strip()
PASSWORD = json.loads(Path(os.environ["CODEZERO_SANDBOX_PASSWORD_FILE"]).read_text())["password"]
req = urllib.request.Request(URL + "/auth/v1/token?grant_type=password", data=json.dumps({"email":"learner@codezero.example.test","password":PASSWORD}).encode(), headers={"apikey":KEY,"Content-Type":"application/json"})
with urllib.request.urlopen(req,timeout=60) as response:
    session = json.load(response)
cookie = "sb-" + REF + "-auth-token=base64-" + base64.urlsafe_b64encode(json.dumps(session,separators=(",",":")).encode()).decode().rstrip("=")
env = os.environ.copy()
env.update({"NODE_USE_ENV_PROXY":"1","NEXT_TELEMETRY_DISABLED":"1","NEXT_PUBLIC_SUPABASE_URL":URL,"NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY":KEY,"NEXT_PUBLIC_APP_URL":APP,"CODEZERO_WORKSPACE_SANDBOX":"1","CODEZERO_ENVIRONMENT":"sandbox","CODEZERO_SANDBOX_PROJECT_REF":REF,"CODEZERO_TUTOR_PREVIEW":"1","CODEZERO_PRACTICE_PREVIEW":"1","CODEZERO_MODULAR_PREVIEW":"1"})
env.pop("SUPABASE_SECRET_KEY",None)
env.pop("OPENAI_API_KEY",None)
opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))

def call(path,body,authenticated=True,origin=APP):
    headers={"Content-Type":"application/json","Origin":origin}
    if authenticated:headers["Cookie"]=cookie
    request=urllib.request.Request(APP+path,data=json.dumps(body).encode(),headers=headers)
    try:
        with opener.open(request,timeout=90) as response:return response.status,json.load(response)
    except urllib.error.HTTPError as error:return error.code,json.loads(error.read())

checks=0
def check(name,condition):
    global checks
    assert condition,name
    checks+=1
    print("PASS",name,flush=True)

with open(os.environ.get("CODEZERO_SANDBOX_APP_LOG","/tmp/codezero-sandbox-next-validation.log"),"w") as log:
    process=subprocess.Popen(["node","node_modules/next/dist/bin/next","dev","--hostname","127.0.0.1","--port","3107"],env=env,stdout=log,stderr=log)
    try:
        ready=False
        for _ in range(30):
            if process.poll() is not None:raise RuntimeError("Local test server exited")
            try:opener.open(APP+"/api/tutor-preview",timeout=2)
            except urllib.error.HTTPError:ready=True;break
            except urllib.error.URLError:time.sleep(1)
        assert ready,"Server did not start"
        status,body=call("/api/tutor-preview",{"lessonId":1,"question":"¿Por qué falla HTTP 403?"})
        check("Tutor loads own lesson and incorrect outcome from real Auth/RLS",status==200 and body["mode"]=="preparation_only" and body["context"]["recentPractice"]["attempts"]==1 and body["context"]["recentPractice"]["toReinforce"]==1)
        status,_=call("/api/tutor-preview",{"lessonId":1,"question":"Pregunta","userId":"other"})
        check("Tutor rejects supplied identity",status==400)
        status,_=call("/api/tutor-preview",{"lessonId":1,"question":"Pregunta"},False)
        check("Tutor requires real Auth session",status==401)
        status,_=call("/api/tutor-preview",{"lessonId":1,"question":"Pregunta"},origin="https://untrusted.example.test")
        check("Tutor rejects foreign origin",status==403)
        status,body=call("/api/addon-waitlist",{"key":"route_operations","interested":True})
        check("Next.js saves own waitlist using real session",status==200 and body["interested"] is True)
        status,body=call("/api/addon-waitlist",{"key":"route_operations","interested":False})
        check("Next.js withdraws own waitlist using real session",status==200 and body["interested"] is False)
        req=urllib.request.Request(URL+"/rest/v1/private_practice_progress?select=revision",headers={"apikey":KEY,"Authorization":"Bearer "+session["access_token"]})
        with urllib.request.urlopen(req,timeout=60) as response:rows=json.load(response)
        revision=rows[0]["revision"] if rows else 0
        progress={"version":"samples-v1","role":"technical_cs","passed":["handoff"],"startDay":"2026-10-07","onboarding":[0],"pulse":"Prueba sintética"}
        status,body=call("/api/practice-progress",{"progress":progress,"revision":revision})
        check("Next.js saves real private progress",status==200 and body["revision"]==revision+1)
        status,body=call("/api/practice-progress",{"progress":progress,"revision":revision})
        check("Next.js returns conflict without transaction retries",status==409 and "Recarga" in body["error"])
        print(f"Application checks passed: {checks}; no service key or provider calls",flush=True)
    finally:
        process.terminate()
        process.wait(timeout=10)
