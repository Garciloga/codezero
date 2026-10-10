import {createHash} from "node:crypto";
/** Version review against the actual authored content, not a mutable progress flag. */
export type EditorialState="reviewed"|"observation";
export type EditorialRow={lesson_key:string;content_hash:string;state:EditorialState;note:string|null};
export type EditorialLesson={key:string;level:number;title:Record<string,string>;application?:unknown;source?:unknown;decisions?:unknown};
export function editorialFingerprint(item:EditorialLesson){
 return createHash("sha256").update(JSON.stringify({key:item.key,level:item.level,title:item.title,application:item.application,source:item.source,decisions:item.decisions})).digest("hex");
}
export function effectiveEditorialState(row:EditorialRow|undefined,hash:string):"pending"|EditorialState{
 return !row||row.content_hash!==hash?"pending":row.state;
}
