import { NextRequest, NextResponse } from "next/server";
import demoData from "../../../../public/demo-data.json";

const GRID_GRAPHQL_ENDPOINT = "https://api-op.grid.gg/central-data/graphql";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const q = searchParams.get("q") || "";
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  const GRID_API_KEY = process.env.GRID_API_KEY;

  // Helper to get demo teams
  const getDemoTeams = () => {
    const teamKeys = Object.keys(demoData.teams);
    if (!q) {
      // Return default demo teams when q is empty
      return teamKeys.slice(0, Math.min(limit, teamKeys.length)).map((key) => ({
        name: demoData.teams[key as keyof typeof demoData.teams].teamName,
      }));
    }
    // Filter demo teams by query
    return teamKeys
      .filter((key) => {
        const team = demoData.teams[key as keyof typeof demoData.teams];
        return team.teamName.toLowerCase().includes(q.toLowerCase());
      })
      .slice(0, limit)
      .map((key) => ({
        name: demoData.teams[key as keyof typeof demoData.teams].teamName,
      }));
  };

  // If q is empty, always return demo teams (so dropdown shows something on focus)
  if (!q) {
    return NextResponse.json(
      {
        success: true,
        source: "Demo",
        teams: getDemoTeams(),
      },
      { status: 200 }
    );
  }

  // If no API key, return filtered demo teams
  if (!GRID_API_KEY || GRID_API_KEY === "YOUR_GRID_API_KEY") {
    return NextResponse.json(
      {
        success: true,
        source: "Demo",
        teams: getDemoTeams(),
      },
      { status: 200 }
    );
  }

  // Try GRID API (q is not empty and API key exists)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    // GraphQL query for teams containing the search term
    const query = `
      query TeamSearch($search: String!, $first: Int!) {
        teams(filter: { name: { contains: $search } }, first: $first) {
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
          search: q,
          first: limit,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // Check for GraphQL errors
    if (data.errors) {
      throw new Error(data.errors.map((e: any) => e.message).join(", "));
    }

    // Extract teams from response
    const teams =
      data.data?.teams?.edges?.map((edge: any) => ({
        id: edge.node.id,
        name: edge.node.name,
      })) || [];

    return NextResponse.json(
      {
        success: true,
        source: "GRID",
        teams,
      },
      { status: 200 }
    );
  } catch (err: any) {
    clearTimeout(timeoutId);

    // Fallback to demo teams on any error
    return NextResponse.json(
      {
        success: true,
        source: "Demo",
        teams: getDemoTeams(),
      },
      { status: 200 }
    );
  }
}
