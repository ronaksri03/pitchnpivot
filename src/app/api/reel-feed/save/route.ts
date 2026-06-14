// app/api/reel-feed/save/route.ts
// Save or unsave a talent for the logged-in manager.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { toggleSave } from "@/lib/reelFeed";

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { profileId, save } = (await req.json()) as { profileId: string; save: boolean };
  if (!profileId) return NextResponse.json({ error: "missing_profile" }, { status: 400 });

  const { error } = await toggleSave(user.id, profileId, save);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
