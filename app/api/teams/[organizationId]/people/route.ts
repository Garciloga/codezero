import { NextResponse } from "next/server";
import { organizationView } from "../../../../../lib/organization-server";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  const { organizationId } = await params;
  try {
    const data = await organizationView(organizationId, [
      "owner",
      "admin",
      "manager",
      "supervisor",
    ]);
    if (!data)
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    return NextResponse.json(
      { people: data.people },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "TEAM_DATA_UNAVAILABLE" },
      { status: 503 },
    );
  }
}
