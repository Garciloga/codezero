import {
  hierarchyDepth,
  ORGANIZATION_ROLES,
  type Member,
} from "../../../lib/organization-metrics";
export default function Organigram({
  members,
  visible,
  user,
}: {
  members: Member[];
  visible: string[];
  user: string;
}) {
  return (
    <section className="card" style={{ marginTop: 24 }}>
      <h2>Organigrama</h2>
      <ul className="vivo-organigram">
        {orderedMembers(members).map((m) => (
          <li
            key={m.user_id}
            className={visible.includes(m.user_id) ? "" : "limited"}
            style={
              {
                marginLeft: Math.min(hierarchyDepth(m, members) * 24, 192),
                "--depth": hierarchyDepth(m, members) * 24 + "px",
              } as import("react").CSSProperties
            }
          >
            <strong translate="no">{m.display_name}</strong> ·{" "}
            {m.job_title ? (
              <span translate="no">{m.job_title}</span>
            ) : (
              ORGANIZATION_ROLES[m.role]
            )}
            {m.user_id === user && (
              <span className="vivo-chip" style={{ marginLeft: 10 }}>
                Tú
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function orderedMembers(members: Member[]) {
  const result: Member[] = [];
  const seen = new Set<string>();
  const walk = (m: Member) => {
    if (seen.has(m.user_id)) return;
    seen.add(m.user_id);
    result.push(m);
    members
      .filter((x) => x.reports_to === m.user_id)
      .sort((a, b) => a.display_name.localeCompare(b.display_name))
      .forEach(walk);
  };
  members
    .filter((m) => !members.some((p) => p.user_id === m.reports_to))
    .forEach(walk);
  members.forEach(walk);
  return result;
}
