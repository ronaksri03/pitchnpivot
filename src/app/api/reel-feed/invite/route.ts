// app/api/reel-feed/invite/route.ts
// Assign one of the manager's own projects to a talent (by username).
// Ownership is checked here AND enforced by RLS — defense in depth.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { inviteToProject } from "@/lib/reelFeed";

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { projectId, username } = (await req.json()) as { projectId: string; username: string };
  if (!projectId || !username)
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });

  // confirm the project actually belongs to this manager before assigning
  const { data: proj } = await supabase
    .from("manager_projects")
    .select("id")
    .eq("id", projectId)
    .eq("manager_id", user.id)
    .maybeSingle();
  if (!proj) return NextResponse.json({ error: "not_your_project" }, { status: 403 });

  const { error } = await inviteToProject(projectId, username);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
