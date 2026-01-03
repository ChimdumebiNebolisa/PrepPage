import { NextRequest, NextResponse } from "next/server";
import { safeJson } from "@/lib/http";

const GRID_GRAPHQL_ENDPOINT = "https://api-op.grid.gg/central-data/graphql";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const GRID_API_KEY = process.env.GRID_API_KEY;

    if (!GRID_API_KEY || GRID_API_KEY === "YOUR_GRID_API_KEY") {
      return NextResponse.json(
        { success: false, code: "MISSING_API_KEY" },
        { status: 503 }
      );
    }

    const titlesQuery = `
      query GetTitles {
        titles {
          id
          name
        }
      }
    `;

    const response = await fetch(GRID_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": GRID_API_KEY,
      },
      body: JSON.stringify({
        query: titlesQuery,
      }),
    });

    const data = await safeJson(response, "titles_query");

    if (data.errors) {
      throw new Error(data.errors.map((e: any) => e.message).join(", "));
    }

    const titles = data.data?.titles || [];

    return NextResponse.json({
      success: true,
      source: "GRID",
      titles,
    });
  } catch (error: any) {
    console.error("Titles API Error:", error.message);
    return NextResponse.json(
      { success: false, code: "GRID_FETCH_FAILED", error: error.message },
      { status: 502 }
    );
  }
}

