#!/usr/bin/env node
/**
 * Editorial gate for position curriculum drafts (docs/position-curricula/*.json).
 *
 * It does not judge whether the content is good; it finds the mechanical signs
 * that a draft is still a scaffold, so a person reviews real content instead of
 * placeholders:
 *
 *   node scripts/position-curriculum-audit.mjs docs/position-curricula/*.json
 *   node scripts/position-curriculum-audit.mjs --strict file.json   # exit 1 on blocking findings
 *   node scripts/position-curriculum-audit.mjs --json file.json     # machine-readable
 *
 * Accepted shapes: a file with `levels: [...]`, or a file that is one level
 * (`lessons` + `assessment`). Level number comes from `number` or `level`.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const LOCALES = ['es', 'en', 'pt', 'fr'];
export const MIN_EXAM_QUESTIONS = 5;
export const MIN_OPTIONS = 3;
export const EXPECTED_LEVELS = 15;

/** Findings that must be fixed before a level can be published. */
export const BLOCKING = new Set([
  'missing-locale', 'empty-text', 'placeholder-case', 'duplicate-lesson-key',
  'no-exam', 'short-exam', 'option-count-mismatch', 'invalid-correct-index', 'duplicate-lesson-title',
]);

const normalize = text => String(text ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

function levelsOf(document) {
  if (Array.isArray(document.levels)) return document.levels;
  if (Array.isArray(document.lessons)) return [document];
  return [];
}

function decisionsOf(lessonLocale) {
  return Object.values(lessonLocale ?? {}).filter(value => value && typeof value === 'object' && Array.isArray(value.options));
}

/** Audit one parsed document. Returns a flat list of findings. */
export function auditCurriculum(document, source = 'input') {
  const findings = [];
  const add = (rule, where, detail) => findings.push({rule, source, where, detail, blocking: BLOCKING.has(rule)});
  const lessonKeys = new Map();
  const lessonTitles = new Map();
  const caseUses = new Map();
  const correctPositions = [];

  for (const level of levelsOf(document)) {
    const number = level.number ?? level.level ?? '?';
    const at = `nivel ${number}`;

    for (const lesson of level.lessons ?? []) {
      const here = `${at} · ${lesson.key ?? 'lección sin clave'}`;
      if (lesson.key) {
        if (lessonKeys.has(lesson.key)) add('duplicate-lesson-key', here, `también en ${lessonKeys.get(lesson.key)}`);
        else lessonKeys.set(lesson.key, at);
      }
      const spanish = lesson.localized?.es ?? {};
      for (const locale of LOCALES) {
        const text = lesson.localized?.[locale];
        if (!text) { add('missing-locale', here, locale); continue; }
        for (const field of ['title', 'learningObjective', 'case']) {
          if (!normalize(text[field])) add('empty-text', here, `${locale}.${field}`);
        }
        const titleKey = locale + ':' + normalize(text.title);
        if (normalize(text.title)) {
          if (lessonTitles.has(titleKey)) add('duplicate-lesson-title', here, locale + ': repeated title also in ' + lessonTitles.get(titleKey));
          else lessonTitles.set(titleKey, here);
        }
        // A case that only repeats the lesson or level title is a slot, not a scenario.
        const scenario = normalize(text.case), title = normalize(text.title);
        if (scenario && title && (scenario === title || scenario.endsWith(title))) add('placeholder-case', here, `${locale}: "${text.case}"`);
        if (locale !== 'es' && scenario.length > 40 && scenario === normalize(spanish.case)) add('untranslated', here, `${locale}.case igual al español`);

        for (const decision of decisionsOf(text)) auditDecision(decision, here, locale);
      }
      const scenario = normalize(spanish.case);
      if (scenario) caseUses.set(scenario, [...(caseUses.get(scenario) ?? []), here]);
      for (const decision of decisionsOf(spanish)) if (Number.isInteger(decision.correctIndex)) correctPositions.push(decision.correctIndex);
      compareOptionCounts(lesson.localized, here);
    }

    const questions = level.assessment?.questions ?? [];
    if (!level.assessment || questions.length === 0) add('no-exam', at, 'sin banco de examen');
    else if (questions.length < MIN_EXAM_QUESTIONS) add('short-exam', at, `${questions.length} de ${MIN_EXAM_QUESTIONS} preguntas`);
    for (const question of questions) {
      const here = `${at} · ${question.key ?? 'pregunta sin clave'}`;
      for (const locale of LOCALES) {
        const text = question.localized?.[locale];
        if (!text) { add('missing-locale', here, locale); continue; }
        if (!normalize(text.prompt)) add('empty-text', here, `${locale}.prompt`);
        auditDecision(text, here, locale);
      }
      const spanish = question.localized?.es;
      if (Number.isInteger(spanish?.correctIndex)) correctPositions.push(spanish.correctIndex);
      compareOptionCounts(question.localized, here);
    }
  }

  for (const [, places] of caseUses) {
    if (places.length > 1) add('repeated-case', places[0], `mismo caso en ${places.length} lecciones: ${places.slice(1, 4).join(', ')}${places.length > 4 ? '…' : ''}`);
  }
  // Learners notice quickly when the right answer is always in the same place.
  if (correctPositions.length >= 6 && new Set(correctPositions).size === 1) {
    add('answer-position-bias', source, `las ${correctPositions.length} respuestas correctas están en la opción ${correctPositions[0] + 1}`);
  }
  return findings;

  function auditDecision(decision, where, locale) {
    const options = decision.options ?? [];
    if (options.length < MIN_OPTIONS) add('few-options', where, `${locale}: ${options.length} opciones`);
    if (!Number.isInteger(decision.correctIndex) || decision.correctIndex < 0 || decision.correctIndex >= options.length) {
      add('invalid-correct-index', where, `${locale}: ${decision.correctIndex}`);
      return;
    }
    // Feedback that only repeats the answer explains nothing.
    if (normalize(decision.feedback) && normalize(decision.feedback) === normalize(options[decision.correctIndex])) add('feedback-repeats-answer', where, locale);
  }

  function compareOptionCounts(localized, where) {
    const counts = LOCALES.map(locale => decisionsOf(localized?.[locale]).map(decision => decision.options.length).join('/')
      || (Array.isArray(localized?.[locale]?.options) ? String(localized[locale].options.length) : ''));
    if (new Set(counts.filter(Boolean)).size > 1) add('option-count-mismatch', where, LOCALES.map((locale, i) => `${locale}:${counts[i] || '0'}`).join(' '));
  }
}

/** Levels present across several documents, to report what is still missing out of 15. */
export function coveredLevels(documents) {
  return [...new Set(documents.flatMap(document => levelsOf(document).map(level => Number(level.number ?? level.level))))]
    .filter(Number.isInteger).sort((a, b) => a - b);
}

export function summarize(findings) {
  const byRule = {};
  for (const finding of findings) (byRule[finding.rule] ??= []).push(finding);
  return Object.entries(byRule)
    .map(([rule, list]) => ({rule, count: list.length, blocking: BLOCKING.has(rule), examples: list.slice(0, 3).map(item => `${item.where} — ${item.detail}`)}))
    .sort((a, b) => Number(b.blocking) - Number(a.blocking) || b.count - a.count);
}

const LABELS = {
  'missing-locale': 'Falta un idioma',
  'empty-text': 'Texto vacío',
  'placeholder-case': 'Caso de relleno (repite el título)',
  'duplicate-lesson-key': 'Clave de lección duplicada',
  'no-exam': 'Nivel sin examen',
  'short-exam': 'Examen con menos de cinco preguntas',
  'option-count-mismatch': 'Distinto número de opciones entre idiomas',
  'invalid-correct-index': 'Respuesta correcta fuera de rango',
  'few-options': 'Menos de tres opciones',
  'feedback-repeats-answer': 'La retroalimentación solo repite la respuesta',
  'repeated-case': 'Mismo caso en varias lecciones',
  'answer-position-bias': 'La respuesta correcta siempre está en el mismo lugar',
  'untranslated': 'Texto sin traducir',
};

function main(argv) {
  const flags = new Set(argv.filter(arg => arg.startsWith('--')));
  const files = argv.filter(arg => !arg.startsWith('--'));
  if (files.length === 0) {
    console.error('Uso: node scripts/position-curriculum-audit.mjs [--strict] [--json] <archivo.json>…');
    return 2;
  }
  const documents = files.map(file => ({file, document: JSON.parse(fs.readFileSync(file, 'utf8'))}));
  const findings = documents.flatMap(({file, document}) => auditCurriculum(document, path.basename(file)));
  const levels = coveredLevels(documents.map(item => item.document));
  const missing = Array.from({length: EXPECTED_LEVELS}, (_, i) => i + 1).filter(n => !levels.includes(n));
  const summary = summarize(findings);
  const blocking = findings.filter(finding => finding.blocking).length;

  if (flags.has('--json')) {
    console.log(JSON.stringify({files, levels, missingLevels: missing, blocking, summary, findings}, null, 2));
  } else {
    console.log(`Niveles encontrados: ${levels.join(', ') || 'ninguno'}${missing.length ? ` · faltan: ${missing.join(', ')}` : ''}`);
    console.log(`Hallazgos: ${findings.length} (${blocking} bloquean la publicación)\n`);
    for (const item of summary) {
      console.log(`${item.blocking ? 'BLOQUEA' : 'revisar'}  ${String(item.count).padStart(4)}  ${LABELS[item.rule] ?? item.rule}`);
      for (const example of item.examples) console.log(`               ${example}`);
    }
  }
  return flags.has('--strict') && (blocking > 0 || missing.length > 0) ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exit(main(process.argv.slice(2)));
