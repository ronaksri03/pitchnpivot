// hooks/useReelFeed.ts
// ─────────────────────────────────────────────────────────────
// Client hook the <ReelFeed/> component consumes. Loads the feed,
// supports infinite scroll, and exposes save / invite / askWhy.
// Server data comes from a thin route handler that calls
// getReelFeed() from lib/reelFeed.ts.
// ─────────────────────────────────────────────────────────────

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReelTalent } from "@/lib/reelFeed";

type FeedState = {
  talent: ReelTalent[];
  loading: boolean;
  error: string | null;
};

export function useReelFeed(managerId: string, managerCompany: string, primaryProjectId: string) {
  const [state, setState] = useState<FeedState>({ talent: [], loading: true, error: null });
  const offset = useRef(0);
  const done = useRef(false);

  const load = useCallback(async () => {
    if (done.current) return;
    try {
      const res = await fetch(`/api/reel-feed?offset=${offset.current}`);
      const page: ReelTalent[] = await res.json();
      if (page.length === 0) done.current = true;
      offset.current += page.length;
      setState((s) => ({ ...s, talent: [...s.talent, ...page], loading: false }));
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: "Couldn't load the feed. Pull to retry." }));
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // optimistic save
  const toggleSave = useCallback(async (profileId: string) => {
    let next = false;
    setState((s) => ({
      ...s,
      talent: s.talent.map((t) => {
        if (t.id !== profileId) return t;
        next = !t.saved;
        return { ...t, saved: next };
      }),
    }));
    await fetch("/api/reel-feed/save", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ profileId, save: next }),
    });
  }, []);

  // invite → assigns the manager's primary open project to this talent
  const invite = useCallback(async (username: string) => {
    await fetch("/api/reel-feed/invite", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ projectId: primaryProjectId, username }),
    });
  }, [primaryProjectId]);

  // AI explainer (cached server-side)
  const askWhy = useCallback(async (t: ReelTalent): Promise<string | null> => {
    const res = await fetch("/api/match-reason", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        managerId,
        projectId: primaryProjectId,
        managerCompany,
        needs: t.sharedSkills.length ? t.sharedSkills : t.skills,
        talent: {
          id: t.id, name: t.name, title: t.title, yearsExp: t.yearsExp,
          skills: t.skills, lookingFor: t.lookingFor, sharedSkills: t.sharedSkills,
        },
      }),
    });
    const data = await res.json();
    return data.reason ?? null;
  }, [managerId, managerCompany, primaryProjectId]);

  return { ...state, loadMore: load, toggleSave, invite, askWhy };
}
