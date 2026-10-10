"use client";
import {type ReactNode, type ClipboardEvent, type DragEvent, type KeyboardEvent, type MouseEvent} from "react";
import {useLanguage} from "./localization/provider";

/** Exam copy deterrent: not DRM. Screenshot, devtools and device photography remain possible.
 * Only blocks copying test prompts inside this region; authored responses remain editable. */
export default function AssessmentProtection({children}:{children:ReactNode}){
 const {locale}=useLanguage();
 const copy={
  es:{banner:"Evaluación individual · copia de preguntas restringida",detail:"Responde con tus propias decisiones. Las capturas de pantalla y fotografías no pueden impedirse desde un navegador.",blocked:"La copia de enunciados está deshabilitada durante esta evaluación."},
  en:{banner:"Individual assessment · copying questions restricted",detail:"Answer using your own reasoning. A browser cannot prevent screenshots or photographs.",blocked:"Copying assessment prompts is disabled."},
  fr:{banner:"Évaluation individuelle · copie des questions limitée",detail:"Répondez avec votre propre raisonnement. Un navigateur ne peut pas empêcher les captures d’écran ou les photos.",blocked:"La copie des questions est désactivée."},
  pt:{banner:"Avaliação individual · cópia de questões restrita",detail:"Responda com seu próprio raciocínio. O navegador não pode impedir capturas de tela ou fotografias.",blocked:"A cópia das questões está desativada."}
 }[locale]??{
  banner:"Evaluación individual · copia de preguntas restringida",
  detail:"Las capturas de pantalla no pueden impedirse desde el navegador.",
  blocked:"La copia de enunciados está deshabilitada."
 };
 const editable=(target:EventTarget|null)=>target instanceof Element&&Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
 const stopCopy=(event:ClipboardEvent<HTMLDivElement>)=>{if(!editable(event.target)){event.preventDefault();}};
 const stopDrag=(event:DragEvent<HTMLDivElement>)=>{if(!editable(event.target))event.preventDefault();};
 const stopMenu=(event:MouseEvent<HTMLDivElement>)=>{if(!editable(event.target))event.preventDefault();};
 const stopShortcut=(event:KeyboardEvent<HTMLDivElement>)=>{if(!editable(event.target)&&(event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="c")event.preventDefault();};
 return <div className="assessment-protected" onCopyCapture={stopCopy} onDragStartCapture={stopDrag} onContextMenuCapture={stopMenu} onKeyDownCapture={stopShortcut}>
  <div className="assessment-protection-banner" role="note"><strong>{copy.banner}</strong><span>{copy.detail}</span></div>
  <div className="assessment-protected-content">{children}</div>
 </div>;
}
