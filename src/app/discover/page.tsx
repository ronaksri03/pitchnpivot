// src/app/discover/page.tsx
// ─────────────────────────────────────────────────────────────
// /discover — replaced with the Voltage reel feed.
// Managers get the full-screen swipeable talent experience.
// Individuals and guests are redirected (same logic as before).
// ─────────────────────────────────────────────────────────────

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ReelFeed from "@/components/ReelFeed";

export default async function DiscoverPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // guests can view but won't get match scoring (no manager context)
  // individuals are redirected to their profile
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    // if they have an individual profile, send them away
    if (profile) redirect("/profile");
  }

  // get manager context for match scoring
  let managerId = "";
  let managerCompany = "";
  let primaryProjectId = "";

  if (user) {
    const { data: manager } = await supabase
      .from("managers")
      .select("id, company")
      .eq("id", user.id)
      .maybeSingle();

    if (manager) {
      managerId = manager.id;
      managerCompany = manager.company ?? "your company";

      // pick their most recently created open project for match scoring
      const { data: project } = await supabase
        .from("manager_projects")
        .select("id")
        .eq("manager_id", manager.id)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      primaryProjectId = project?.id ?? "";
    }
  }

  return (
    <main className="h-screen w-full overflow-hidden" style={{ background: "#0a0a0a" }}>
      <ReelFeed
        managerId={managerId}
        managerCompany={managerCompany}
        primaryProjectId={primaryProjectId}
      />
    </main>
  );
}
