export const ORGANIZATION_ROLES = {
  owner: "Responsable de compañía",
  admin: "Administrador",
  manager: "Gerente",
  supervisor: "Supervisor",
  learner: "Colaborador",
} as const;
export type OrganizationRole = keyof typeof ORGANIZATION_ROLES;
export type Member = {
  user_id: string;
  display_name: string;
  role: OrganizationRole;
  reports_to: string | null;
  active: boolean;
  job_title?: string | null;
};
export type Assignment = {
  user_id: string;
  activity_key: string;
  activity_type: string;
  activity_id: number;
  title: string;
  competency: string;
};
export type Evidence = {
  user_id: string;
  activity_key: string;
  completed: boolean;
  score: number | null;
};
export type LearningError = {
  user_id: string;
  activity_key: string;
  category: string;
};
export function summarizePerson(
  member: Member,
  assignments: Assignment[],
  evidence: Evidence[],
  errors: LearningError[],
  level: number | null,
) {
  const tasks = assignments.filter((a) => a.user_id === member.user_id),
    results = new Map(
      evidence
        .filter((e) => e.user_id === member.user_id)
        .map((e) => [e.activity_key, e]),
    );
  const completed = tasks.filter(
    (a) => results.get(a.activity_key)?.completed,
  ).length;
  const competencies = [...new Set(tasks.map((a) => a.competency))].map(
    (name) => {
      const scores = tasks
        .filter((a) => a.competency === name)
        .map((a) => results.get(a.activity_key)?.score)
        .filter(
          (n): n is number =>
            typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 100,
        );
      return {
        name,
        score: scores.length
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : null,
      };
    },
  );
  const graded = competencies
    .filter((c): c is { name: string; score: number } => c.score !== null)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  const unresolved = errors.filter(
    (e) =>
      e.user_id === member.user_id &&
      tasks.some((a) => a.activity_key === e.activity_key) &&
      !results.get(e.activity_key)?.completed,
  );
  return {
    ...member,
    level,
    tasks,
    completed,
    total: tasks.length,
    pending: tasks.length - completed,
    percent: tasks.length ? Math.round((completed / tasks.length) * 100) : null,
    competencies,
    strongest: graded[0]?.name ?? null,
    weakest: graded.at(-1)?.name ?? null,
    alert: unresolved.some((e) => e.category === "exam_not_passed")
      ? "Examen no aprobado"
      : unresolved.some((e) => e.category === "project_needs_revision")
        ? "Proyecto por corregir"
        : null,
  };
}
export function skillLabel(score: number | null) {
  return score === null
    ? "Aún no hay resultados"
    : score >= 75
      ? "Fuerte"
      : score >= 50
        ? "En camino"
        : "Por reforzar";
}
export function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((x) => x[0])
      .join("")
      .toUpperCase() || "GA"
  );
}
export function hierarchyDepth(member: Member, roster: Member[]) {
  let depth = 0,
    parent = member.reports_to;
  const seen = new Set([member.user_id]);
  while (parent && !seen.has(parent)) {
    seen.add(parent);
    const node = roster.find((m) => m.user_id === parent);
    if (!node) break;
    depth++;
    parent = node.reports_to;
  }
  return depth;
}

