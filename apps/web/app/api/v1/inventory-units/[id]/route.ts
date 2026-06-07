import { NextResponse, type NextRequest } from "next/server";
import { getInventoryUnitDetail } from "@/lib/discovery-data";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const unit = await getInventoryUnitDetail(id);
    if (!unit) {
      return NextResponse.json({ error: "Inventory unit not found" }, { status: 404 });
    }
    return NextResponse.json({ data: unit });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Inventory unit lookup failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
