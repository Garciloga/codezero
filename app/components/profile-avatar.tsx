"use client";
import {useEffect,useState} from "react";
import {initials} from "../../lib/organization-metrics";
export const PHOTO_EVENT = "garciloga-profile-photo";
export default function ProfileAvatar({name,version}:{name:string;version?:string|null}) {
  const [current,setCurrent]=useState(version);
  const [failed,setFailed]=useState(false);
  useEffect(()=>{setCurrent(version);setFailed(false);},[version]);
  useEffect(()=>{const change=(event:Event)=>{if(event instanceof CustomEvent){setCurrent(event.detail.version);setFailed(false);}};window.addEventListener(PHOTO_EVENT,change);return()=>window.removeEventListener(PHOTO_EVENT,change);},[]);
  return <span className="vivo-avatar" aria-hidden="true">{current && !failed ? <img src={"/api/profile/photo?v="+encodeURIComponent(current)} alt="" width={44} height={44} onError={()=>setFailed(true)}/> : initials(name)}</span>;
}
