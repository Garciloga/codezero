import { translatedMetadata } from '../../../lib/localization/metadata';
import LocalizedContent from "../../components/localization/server";
import Link from "next/link";
import { publicMetadata } from "../../../lib/public-metadata";

export async function generateMetadata() { return translatedMetadata(publicMetadata("Contacto", "Opciones de contacto de soporte, facturación y privacidad de Garciloga.", "/contact")); }

export default async function ContactPage({searchParams}:{searchParams:Promise<{name?:string;company?:string;size?:string;positions?:string}>}) {
  const q=await searchParams;
  const body=[q.name,q.company,q.size,q.positions].filter(v=>typeof v==='string').map(v=>v!.slice(0,300)).join('\n');
  return (
    <LocalizedContent><main className="wrap">
      <div className="nav">
        <div><span className="pill">CONTACTO</span><h1>Contacto Garciloga</h1></div>
        <Link prefetch={false} className="btn secondary" href="/">Inicio</Link>
      </div>
      {body&&<p><a className="btn" href={"mailto:codescerooficial@gmail.com?subject="+encodeURIComponent("Garciloga · Equipos")+"&body="+encodeURIComponent(body)}>Enviar consulta por mi correo</a></p>}
      <div className="card" style={{lineHeight:1.75}}>
        <p><b>Responsable:</b> Isaac López Garcia</p>
        <p><b>Alias público:</b> Isaac Garciloga</p>
        <p><b>Tipo de operación:</b> Persona física</p>
        <p><b>Ubicación de operación:</b> Ciudad de México, México</p>
        <p><b>Email:</b> <a href="mailto:codescerooficial@gmail.com">codescerooficial@gmail.com</a></p>
        <p><b>Teléfono:</b> <a href="tel:+525533881002">+52 55 3388 1002</a></p>
      </div>
    </main></LocalizedContent>
  );
}

