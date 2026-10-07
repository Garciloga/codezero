import Link from "next/link";
import { publicMetadata } from "../../../lib/public-metadata";

export const metadata = publicMetadata("Contacto", "Opciones de contacto de soporte, facturación y privacidad de CodeZero.", "/contact");

export default function ContactPage() {
  return (
    <main className="wrap">
      <div className="nav">
        <div><span className="pill">CONTACTO</span><h1>Contacto CodeZero</h1></div>
        <Link className="btn secondary" href="/">Inicio</Link>
      </div>
      <div className="card" style={{lineHeight:1.75}}>
        <p><b>Responsable:</b> Isaac López Garcia</p>
        <p><b>Alias público:</b> Isaac Garciloga</p>
        <p><b>Tipo de operación:</b> Persona física</p>
        <p><b>Ubicación de operación:</b> Ciudad de México, México</p>
        <p><b>Email:</b> <a href="mailto:codescerooficial@gmail.com">codescerooficial@gmail.com</a></p>
        <p><b>Teléfono:</b> <a href="tel:+525533881002">+52 55 3388 1002</a></p>
      </div>
    </main>
  );
}
