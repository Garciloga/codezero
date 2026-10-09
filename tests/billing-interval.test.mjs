import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const compiled = ts.transpileModule(fs.readFileSync('lib/billing-interval.ts', 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText;
const loaded = {exports: {}};
new Function('module', 'exports', compiled)(loaded, loaded.exports);
const {parseBillingInterval, basePriceId, annualBillingConfigured, basePriceToPlan} = loaded.exports;

const monthly = {STRIPE_STARTER_PRICE_ID: 'price_s_m', STRIPE_PRO_PRICE_ID: 'price_p_m', STRIPE_ENTERPRISE_PRICE_ID: 'price_e'};
const annual = {...monthly, STRIPE_STARTER_ANNUAL_PRICE_ID: 'price_s_y', STRIPE_PRO_ANNUAL_PRICE_ID: 'price_p_y'};

test('a missing interval means monthly and anything unknown is rejected', () => {
  for (const value of [undefined, null, '', 'month']) assert.equal(parseBillingInterval(value), 'month');
  assert.equal(parseBillingInterval('year'), 'year');
  for (const value of ['annual', 'YEAR', 12, {}, ['year']]) assert.equal(parseBillingInterval(value), null);
});

test('annual stays dormant until both annual prices exist', () => {
  assert.equal(annualBillingConfigured(monthly), false);
  assert.equal(annualBillingConfigured({...monthly, STRIPE_STARTER_ANNUAL_PRICE_ID: 'price_s_y'}), false);
  assert.equal(annualBillingConfigured({...annual, STRIPE_PRO_ANNUAL_PRICE_ID: '  '}), false);
  assert.equal(annualBillingConfigured(annual), true);
  assert.equal(basePriceId('starter', 'year', monthly), null);
  assert.equal(basePriceId('pro', 'year', annual), 'price_p_y');
  assert.equal(basePriceId('starter', 'month', annual), 'price_s_m');
});

test('webhook map resolves monthly and annual prices to the same plan and skips unset ones', () => {
  assert.deepEqual(basePriceToPlan(annual), {price_s_m: 'starter', price_s_y: 'starter', price_p_m: 'pro', price_p_y: 'pro', price_e: 'enterprise'});
  assert.deepEqual(basePriceToPlan({STRIPE_PRO_PRICE_ID: 'price_p_m'}), {price_p_m: 'pro'});
  assert.equal(Object.hasOwn(basePriceToPlan({}), ''), false);
});
