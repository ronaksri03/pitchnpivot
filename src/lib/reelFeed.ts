// lib/reelFeed.ts
// ─────────────────────────────────────────────────────────────
// Data layer for the Reel Feed (/discover, reimagined).
// Reads from your existing tables: profiles, reels, manager_projects.
// Assumes a Supabase server client at "@/lib/supabase/server"
// (the @supabase/ssr createServerClient pattern you're already using).
//
// ── One-time migration (run in Supabase SQL editor) ──────────
//
//   create table if not exists saved_talent (
//     manager_id   uuid references managers(id) on delete cascade,
//     profile_id   uuid references profiles(id) on delete cascade,
//     created_at   timestamptz default now(),
//     primary key (manager_id, profile_id)
//   );
//   alter table saved_talent enable row level security;
//   create policy "managers manage own saves" on saved_talent
//     for all using (auth.uid() = manager_id) with check (auth.uid() = manager_id);
//
//   -- optional: cache AI match lines so you don't pay per scroll
//   create table if not exists match_reasons (
//     manager_id uuid, profile_id uuid, project_id uuid,
//     reason text, score int, created_at timestamptz default now(),
//     primary key (manager_id, profile_id, project_id)
//   );
// ─────────────────────────────────────────────────────────────

import { createClient } from "@/lib/supabase/server";

export type ReelTalent = {
  id: string;
  username: string;
  name: string;
  title: string;
  location: string | null;
  workPref: string | null;
  yearsExp: number | null;
  availability: string | null;
  hourlyRate: string | null;
  skills: string[];
  lookingFor: string | null;
  github: boolean;
  portfolio: boolean;
  introVideoUrl: string | null;
  reelThumbUrl: string | null;
  // computed
  matchScore: number;
  sharedSkills: string[];
  hot: boolean;
  saved: boolean;
};

// ── Smart Match: skill overlap between a manager's open project and a talent ──
export function computeMatch(skills: string[], needs: string[]) {
  if (!needs.length) return { score: 0, shared: [] as string[] };
  const set = new Set(needs.map((s) => s.toLowerCase().trim()));
  const shared = skills.filter((s) => set.has(s.toLowerCase().trim()));
  const raw = Math.round((shared.length / needs.length) * 100);
  return { score: Math.min(99, Math.max(18, raw)), shared };
}

// ── The feed query ──────────────────────────────────────────
// managerId drives "what am I staffing for" → the match scores.
// Pulls individuals with an intro video first (video-native feed),
// excludes managers, paginates for infinite scroll.
export async function getReelFeed(
  managerId: string,
  { limit = 12, offset = 0 }: { limit?: number; offset?: number } = {}
): Promise<ReelTalent[]> {
  const supabase = createClient();

  // 1. what the manager is hiring for → union of required_skills on open projects
  const { data: projects } = await supabase
    .from("manager_projects")
    .select("required_skills")
    .eq("manager_id", managerId)
    .eq("status", "open");

  const needs = Array.from(
    new Set((projects ?? []).flatMap((p) => (p.required_skills as string[]) ?? []))
  );

  // 2. talent: individuals with a reel/intro video, newest active first
  const { data: rows, error } = await supabase
    .from("profiles")
    .select(
      `id, username, name, job_title, location, work_pref, years_exp,
       availability, hourly_rate, skills, looking_for, github_url,
       portfolio_url, intro_video_url,
       reels ( thumbnail_url )`
    )
    .not("intro_video_url", "is", null)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  // 3. which of these has the manager already saved
  const ids = (rows ?? []).map((r) => r.id);
  const { data: saves } = await supabase
    .from("saved_talent")
    .select("profile_id")
    .eq("manager_id", managerId)
    .in("profile_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  const savedSet = new Set((saves ?? []).map((s) => s.profile_id));

  // 4. shape + score
  return (rows ?? []).map((r): ReelTalent => {
    const skills = (r.skills as string[]) ?? [];
    const { score, shared } = computeMatch(skills, needs);
    return {
      id: r.id,
      username: r.username,
      name: r.name,
      title: r.job_title ?? "",
      location: r.location,
      workPref: r.work_pref,
      yearsExp: r.years_exp,
      availability: r.availability,
      hourlyRate: r.hourly_rate,
      skills,
      lookingFor: r.looking_for,
      github: !!r.github_url,
      portfolio: !!r.portfolio_url,
      introVideoUrl: r.intro_video_url,
      reelThumbUrl: (r.reels as { thumbnail_url: string }[])?.[0]?.thumbnail_url ?? null,
      matchScore: score,
      sharedSkills: shared,
      hot: score >= 75,
      saved: savedSet.has(r.id),
    };
  });
}

// ── Save / unsave (RLS guards ownership) ────────────────────
export async function toggleSave(managerId: string, profileId: string, save: boolean) {
  const supabase = createClient();
  if (save) {
    return supabase.from("saved_talent").upsert({ manager_id: managerId, profile_id: profileId });
  }
  return supabase.from("saved_talent").delete().match({ manager_id: managerId, profile_id: profileId });
}

// ── Invite to a project (reuses your assigned_to_username flow) ──
export async function inviteToProject(projectId: string, username: string) {
  const supabase = createClient();
  return supabase
    .from("manager_projects")
    .update({ assigned_to_username: username })
    .eq("id", projectId);
}
