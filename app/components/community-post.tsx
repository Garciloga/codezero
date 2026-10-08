import Link from 'next/link';
import type {CommunityPost} from '../../lib/social-server';
export default function CommunityPostCard({post,thread=false}:{post:CommunityPost;thread?:boolean}){
 return <article className="card social-post"><header><strong translate="no">{post.alias}</strong><span className="pill">{post.status==='pending'?'En revisión':post.status==='hidden'?'Oculto':'Publicado'}</span></header>
 {!post.parent_id&&<h2>{thread||post.status!=='approved'?<span translate="no">{post.title}</span>:<Link href={'/community/'+post.id} translate="no">{post.title}</Link>}</h2>}
 <p className="social-body" translate="no">{post.body}</p>{post.locked&&<p>Conversación cerrada.</p>}
 {post.own?<form method="post" action="/api/community"><input type="hidden" name="action" value="remove"/><input type="hidden" name="target" value={post.id}/>{post.parent_id&&<input type="hidden" name="parent" value={post.parent_id}/>}<button className="btn secondary">Retirar publicación</button></form>:post.status==='approved'&&<details><summary>Reportar contenido</summary><form method="post" action="/api/community"><input type="hidden" name="action" value="report"/><input type="hidden" name="target" value={post.id}/>{post.parent_id&&<input type="hidden" name="parent" value={post.parent_id}/>}<label>Motivo del reporte<textarea name="body" minLength={5} maxLength={1000} required/></label><button className="btn secondary">Enviar reporte</button></form></details>}
 </article>;
}
