import LocalizedContent from './localization/server';
export default function StudyGuide() {
  return <LocalizedContent><details className="card" style={{ marginTop: 24 }}>
    <summary><strong>Cómo estudiar esta lección</strong></summary>
    <ol>
      <li><b>Lee y explica</b><p>Resume la idea con tus propias palabras y escribe un ejemplo distinto al presentado.</p></li>
      <li><b>Predice antes de ejecutar</b><p>Anota la entrada, el resultado esperado y una condición que podría causar un error.</p></li>
      <li><b>Comprueba y compara</b><p>Resuelve los dos ejercicios. Si fallas, compara tu razonamiento con la explicación antes de volver a intentar.</p></li>
      <li><b>Reúne evidencia</b><p>Registra qué esperabas, qué observaste y cómo corregiste la diferencia. Usa datos ficticios; nunca incluyas contraseñas ni datos de clientes.</p></li>
    </ol>
  </details></LocalizedContent>;
}
