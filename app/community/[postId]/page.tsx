import {translatedMetadata} from '../../../lib/localization/metadata';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {randomUUID} from 'node:crypto';
import LocalizedContent from '../../components/localization/server';
import CommunityPostCard from '../../components/community-post';
import {socialSession,workflowMessage,type CommunityPost} from '../../../lib/social-server';
import {isUuid} from '../../../lib/workspace-sandbox';
export async function generateMetadata(){return translatedMetadata({title:'Comunidad',robots:{index:false,follow:false}});}
export default async function Thread({params,searchParams}:{params:Promise<{postId:string}>;searchParams:Promise<{result?:string;before?:string;cursor?:string}>}){
 const s=await socialSession();const {postId}=await params;if(!isUuid(postId))notFound();
 const query=await searchParams;const before=query.before&&Number.isFinite(Date.parse(query.before))?new Date(query.before).toISOString():null;
 const [{data:items,error},{data:member}]=await Promise.all([s.admin.rpc('community_feed',{p_actor:s.user.id,p_parent:postId,p_before:before,p_cursor:isUuid(query.cursor)?query.cursor:null}),s.admin.from('community_members').select('blocked').eq('user_id',s.user.id).maybeSingle()]);
 if(error)notFound();const posts=items as CommunityPost[];const root=posts.find(p=>p.id===postId);const message=workflowMessage(query.result);
 return <LocalizedContent><main className="wrap"><Link href="/community">Volver a la comunidad</Link>{message&&<p role="status">{message}</p>}<div className="social-stack">{posts.slice(0,30).map(post=><CommunityPostCard key={post.id} post={post} thread/>)}{posts.length>30&&<Link href={'/community/'+postId+'?before='+encodeURIComponent(posts[29].created_at)+'&cursor='+posts[29].id}>Ver anteriores</Link>}</div>
 {member&&!member.blocked&&(!root||!root.locked)&&<form className="card" method="post" action="/api/community"><h2>Responder</h2><input type="hidden" name="action" value="post"/><input type="hidden" name="request_id" value={randomUUID()}/><input type="hidden" name="parent" value={postId}/><label>Respuesta<textarea name="body" required maxLength={4000}/></label><button className="btn">Enviar a revisión</button></form>}
 </main></LocalizedContent>;
}
