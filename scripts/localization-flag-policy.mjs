// Undefined means active: release checks never silently exempt a new module.
export function translationGate(file,env=process.env){
 const mixed=file.startsWith('app/role-training/mixed/')||file.startsWith('lib/mixed-role-')||/^app\/components\/(?:enterprise\/mixed-|mixed-code-editor)/.test(file);
 // Explicit unpublished editor and Spanish-only guide source: report as pending beta,
 // never as a released multilingual course. Public marketing still must be translated.
 const authoredSpanishOnly=[
  'lib/draft-expanded-curriculum.ts',
  'lib/company-help-content.ts',
  'lib/draft-course-assignment-policy.ts',
  'app/components/enterprise/draft-course-assignment.tsx'
 ].includes(file);
 return authoredSpanishOnly?'warning':mixed&&env.CODEZERO_MIXED_ROUTES==='0'?'warning':'error';
}
