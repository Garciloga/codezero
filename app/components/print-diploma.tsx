"use client";
export default function PrintDiploma() {
  return <button type="button" className="btn" onClick={() => window.print()}>Imprimir o guardar como PDF</button>;
}
