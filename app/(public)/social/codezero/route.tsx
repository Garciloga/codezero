import { serverMessages } from "../../../../lib/localization/server";
import { translator, validLocale } from "../../../../lib/localization/shared";
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const size = { width: 1200, height: 630 };
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requested = new URL(request.url).searchParams.get("lang");
  const locale = validLocale(requested) ? requested : "es";
  const t = translator(await serverMessages(locale));
  const font = await readFile(join(process.cwd(), "node_modules/@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-700-normal.woff"));
  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", height: "100%", padding: "64px", background: "#F4F6FB", color: "#121A33", fontFamily: "Bricolage Grotesque", fontWeight: 700 }}>
      <div style={{ display: "flex", fontSize: 38, color: "#2346D8" }}>CodeZero</div>
      <div style={{ display: "flex", fontSize: 64, lineHeight: 1.05 }}>{t("Aprende a programar desde cero, paso a paso.")}</div>
      <div style={{ display: "flex", fontSize: 28, color: "#2346D8" }}>{t("Programación · SaaS · Integraciones")}</div>
      <div style={{ display: "flex", fontSize: 28, background: "#FFB627", padding: "16px 24px", borderRadius: 10, alignSelf: "flex-start" }}>{t("El Nivel 1 completo es gratis.")}</div>
    </div>,
    { ...size, fonts: [{ name: "Bricolage Grotesque", data: font, weight: 700, style: "normal" }] },
  );
}

