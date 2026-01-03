import { NextRequest, NextResponse } from "next/server";
import { safeJson } from "@/lib/http";
import { getDefaultTournamentIds } from "@/lib/hackathon-tournaments";

const GRID_GRAPHQL_ENDPOINT = "https://api-op.grid.gg/central-data/graphql";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const titleId = searchParams.get("titleId");

    if (!titleId) {
      return NextResponse.json(
        { success: false, code: "TITLE_ID_REQUIRED", error: "titleId query parameter is required" },
        { status: 400 }
      );
    }

    const GRID_API_KEY = process.env.GRID_API_KEY;

    if (!GRID_API_KEY || GRID_API_KEY === "YOUR_GRID_API_KEY") {
      return NextResponse.json(
        { success: false, code: "MISSING_API_KEY" },
        { status: 503 }
      );
    }

    const tournamentsQuery = `
      query GetTournaments($titleId: String!) {
        tournaments(filter: { title: { id: { in: [$titleId] } } }) {
          totalCount
          edges {
            node {
              id
              name
            }
          }
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
        query: tournamentsQuery,
        variables: { titleId },
      }),
    });

    const data = await safeJson(response, "tournaments_query");

    if (data.errors) {
      throw new Error(data.errors.map((e: any) => e.message).join(", "));
    }

    const allTournaments = data.data?.tournaments?.edges?.map((edge: any) => edge.node) || [];
    
    // Milestone A: Filter to whitelist subset for the chosen title
    const whitelist = getDefaultTournamentIds();
    const tournaments = allTournaments.filter((tournament: any) => 
      whitelist.includes(tournament.id)
    );

    return NextResponse.json({
      success: true,
      source: "GRID",
      tournaments,
      totalCount: tournaments.length,
      totalCountUnfiltered: data.data?.tournaments?.totalCount || 0,
    });
  } catch (error: any) {
    console.error("Tournaments API Error:", error.message);
    return NextResponse.json(
      { success: false, code: "GRID_FETCH_FAILED", error: error.message },
      { status: 502 }
    );
  }
}

