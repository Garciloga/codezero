import { translatedMetadata } from '../../../lib/localization/metadata';
import LocalizedContent from "../../components/localization/server";
import { notFound } from "next/navigation";
import { workspaceSandboxEnabled } from "../../../lib/workspace-sandbox";
import AppearanceSettings from "../../components/appearance-settings";
import BlockDiplomaDocument from "../../components/block-diploma-document";
import PrintDiploma from "../../components/print-diploma";
import RoleCasePractice from '../../components/role-case-practice';
import PracticeLearningPreview from '../../components/practice-learning-preview';
import PracticeEvidenceReview from '../../components/practice-evidence-review';
import TutorCostEstimate from '../../components/tutor-cost-estimate';
import "../../diplomas/diploma.css";
export async function generateMetadata() { return translatedMetadata({title:"Revisión de experiencia",robots:{index:false,follow:false}}); }
export default function ExperiencePreview(){
 if(process.env.CODEZERO_EXPERIENCE_PREVIEW!=="1"||!workspaceSandboxEnabled())notFound();
 return <LocalizedContent><main className="wrap experience-preview"><div className="card"><span className="pill">REVISIÓN DE PRUEBAS</span><h1>Tu forma de aprender, tu Garciloga</h1><p>Revisión de interfaz con datos ficticios. Explora la apariencia y la impresión del diploma.</p>
  <nav className="review-section-nav" aria-label="Secciones de la revisión"><a href="#appearance-heading">Apariencia</a><a href="#role-cases">Casos</a><a href="#learning-review">Mi camino</a><a href="#diploma-review">Diploma</a></nav></div>
  <AppearanceSettings userId={null}/>
  <RoleCasePractice/>
  <section id="learning-review"><h2>Construye tu camino</h2><PracticeLearningPreview initialLevel={null}/></section>
  <PracticeEvidenceReview/>
  <section id="tutor-review"><h2>Preparación del Tutor</h2><p>El proveedor permanece apagado. Los límites de costo y recuperación se prueban con respuestas simuladas, sin consumir consultas reales.</p><TutorCostEstimate/></section>
  <section className="diploma-review" id="diploma-review"><h2>Vista de diploma</h2><p>La emisión real requiere cumplir el bloque; esta muestra sirve para revisar el diseño.</p><div className="diploma-controls"><PrintDiploma/></div>
   <BlockDiplomaDocument sample level={1} name="Estudiante de demostración" title="Fundamentos y pensamiento lógico"/></section>
 </main></LocalizedContent>;
}

