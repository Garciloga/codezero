import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("Mobile dashboard reads actual progress and routes instead of fabricated metrics",()=>{
  const page=read("app/dashboard/page.tsx");
  assert.match(page,/progress=\{overallProgress\}/);
  assert.match(page,/nextTitle=\{nextLesson\?\.title/);
  assert.match(read("app/components/mobile-learning-home.tsx"),/role="progressbar"/);
});
test("Mobile nav has five real links and accessible active state",()=>{
  const nav=read("app/components/mobile-tabs.tsx");
  assert.match(nav,/\/weekly-cases/);
  assert.match(nav,/\/competencies/);
  assert.match(nav,/\/profile/);
  assert.match(nav,/aria-current=/);
});
test("Android marker is presentation-only; share is guarded by trusted HTTPS origin",()=>{
  const app=read("mobile/android/app/src/main/java/com/garciloga/android/MainActivity.kt");
  assert.match(app,/GarcilogaAndroid\/1\.0\.1/);
  assert.match(app,/if \(isTrustedOrigin\(uri\) && uri\.path == "\/dashboard"/);
  assert.match(app,/Intent\.ACTION_SEND/);
  assert.doesNotMatch(app,/addJavascriptInterface/);
});
test("Mobile CSS preserves nav safe area and keyboard focus",()=>{
  const css=read("app/mobile-experience.css");
  assert.match(css,/env\(safe-area-inset-bottom/);
  assert.match(css,/:focus-visible/);
  assert.match(css,/@media print/);
});
