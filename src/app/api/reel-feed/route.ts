// app/api/reel-feed/route.ts
// Returns the scored talent feed for the logged-in manager.
// Manager id comes from the session — never trust a client-supplied id.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getReelFeed } from "@/lib/reelFeed";

export async function GET(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const offset = Number(new URL(req.url).searchParams.get("offset") ?? 0);

  try {
    const feed = await getReelFeed(user.id, { offset, limit: 12 });
    return NextResponse.json(feed);
  } catch {
    return NextResponse.json({ error: "feed_failed" }, { status: 500 });
  }
}
