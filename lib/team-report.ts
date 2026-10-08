import {ORGANIZATION_ROLES,type OrganizationRole} from "./organization-metrics.ts";
export function parseAssignedActivity(value: unknown): { type: string; id: number } | null {
  if (typeof value !== "string" || !/^(lesson|exam|project):[1-9][0-9]*$/.test(value)) return null;
  const [type, raw] = value.split(":"); const id = Number(raw);
  return Number.isSafeInteger(id) ? { type, id } : null;
}
export function csvCell(value: unknown): string {
  const text = String(value ?? "");
  // Spreadsheet formulas can start after whitespace or controls.
  const safe = /^[\s\u0000-\u001f]*[=+@-]/.test(text) ? "'" + text : text;
  return '"' + safe.replaceAll('"', '""') + '"';
}
export type ReportMember = { user_id: string; display_name: string; role: string; active: boolean };
export type ReportAssignment = { user_id: string; activity_key: string; title: string; competency: string };
export type ReportEvidence = { user_id: string; activity_key: string; completed: boolean; score: number | null; observed_at: string };
export function teamReportCsv(members: ReportMember[], assignments: ReportAssignment[], evidence: ReportEvidence[]): string {
  const roster = new Map(members.filter(m => m.active).map(m => [m.user_id,m]));
  const results = new Map(evidence.map(e => [`${e.user_id}:${e.activity_key}`, e]));
  const rows: unknown[][] = [["Colaborador", "Rol", "Actividad", "Competencia", "Estado", "Calificación registrada", "Observado UTC"]];
  for (const activity of assignments) {
    const member = roster.get(activity.user_id); if (!member) continue;
    const result = results.get(`${activity.user_id}:${activity.activity_key}`);
    rows.push([member.display_name, ORGANIZATION_ROLES[member.role as OrganizationRole]??member.role, activity.title, activity.competency, result?.completed ? "Completada" : "Pendiente", result?.score ?? "", result?.observed_at ?? ""]);
  }
  return "\ufeff" + rows.map(row => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

