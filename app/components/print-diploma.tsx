"use client";
import LocalizedContent from "./localization/client";

export default function PrintDiploma() {
  return <LocalizedContent><button type="button" className="btn" onClick={() => window.print()}>Imprimir o guardar como PDF</button></LocalizedContent>;
}

