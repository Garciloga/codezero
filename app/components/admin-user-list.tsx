import OwnerUserActions from './owner-user-actions';
type User={id:string;email:string;full_name:string|null;role:string;plan_name:string;status:string;billing_status:string|null;stripe_cancel_at_period_end:boolean|null};
export default function AdminUserList({users,plans,owner,lessons={}}:{users:User[];plans:{id:string|number;name:string}[];owner:boolean;lessons?:Record<string,{verified:number;historical:number}>}) {
  return <section className="card"><h2>Usuarios</h2><div className="admin-users">
    {users.map(u=><article className="admin-user" key={u.id}>
      <div><h3 translate="no">{u.full_name||u.email}</h3>{u.full_name&&<div translate="no">{u.email}</div>}<dl><div><dt>Rol</dt><dd>{u.role}</dd></div><div><dt>Plan</dt><dd translate="no">{u.plan_name}</dd></div><div><dt>Facturación</dt><dd>{u.billing_status??'—'}</dd></div><div><dt>Lecciones verificadas</dt><dd>{lessons[u.id]?.verified??0}</dd></div><div><dt>Lecciones históricas</dt><dd>{lessons[u.id]?.historical??0}</dd></div></dl>{u.stripe_cancel_at_period_end&&<p className="muted">Cancela al final del periodo</p>}</div>
      <div className="admin-user-controls"><form action="/api/admin/users/update" method="post" className="admin-user-edit"><input type="hidden" name="user_id" value={u.id}/><label>Plan<select name="plan_name" defaultValue={u.plan_name}>{plans.map(plan=><option key={plan.id} value={plan.name} translate="no">{plan.name}</option>)}</select></label><label>Estado de cuenta<select name="status" defaultValue={u.status}><option value="active">Activo</option><option value="suspended">Suspendido</option><option value="cancelled">Cancelado</option></select></label><button className="btn secondary">Guardar</button></form>{owner&&<OwnerUserActions id={u.id} email={u.email}/>}</div>
    </article>)}
    {!users.length&&<p>No hay usuarios para mostrar.</p>}
  </div></section>;
}
