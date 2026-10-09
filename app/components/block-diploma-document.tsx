import LocalizedDate from './localization/date';
import LocalizedContent from "./localization/server";
import BrandLogo from "./brand-logo";
export default function BlockDiplomaDocument({level,name,title,id,issuedAt,sample=false}: {level:number;name:string;title:string;id?:string;issuedAt?:string;sample?:boolean}) {
 return <LocalizedContent><article className="card block-diploma" aria-labelledby="diploma-title">
  <p className="diploma-brand document-brand"><BrandLogo label="Garciloga"/></p><span className="pill">{sample?"MUESTRA DE DISEÑO":"BLOQUE COMPLETADO"}</span>
  <h1 id="diploma-title">Diploma de finalización</h1><p>Se reconoce que</p><h2><span translate="no">{name}</span></h2>
  <p>cumplió los requisitos de aprendizaje del bloque</p><h3>{level} · {title}</h3>
  <p>Lecciones completadas, evaluación aprobada y proyecto aprobado cuando aplica.</p>
  <p className="muted">{sample?"Datos ficticios. Esta muestra no acredita aprendizaje ni emite un diploma.":"Constancia privada de finalización. No equivale a un título oficial ni a acreditación profesional."}</p>
  {!sample && (id && issuedAt ? <p className="muted">Identificador privado: {id}<br/>Emitido: <LocalizedDate value={issuedAt} />. Conservado con los requisitos de emisión.</p>:<p className="muted">Requisitos comprobados al consultar este documento. Emisión persistente pendiente.</p>)}
 </article></LocalizedContent>;
}

