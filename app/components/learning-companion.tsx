import 'server-only';
import examples from '../../lib/learning-companions.json';
import LocalizedContent from './localization/server';
export default function LearningCompanion({ level }: { level: number }) {
  const example = examples.find(item => item.levels.includes(level));
  if (!example) return null;
  return <LocalizedContent><details className="card learning-companion" style={{ marginTop: 24 }}>
    <summary><strong>Ejemplo resuelto y caso de error</strong></summary>
    <h3>{example.title}</h3><p>{example.steps}</p>
    <pre><code>{example.code}</code></pre>
    <h4>Qué puede fallar</h4><p>{example.failure}</p>
    <h4>Prueba una variante</h4><p>{example.challenge}</p>
    <p><a className="btn secondary" href={example.resource} target="_blank" rel="noopener noreferrer">Ampliar con documentación oficial</a></p>
    <p className="muted">Ejemplo complementario con datos ficticios. No es una solución de tu evaluación.</p>
  </details></LocalizedContent>;
}
