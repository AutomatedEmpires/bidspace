import { NextResponse, type NextRequest } from "next/server";
import { getDiscoveryResult } from "@/lib/discovery-data";

function paramsToRecord(searchParams: URLSearchParams): Record<string, string> {
  return Object.fromEntries(searchParams.entries());
}

export async function GET(request: NextRequest) {
  try {
    const result = await getDiscoveryResult(paramsToRecord(request.nextUrl.searchParams));
    return NextResponse.json({
      data: {
        units: result.units,
        markers: result.markers,
        mode: result.mode,
        bounds: result.bounds,
        center: result.center,
        filters: result.filters,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Inventory search failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
