"use client";
import {useEffect,useState} from "react";
import {initials} from "../../lib/organization-metrics";
export const PHOTO_EVENT = "garciloga-profile-photo";
export default function ProfileAvatar({name,version,userId}:{name:string;version?:string|null;userId?:string}) {
  const [current,setCurrent]=useState(version);
  const [failed,setFailed]=useState(false);
  useEffect(()=>{setCurrent(version);setFailed(false);},[version,userId]);
  useEffect(()=>{const change=(event:Event)=>{if(event instanceof CustomEvent && event.detail?.userId===userId){setCurrent(event.detail.version);setFailed(false);}};window.addEventListener(PHOTO_EVENT,change);return()=>window.removeEventListener(PHOTO_EVENT,change);},[userId]);
  return <span className="vivo-avatar" aria-hidden="true">{current && !failed ? <img decoding="async" src={"/api/profile/photo?v="+encodeURIComponent(current)} alt="" width={44} height={44} onError={()=>setFailed(true)}/> : initials(name)}</span>;
}

