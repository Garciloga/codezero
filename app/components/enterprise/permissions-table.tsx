import {
  ORGANIZATION_ROLES,
  type OrganizationRole,
} from "../../../lib/organization-metrics";
export default function PermissionsTable({ role }: { role: OrganizationRole }) {
  const roles = Object.keys(ORGANIZATION_ROLES) as OrganizationRole[];
  const rows = [
    ["Su propio avance y competencias", 5],
    ["Avance de sus reportes directos", 4],
    ["Avance de toda su rama", 3],
    ["Fortalezas y áreas de mejora del equipo", 4],
    ["Asignar aprendizaje", 4],
    ["Invitar personas y editar el organigrama", 2],
    ["Puestos, permisos e historial de cambios", 2],
    ["Facturación", 1],
  ] as const;
  return (
    <section className="card" style={{ marginTop: 24 }}>
      <h2>Qué puede ver cada puesto</h2>
      <div
        className="vivo-table-scroll"
        tabIndex={0}
        role="region"
        aria-label="Permisos por puesto"
      >
        <table>
          <thead>
            <tr>
              <th scope="col">Permiso</th>
              {roles.map((r) => (
                <th
                  scope="col"
                  key={r}
                  className={role === r ? "current-role" : ""}
                >
                  {ORGANIZATION_ROLES[r]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, count]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                {roles.map((r, i) => (
                  <td key={r} className={role === r ? "current-role" : ""}>
                    {i < count ? "Sí" : "No"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
