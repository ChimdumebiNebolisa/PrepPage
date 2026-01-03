import { NextRequest, NextResponse } from "next/server";
import { safeJson } from "@/lib/http";

const GRID_GRAPHQL_ENDPOINT = "https://api-op.grid.gg/central-data/graphql";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const q = searchParams.get("q") || "";
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  const GRID_API_KEY = process.env.GRID_API_KEY;

  // If q is empty, return empty list (UI will show "Start typing...")
  if (!q.trim()) {
    return NextResponse.json(
      {
        success: true,
        source: "GRID",
        teams: [],
      },
      { status: 200 }
    );
  }

  // If no API key, return error
  if (!GRID_API_KEY || GRID_API_KEY === "YOUR_GRID_API_KEY") {
    return NextResponse.json(
      {
        success: false,
        code: "MISSING_API_KEY",
        teams: [],
      },
      { status: 503 }
    );
  }

  // Try GRID API (q is not empty and API key exists)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    // GraphQL query for teams containing the search term
    // Use documented format: teams(filter: { name: { contains: $q } })
    const query = `
      query TeamSearch($q: String!, $first: Int!) {
        teams(filter: { name: { contains: $q } }, first: $first) {
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
        query,
        variables: {
          q,
          first: limit,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await safeJson(response, "teams_query");

    // Check for GraphQL errors
    if (data.errors) {
      throw new Error(data.errors.map((e: any) => e.message).join(", "));
    }

    // Extract teams from response - ensure each team has id and name
    const teams =
      data.data?.teams?.edges
        ?.map((edge: any) => ({
          id: edge.node.id,
          name: edge.node.name,
        }))
        .filter((team: any) => team.id && team.name) || [];

    // Check for debug flag
    const debug = searchParams.get("debug") === "1";

    // Hard guard: success response MUST include source:"GRID" and valid teams
    const responseData: any = {
      success: true,
      source: "GRID",
      teams,
    };

    if (debug) {
      responseData.debug = {
        queryName: "TeamSearch",
        edgeCount: data.data?.teams?.edges?.length || 0,
        returnedCount: teams.length,
      };
    }

    return NextResponse.json(responseData, { status: 200 });
  } catch (err: any) {
    clearTimeout(timeoutId);

    // Return error instead of auto-fallback to demo
    const errorMessage = err.message || "Unknown error";
    return NextResponse.json(
      {
        success: false,
        code: "GRID_FETCH_FAILED",
        error: errorMessage.substring(0, 200),
        teams: [],
      },
      { status: 502 }
    );
  }
}
