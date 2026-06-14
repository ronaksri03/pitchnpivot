// app/api/match-reason/route.ts
// ─────────────────────────────────────────────────────────────
// AI "why you two click" explainer. Runs server-side so the
// Anthropic key never reaches the browser. Caches into
// match_reasons so you pay once per (manager, talent, project),
// not once per scroll.
//
//   .env.local →  ANTHROPIC_API_KEY=sk-ant-...
// ─────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

type Body = {
  managerId: string;
  projectId: string;
  managerCompany: string;
  needs: string[];
  talent: {
    id: string;
    name: string;
    title: string;
    yearsExp: number | null;
    skills: string[];
    lookingFor: string | null;
    sharedSkills: string[];
  };
};

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const { managerId, projectId, talent } = body;
  const supabase = createClient();

  // 1. cache hit?
  const { data: cached } = await supabase
    .from("match_reasons")
    .select("reason")
    .match({ manager_id: managerId, profile_id: talent.id, project_id: projectId })
    .maybeSingle();
  if (cached?.reason) return NextResponse.json({ reason: cached.reason, cached: true });

  // 2. generate
  const prompt = `You are the matchmaking voice of a Gen Z talent platform, pitchNpivot. In ONE punchy sentence (max 22 words, no emoji, no quotes), tell a hiring manager at "${body.managerCompany}" why this person is worth a DM. Be specific and a little bold, never corporate.
Staffing for: ${body.needs.join(", ")}.
Talent: ${talent.name}, ${talent.title}, ${talent.yearsExp ?? "?"}y. Skills: ${talent.skills.join(", ")}. They say: "${talent.lookingFor ?? ""}". Overlap: ${talent.sharedSkills.join(", ") || "adjacent"}.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 120,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json();
    const reason: string = (data.content ?? [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join(" ")
      .trim()
      .replace(/^["']|["']$/g, "");

    // 3. cache (fire-and-forget)
    if (reason) {
      void supabase.from("match_reasons").upsert({
        manager_id: managerId,
        profile_id: talent.id,
        project_id: projectId,
        reason,
      });
    }
    return NextResponse.json({ reason: reason || null });
  } catch {
    return NextResponse.json({ reason: null, error: "matchmaker_unavailable" }, { status: 200 });
  }
}
