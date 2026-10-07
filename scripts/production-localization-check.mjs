// Anonymous public verification only: does not create accounts or send messages/payments.
import assert from 'node:assert/strict';
import {chromium} from '../sandbox-runtime/node_modules/playwright/index.mjs';
const origin=process.env.CODEZERO_PRODUCTION_URL??'https://codezero-nine.vercel.app';
const proxyUrl=process.env.HTTPS_PROXY?new URL(process.env.HTTPS_PROXY):null;
const proxy=proxyUrl?{server:proxyUrl.protocol+'//'+proxyUrl.host,...(proxyUrl.username?{username:decodeURIComponent(proxyUrl.username),password:decodeURIComponent(proxyUrl.password)}:{})}:undefined;
const browser=await chromium.launch({headless:true,executablePath:process.env.CODEZERO_BROWSER_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage'],proxy});
try{
 const context=await browser.newContext({ignoreHTTPSErrors:Boolean(proxy),viewport:{width:390,height:844}}),page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const tags={es:'es-MX',en:'en',pt:'pt-BR',fr:'fr'};
 for(const locale of ['es','en','pt','fr']){
  await page.goto(origin+'/login');await page.locator('#codezero-language').selectOption(locale);await page.waitForFunction(tag=>document.documentElement.lang===tag,tags[locale]);await page.reload();assert.equal(await page.locator('#codezero-language').inputValue(),locale);
  const response=await page.goto(origin+'/pricing');assert.equal(response.status(),200);assert.equal(await page.locator('.public-plans article').count(),3);assert.equal(await page.locator('#codezero-language').inputValue(),locale);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  const navigation=await page.evaluate(()=>{const n=performance.getEntriesByType('navigation')[0];return {ttfbMs:Math.round(n.responseStart-n.requestStart),domReadyMs:Math.round(n.domContentLoadedEventEnd-n.startTime),transferBytes:n.transferSize,encodedDocumentBytes:n.encodedBodySize};});
  console.log(JSON.stringify({locale,path:'/pricing',...navigation}));console.log('PASS real public language persistence, pricing and mobile reflow',locale);
 }
 assert.deepEqual(errors,[]);console.log('PASS no public page runtime errors');await context.close();
}finally{await browser.close();}
