import { NextResponse } from "next/server";
import { introspectSeriesTypes } from "@/lib/grid-introspection";

// Note: The route is hardcoded to query only Series, SeriesFilter, and SeriesOrderBy
// to prevent schema exfiltration. If we ever need to accept params, we would validate
// against a whitelist here.

export async function GET() {
  const GRID_API_KEY = process.env.GRID_API_KEY;

  if (!GRID_API_KEY || GRID_API_KEY === "YOUR_GRID_API_KEY") {
    return NextResponse.json(
      { success: false, code: "MISSING_API_KEY" },
      { status: 503 }
    );
  }

  // Only allow introspection of whitelisted types to prevent schema exfiltration
  // The route is hardcoded to query Series, SeriesFilter, and SeriesOrderBy
  // If we ever need to accept params, we would validate against ALLOWED_TYPES here

  try {
    // Make 3 separate requests, each with exactly ONE __type query
    // This respects the good-faith introspection restriction
    const { seriesType, seriesFilter, seriesOrderBy } = await introspectSeriesTypes(GRID_API_KEY);

    return NextResponse.json({
      success: true,
      seriesType: {
        name: seriesType.name,
        fields: seriesType.fields?.map((f: any) => ({
          name: f.name,
          type: {
            kind: f.type.kind,
            name: f.type.name || f.type.ofType?.name || f.type.ofType?.ofType?.name,
            ofType: f.type.ofType ? {
              kind: f.type.ofType.kind,
              name: f.type.ofType.name || f.type.ofType.ofType?.name,
            } : undefined,
          },
        })) || [],
      },
      seriesFilter: {
        name: seriesFilter.name,
        inputFields: seriesFilter.inputFields?.map((f: any) => ({
          name: f.name,
          type: {
            kind: f.type.kind,
            name: f.type.name || f.type.ofType?.name || f.type.ofType?.ofType?.name,
            ofType: f.type.ofType ? {
              kind: f.type.ofType.kind,
              name: f.type.ofType.name || f.type.ofType.ofType?.name,
            } : undefined,
          },
        })) || [],
      },
      seriesOrderBy: {
        name: seriesOrderBy.name,
        enumValues: seriesOrderBy.enumValues?.map((e: any) => e.name) || [],
      },
    });
  } catch (err: any) {
    // Determine which type failed if possible
    let which: string | undefined;
    if (err.message?.includes("SeriesFilter")) {
      which = "SeriesFilter";
    } else if (err.message?.includes("SeriesOrderBy")) {
      which = "SeriesOrderBy";
    } else if (err.message?.includes("Series")) {
      which = "Series";
    }

    // Extract HTTP status if available
    let httpStatus: number | undefined;
    if (err.message?.includes("HTTP_")) {
      const match = err.message.match(/HTTP_(\d+)/);
      httpStatus = match ? parseInt(match[1], 10) : undefined;
    }

    return NextResponse.json(
      {
        success: false,
        code: "INTROSPECTION_FAILED",
        error: err.message || "Unknown error",
        details: {
          which,
          httpStatus,
        },
      },
      { status: 502 }
    );
  }
}

