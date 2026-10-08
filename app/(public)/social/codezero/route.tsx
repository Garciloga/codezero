import { serverMessages } from "../../../../lib/localization/server";
import { translator, validLocale } from "../../../../lib/localization/shared";
import { VIVO_COLORS, VIVO_FONTS } from "../../../../lib/vivo-design";
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const size = { width: 1200, height: 630 };
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requested = new URL(request.url).searchParams.get("lang");
  const locale = validLocale(requested) ? requested : "es";
  const t = translator(await serverMessages(locale));
  const [font, body] = await Promise.all([
    readFile(
      join(
        process.cwd(),
        "node_modules/@fontsource/outfit/files/outfit-latin-700-normal.woff",
      ),
    ),
    readFile(
      join(
        process.cwd(),
        "node_modules/@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-400-normal.woff",
      ),
    ),
  ]);
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        padding: "64px",
        background: VIVO_COLORS.bg,
        color: VIVO_COLORS.text,
        fontFamily: VIVO_FONTS.heading,
        fontWeight: 700,
      }}
    >
      <div
        style={{ display: "flex", fontSize: 38, color: VIVO_COLORS.primary }}
      >
        Garciloga
      </div>
      <div style={{ display: "flex", fontSize: 64, lineHeight: 1.05 }}>
        {t("Aprende a programar desde cero, paso a paso.")}
      </div>
      <div
        style={{ display: "flex", fontSize: 28, color: VIVO_COLORS.primary }}
      >
        {t("Programación · SaaS · Integraciones")}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 28,
          background: VIVO_COLORS.accent,
          color: VIVO_COLORS.sidebar,
          fontFamily: VIVO_FONTS.body,
          fontWeight: 400,
          padding: "16px 24px",
          borderRadius: 999,
          alignSelf: "flex-start",
        }}
      >
        {t("El Nivel 1 completo es gratis.")}
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: VIVO_FONTS.heading, data: font, weight: 700, style: "normal" },
        { name: VIVO_FONTS.body, data: body, weight: 400, style: "normal" },
      ],
    },
  );
}
