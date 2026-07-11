import { NextResponse, type NextRequest } from "next/server";
import { ValidationError, searchUnitsInViewport } from "@bidspace/services";
import { tryGetDb } from "@/lib/safe-db";

// Public spatial discovery: available inventory units inside a map viewport.
// Backed by the PostGIS RPC in 0008_search.sql; only live statuses with a
// location are ever returned, so nothing sensitive leaks.
export async function GET(request: NextRequest) {
  const db = tryGetDb();
  if (!db) {
    return NextResponse.json({ units: [], reason: "database_not_configured" }, { status: 200 });
  }

  const params = request.nextUrl.searchParams;
  const num = (key: string) => Number(params.get(key));

  try {
    const units = await searchUnitsInViewport(db, {
      minLongitude: num("minLng"),
      minLatitude: num("minLat"),
      maxLongitude: num("maxLng"),
      maxLatitude: num("maxLat"),
      limit: 300,
    });
    return NextResponse.json({ units });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Discovery search failed" }, { status: 500 });
  }
}
