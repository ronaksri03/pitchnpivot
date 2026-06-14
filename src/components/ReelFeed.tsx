// components/ReelFeed.tsx
// ─────────────────────────────────────────────────────────────
// Production Reel Feed. Same "Voltage" design as the preview,
// but running on real data via useReelFeed — no mock data.
//
// Mount it from a manager-only server page that passes the
// session manager's id/company and their primary open project:
//
//   <ReelFeed
//     managerId={manager.id}
//     managerCompany={manager.company}
//     primaryProjectId={openProject.id}
//   />
//
// Fonts: add Anton + Space Grotesk once in app/layout.tsx via
// next/font or a <link>. The colors below are your design tokens.
// ─────────────────────────────────────────────────────────────

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Bookmark, Send, Play, Pause, Sparkles, Github, Globe, Check, X, ArrowUpRight, Flame } from "lucide-react";
import { useReelFeed } from "@/hooks/useReelFeed";
import type { ReelTalent } from "@/lib/reelFeed";

const INK = "#0a0a0a";
const LIME = "#c8ff00";
const BONE = "#f0ece4";
const ASH = "#6b6b63";
const HEAT = "#ff3d2e";

// stable hue from id so each reel keeps a consistent ambient color
function hueFromId(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return h;
}

// build an embeddable URL from a YouTube or Loom intro link
function embedUrl(url: string | null): string | null {
  if (!url) return null;
  const yt = url.match(/(?:youtu\.be\/|v=)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1&mute=1&playsinline=1`;
  const loom = url.match(/loom\.com\/(?:share|embed)\/([\w-]+)/);
  if (loom) return `https://www.loom.com/embed/${loom[1]}?autoplay=1`;
  return null;
}

/* ── Voltage meter ──────────────────────────────────────────── */
function Voltage({ score, active, hot }: { score: number; active: boolean; hot: boolean }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!active) { setV(0); return; }
    const t = setTimeout(() => setV(score), 150);
    return () => clearTimeout(t);
  }, [active, score]);
  const col = hot ? HEAT : LIME;
  return (
    <div className="w-full">
      <div className="flex items-end justify-between mb-1">
        <span className="text-[10px] font-bold tracking-[.2em]" style={{ color: ASH }}>MATCH</span>
        <span className="flex items-baseline gap-1">
          {hot && <Flame size={13} color={HEAT} fill={HEAT} />}
          <span style={{ fontFamily: "Anton, sans-serif", fontSize: 30, lineHeight: 1, color: col }}>{active ? v : score}</span>
          <span className="text-[11px] font-bold" style={{ color: col }}>%</span>
        </span>
      </div>
      <div className="h-[6px] w-full overflow-hidden" style={{ background: "rgba(255,255,255,.1)" }}>
        <div className="h-full" style={{ width: `${active ? v : score}%`, background: col, transition: "width 1s cubic-bezier(.16,1,.3,1)", boxShadow: `0 0 12px ${col}` }} />
      </div>
    </div>
  );
}

/* ── One reel ───────────────────────────────────────────────── */
function Reel({
  person, index, total, active, onSave, onInvite, onWhy,
}: {
  person: ReelTalent;
  index: number;
  total: number;
  active: boolean;
  onSave: (id: string) => void;
  onInvite: (username: string) => void;
  onWhy: (t: ReelTalent) => Promise<string | null>;
}) {
  const [playing, setPlaying] = useState(false);
  const [invited, setInvited] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiText, setAiText] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiErr, setAiErr] = useState(false);

  const hue = hueFromId(person.id);
  const embed = embedUrl(person.introVideoUrl);
  const open = (person.availability ?? "").toLowerCase().includes("open");

  useEffect(() => { if (!active) setPlaying(false); }, [active]);

  const askWhy = useCallback(async () => {
    setAiOpen(true);
    if (aiText) return;
    setAiLoading(true); setAiErr(false);
    const reason = await onWhy(person);
    if (reason) setAiText(reason);
    else setAiErr(true);
    setAiLoading(false);
  }, [aiText, onWhy, person]);

  const doInvite = () => { setInvited(true); onInvite(person.username); };

  return (
    <section className="relative w-full shrink-0 snap-start snap-always overflow-hidden" style={{ height: "100%" }}>
      {/* canvas: real video when playing, thumbnail/gradient otherwise */}
      <div className="absolute inset-0" style={{ background: `radial-gradient(130% 120% at 78% 12%, hsl(${hue} 65% 20%) 0%, ${INK} 58%)` }}>
        {person.reelThumbUrl && !playing && (
          <img src={person.reelThumbUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
        )}
        {playing && embed && (
          <iframe src={embed} className="absolute inset-0 w-full h-full" allow="autoplay; fullscreen" style={{ border: 0 }} title={`${person.name} intro`} />
        )}
        <div className="absolute inset-0 opacity-[.07] pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,10,10,.95) 14%, transparent 52%)" }} />
      </div>

      {/* lime spine + index */}
      <div className="absolute left-0 top-0 bottom-0 w-[34px] z-10 flex flex-col items-center justify-between py-20" style={{ borderRight: "1px solid rgba(255,255,255,.07)" }}>
        <span style={{ fontFamily: "Anton, sans-serif", color: LIME, fontSize: 18, writingMode: "vertical-rl", transform: "rotate(180deg)" }}>REEL</span>
        <div className="flex flex-col items-center gap-1">
          <span style={{ fontFamily: "Anton, sans-serif", color: BONE, fontSize: 22 }}>{String(index + 1).padStart(2, "0")}</span>
          <span className="w-[1px] h-5" style={{ background: ASH }} />
          <span className="text-[11px]" style={{ color: ASH }}>{String(total).padStart(2, "0")}</span>
        </div>
      </div>

      {/* play (only when we have an embeddable video) */}
      {embed && (
        <button onClick={() => setPlaying((p) => !p)} className="absolute inset-0 grid place-items-center group" aria-label={playing ? "Pause" : "Play"}>
          <span className="grid place-items-center transition-all duration-300 group-active:scale-90" style={{ width: 78, height: 78, borderRadius: 999, background: "rgba(240,236,228,.1)", border: "1.5px solid rgba(240,236,228,.3)", opacity: playing ? 0 : 1 }}>
            {playing ? <Pause size={28} color={BONE} /> : <Play size={28} color={BONE} fill={BONE} />}
          </span>
        </button>
      )}

      {/* right rail */}
      <div className="absolute right-3 bottom-44 flex flex-col items-center gap-4 z-20">
        <button onClick={() => onSave(person.id)} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
          <span className="grid place-items-center" style={{ width: 46, height: 46, borderRadius: 14, background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)" }}>
            <Bookmark size={20} color={person.saved ? LIME : BONE} fill={person.saved ? LIME : "transparent"} />
          </span>
          <span className="text-[10px]" style={{ color: person.saved ? LIME : ASH }}>{person.saved ? "Saved" : "Save"}</span>
        </button>
        <button onClick={doInvite} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
          <span className="grid place-items-center transition-colors" style={{ width: 46, height: 46, borderRadius: 14, background: invited ? LIME : "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)" }}>
            {invited ? <Check size={21} color={INK} /> : <Send size={19} color={BONE} />}
          </span>
          <span className="text-[10px]" style={{ color: invited ? LIME : ASH }}>{invited ? "Sent" : "Invite"}</span>
        </button>
        <button onClick={askWhy} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
          <span className="grid place-items-center" style={{ width: 46, height: 46, borderRadius: 14, background: person.hot ? "rgba(255,61,46,.16)" : "rgba(200,255,0,.14)", border: `1px solid ${person.hot ? "rgba(255,61,46,.4)" : "rgba(200,255,0,.35)"}` }}>
            <Sparkles size={19} color={person.hot ? HEAT : LIME} />
          </span>
          <span className="text-[10px]" style={{ color: person.hot ? HEAT : LIME }}>Why</span>
        </button>
      </div>

      {/* info */}
      <div className="absolute left-[34px] right-16 bottom-0 pl-4 pr-2 pb-6 z-10">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {person.availability && <span className="text-[10px] font-bold tracking-[.15em] px-2 py-[3px]" style={{ background: open ? LIME : "rgba(255,255,255,.12)", color: open ? INK : BONE }}>{person.availability.toUpperCase()}</span>}
          {person.hourlyRate && <span className="text-[11px] font-bold px-2 py-[3px]" style={{ background: "rgba(255,255,255,.08)", color: BONE }}>{person.hourlyRate}</span>}
          <span className="text-[11px]" style={{ color: ASH }}>{[person.location, person.yearsExp ? `${person.yearsExp}y` : null, person.workPref].filter(Boolean).join(" · ")}</span>
        </div>

        <h2 style={{ fontFamily: "Anton, sans-serif", color: BONE, fontSize: 46, lineHeight: 0.92, letterSpacing: "-.01em", textTransform: "uppercase", marginLeft: -2 }}>{person.name}</h2>
        <p className="text-[15px] font-bold tracking-wide mt-1" style={{ color: LIME }}>{person.title}</p>

        {person.lookingFor && <p className="text-[13px] leading-snug mt-2.5 max-w-[36ch]" style={{ color: "rgba(240,236,228,.8)" }}>{person.lookingFor}</p>}

        <div className="flex flex-wrap gap-1.5 mt-3 mb-3">
          {person.skills.slice(0, 5).map((s) => {
            const h = person.sharedSkills.map((n) => n.toLowerCase()).includes(s.toLowerCase());
            return <span key={s} className="text-[11px] font-semibold px-2 py-1" style={{ background: h ? "rgba(200,255,0,.16)" : "rgba(255,255,255,.06)", color: h ? LIME : "rgba(240,236,228,.65)", border: h ? "1px solid rgba(200,255,0,.35)" : "1px solid transparent" }}>{s}</span>;
          })}
          {person.github && <span className="text-[11px] inline-flex items-center px-2 py-1" style={{ color: ASH }}><Github size={12} /></span>}
          {person.portfolio && <span className="text-[11px] inline-flex items-center px-2 py-1" style={{ color: ASH }}><Globe size={12} /></span>}
        </div>

        <Voltage score={person.matchScore} active={active} hot={person.hot} />
      </div>

      {/* AI sheet */}
      {aiOpen && (
        <div className="absolute inset-x-0 bottom-0 z-30 p-4" style={{ animation: "ppRise .35s cubic-bezier(.16,1,.3,1)" }}>
          <div className="p-4" style={{ background: "rgba(14,14,12,.92)", backdropFilter: "blur(16px)", border: `1px solid ${person.hot ? "rgba(255,61,46,.3)" : "rgba(200,255,0,.3)"}` }}>
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[.12em]" style={{ color: person.hot ? HEAT : LIME }}><Sparkles size={13} /> WHY YOU TWO CLICK</span>
              <button onClick={() => setAiOpen(false)} className="opacity-60 active:scale-90"><X size={16} color={BONE} /></button>
            </div>
            {aiLoading ? (
              <div className="flex items-center gap-2 py-1" style={{ color: ASH }}>
                <span className="inline-block w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: person.hot ? HEAT : LIME }} />
                <span className="text-[13px]">reading the room…</span>
              </div>
            ) : aiErr ? (
              <p className="text-[13px]" style={{ color: ASH }}>Matchmaker's offline. Still — the overlap on <span style={{ color: LIME }}>{person.sharedSkills.join(", ") || "their stack"}</span> makes this a strong lead.</p>
            ) : (
              <p className="text-[14.5px] leading-snug" style={{ color: BONE }}>{aiText}</p>
            )}
            <button onClick={() => { doInvite(); setAiOpen(false); }} className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 active:scale-95 transition-transform" style={{ background: LIME, color: INK }}>
              Invite to project <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ── Feed shell ─────────────────────────────────────────────── */
export default function ReelFeed({
  managerId, managerCompany, primaryProjectId,
}: {
  managerId: string;
  managerCompany: string;
  primaryProjectId: string;
}) {
  const { talent, loading, error, loadMore, toggleSave, invite, askWhy } = useReelFeed(managerId, managerCompany, primaryProjectId);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const obs = new IntersectionObserver(
      (es) => es.forEach((e) => {
        if (e.isIntersecting) {
          const idx = Number(e.target.getAttribute("data-idx"));
          setActiveIdx(idx);
          if (idx >= talent.length - 2) loadMore(); // prefetch near the end
        }
      }),
      { root, threshold: 0.6 }
    );
    root.querySelectorAll("[data-idx]").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [talent.length, loadMore]);

  if (loading && talent.length === 0)
    return <div className="grid place-items-center h-full" style={{ background: INK, color: ASH }}>Loading the feed…</div>;

  if (error)
    return <div className="grid place-items-center h-full text-center px-8" style={{ background: INK, color: BONE }}>{error}</div>;

  if (talent.length === 0)
    return (
      <div className="grid place-items-center h-full text-center px-8" style={{ background: INK }}>
        <div>
          <p style={{ fontFamily: "Anton, sans-serif", color: BONE, fontSize: 28 }}>NO REELS YET</p>
          <p className="text-[13px] mt-2" style={{ color: ASH }}>Once individuals add intro videos, they'll show up here, ranked by fit to your open projects.</p>
        </div>
      </div>
    );

  return (
    <div className="relative h-full overflow-hidden" style={{ background: INK }}>
      <style>{`
        @keyframes ppRise { from { transform: translateY(40px); opacity: 0;} to { transform: translateY(0); opacity: 1;} }
        .pp-feed::-webkit-scrollbar { display: none; }
      `}</style>
      <div ref={scrollerRef} className="pp-feed h-full overflow-y-scroll snap-y snap-mandatory" style={{ scrollbarWidth: "none" }}>
        {talent.map((p, i) => (
          <div key={p.id} data-idx={i} style={{ height: "100%" }}>
            <Reel
              person={p}
              index={i}
              total={talent.length}
              active={activeIdx === i}
              onSave={toggleSave}
              onInvite={invite}
              onWhy={askWhy}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
