import test from 'node:test';
import assert from 'node:assert/strict';
import {auditCurriculum, coveredLevels, summarize} from '../scripts/position-curriculum-audit.mjs';

const text = (suffix, correctIndex = 1) => ({
  title: 'Kickoff ' + suffix,
  learningObjective: 'Acordar responsables ' + suffix,
  case: 'El cliente pide iniciar sin responsables confirmados ' + suffix,
  exercise1: {type: 'decision', prompt: '¿Qué haces? ' + suffix, options: ['Agendar ya', 'Acordar responsables', 'Esperar'], correctIndex, feedback: 'Sin responsables no hay criterio de entrada.'},
});
const everyLocale = (suffix, correctIndex) => Object.fromEntries(['es', 'en', 'pt', 'fr'].map(locale => [locale, text(locale + suffix, correctIndex)]));
const question = (key, correctIndex) => ({key, localized: Object.fromEntries(['es', 'en', 'pt', 'fr'].map(locale => [locale, text(locale + key, correctIndex).exercise1]))});
const level = (number, overrides = {}) => ({
  number,
  lessons: [{key: `l${number}-1`, localized: everyLocale('a' + number, 1)}, {key: `l${number}-2`, localized: everyLocale('b' + number, 2)}],
  assessment: {questions: [0, 1, 2, 0, 1].map((index, i) => question(`l${number}-q${i}`, index))},
  ...overrides,
});
const rules = findings => findings.map(finding => finding.rule);

test('a complete level produces no findings', () => {
  assert.deepEqual(auditCurriculum({levels: [level(1)]}), []);
});

test('scaffold signs are reported and the publishing blockers are marked', () => {
  const draft = level(6, {assessment: {questions: []}});
  draft.lessons[0].localized.en.case = 'Onboarding — ' + draft.lessons[0].localized.en.title;
  delete draft.lessons[1].localized.fr;
  const findings = auditCurriculum({levels: [draft]});
  assert.deepEqual(new Set(rules(findings)), new Set(['placeholder-case', 'missing-locale', 'no-exam']));
  assert.ok(findings.every(finding => finding.blocking));
  const uneven = level(7);
  uneven.lessons[0].localized.pt.exercise1.options.push('Otra opción');
  assert.deepEqual(rules(auditCurriculum({levels: [uneven]})), ['option-count-mismatch']);
});

test('quality signs that do not block are still listed', () => {
  const draft = level(2);
  for (const lesson of draft.lessons) for (const locale of Object.values(lesson.localized)) {
    locale.exercise1 = {options: ['Correcta', 'Otra'], correctIndex: 0, feedback: 'Correcta'};
    locale.case = 'El mismo caso se repite en todas las lecciones del nivel';
  }
  for (const item of draft.assessment.questions) for (const locale of Object.values(item.localized)) locale.correctIndex = 0;
  const found = new Set(rules(auditCurriculum({levels: [draft]})));
  for (const rule of ['few-options', 'feedback-repeats-answer', 'repeated-case', 'answer-position-bias', 'untranslated']) assert.ok(found.has(rule), rule);
});

test('single-level files and summaries are supported', () => {
  const single = {...level(3), level: 3};
  delete single.number;
  assert.deepEqual(coveredLevels([single, {levels: [level(1)]}]), [1, 3]);
  const summary = summarize(auditCurriculum({levels: [level(4, {assessment: {questions: [question('q', 0)]}})]}));
  assert.deepEqual(summary.map(item => [item.rule, item.count, item.blocking]), [['short-exam', 1, true]]);
});
