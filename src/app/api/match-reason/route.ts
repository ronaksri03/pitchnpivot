// app/api/match-reason/route.ts
// ─────────────────────────────────────────────────────────────
// Rule-based "why you two click" explainer.
// No external API, no key needed — runs entirely on edge logic.
// Generates a punchy match line from skill overlap, experience,
// availability, and the talent's own "looking for" statement.
// ─────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";

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

// ── Template banks keyed by match tier ──────────────────────
const HOT_LINES = [
  (name: string, shared: string[], company: string) =>
    `${name} covers ${shared.slice(0, 2).join(" and ")} — exactly what ${company} is hiring for right now.`,
  (name: string, shared: string[], _company: string) =>
    `Rare overlap on ${shared.slice(0, 3).join(", ")} — ${name} checks every hard requirement on the list.`,
  (name: string, shared: string[], company: string) =>
    `${name}'s stack is a direct match to ${company}'s open brief — this one's worth a same-day DM.`,
  (name: string, shared: string[], _company: string) =>
    `${shared.length} out of ${shared.length} skills align — ${name} isn't adjacent, they're exact.`,
];

const WARM_LINES = [
  (name: string, shared: string[], _company: string) =>
    `${name} brings ${shared[0] ?? "the right foundation"} — strong overlap with room to grow into the rest.`,
  (name: string, shared: string[], company: string) =>
    `Solid fit on ${shared.slice(0, 2).join(" and ")} — ${name} could own that part of ${company}'s stack.`,
  (name: string, shared: string[], _company: string) =>
    `${name} covers the hardest skill on the list — ${shared[0] ?? "the core requirement"} — that's the one that matters.`,
  (name: string, _shared: string[], company: string) =>
    `Not every box, but the right boxes — ${name} fits the core of what ${company} needs.`,
];

const COLD_LINES = [
  (name: string, _shared: string[], _company: string) =>
    `${name}'s background is adjacent — a quick conversation could surface more overlap than the profile shows.`,
  (name: string, _shared: string[], company: string) =>
    `Low direct overlap, but ${name}'s trajectory points straight toward what ${company} is building.`,
  (name: string, _shared: string[], _company: string) =>
    `Different stack, strong instincts — ${name} is the kind of hire that grows into the role fast.`,
];

const EXP_ADDONS = [
  (years: number) => `${years} years means they've shipped this before, not just studied it.`,
  (years: number) => `With ${years} years on the tools, there's no ramp-up cost here.`,
  (years: number) => `${years} years of real-world reps — they know where things break.`,
];

const AVAIL_ADDONS = [
  () => `Available now — no waiting on notice periods.`,
  () => `Open immediately — you could have them in a kickoff this week.`,
];

// ── Pick a deterministic-but-varied line ────────────────────
function pick<T>(arr: T[], seed: string): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffff;
  return arr[h % arr.length];
}

function buildReason(body: Body): string {
  const { talent, managerCompany, needs } = body;
  const { name, sharedSkills, yearsExp, lookingFor, id } = talent;
  const score = needs.length
    ? Math.round((sharedSkills.length / needs.length) * 100)
    : 0;

  // seed from talent id so same person always gets same line
  let base: string;
  if (score >= 75) {
    base = pick(HOT_LINES, id)(name, sharedSkills, managerCompany);
  } else if (score >= 40) {
    base = pick(WARM_LINES, id)(name, sharedSkills, managerCompany);
  } else {
    base = pick(COLD_LINES, id)(name, sharedSkills, managerCompany);
  }

  // optionally append an experience or availability note
  const extras: string[] = [];
  if (yearsExp && yearsExp >= 3) {
    extras.push(pick(EXP_ADDONS, id + "exp")(yearsExp));
  }
  const openNow = (lookingFor ?? "").toLowerCase().includes("open") ||
    (talent.lookingFor ?? "").toLowerCase().includes("now");
  if (openNow) {
    extras.push(pick(AVAIL_ADDONS, id + "avail")());
  }

  // keep it to one punchy sentence max — only add an extra if base is short
  const addon = extras[0] ?? "";
  const full = addon && base.length < 80 ? `${base} ${addon}` : base;
  return full;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const reason = buildReason(body);
    return NextResponse.json({ reason });
  } catch {
    return NextResponse.json({ reason: "Skills line up — this one's worth a look." });
  }
}
