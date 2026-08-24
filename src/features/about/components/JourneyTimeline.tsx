import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";
import type { SyntheticEvent } from "react";

import { preferWebp } from "@/shared/bodyImages";
import { useReducedMotion } from "@/shared/motion";
import { SCROLL_SPEED } from "@/shared/motion/scrollSpeed";
import { CHAPTER_ACCENTS, NOIR } from "@/shared/theme/palette";
import { FONT } from "@/shared/theme/theme";

gsap.registerPlugin(ScrollTrigger);

// A 480vh horizontal-scroll pinned section on the brand navy ground, with a
// cursor-following gold "string" canvas whose per-year dots travel with scroll,
// scattered polaroid photos, colored dots, and a bottom year-nav + progress bar.

// ── Responsive hook ────────────────────────────────────────────────────────
function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => {
      setMobile(window.innerWidth < 768);
    };
    check();
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("resize", check);
    };
  }, []);
  return mobile;
}

// ── Data ───────────────────────────────────────────────────────────────────
// Most `images` entries below are hotlinked straight from the legacy WordPress
// blog (https://phitopolis.com/blog/wp-content/uploads/...) rather than served
// from this app's own /public. If that WordPress install is ever decommissioned,
// every one of those URLs starts 404ing and the About page's centerpiece timeline
// goes blank. These MUST be downloaded and mirrored into public/ (e.g. alongside
// the already-local /2020/1.webp, /2020/2.jpg) before that happens — see the
// content-audit report for the full URL list (~26 images across 2019, 2021-2026;
// 2020 is already local).
interface Chapter {
  num: string;
  id: string;
  tag: string;
  title: string;
  sub: string;
  color: string;
  images: string[];
  body: string;
}

const CHAPTERS: Chapter[] = [
  {
    num: "2019",
    id: "sec-ch0a",
    tag: "The Beginning",
    title: "Where it all started",
    sub: "Where it all started",
    color: CHAPTER_ACCENTS["2019"]!,
    images: [
      "/images/timeline/Cheers-1024x683.jpg",
      "/images/timeline/Mgmt-1024x683.jpg",
      "/images/timeline/karaoke-1024x683.jpg",
    ],
    body: "Phitopolis was founded, establishing a top-tier tech R&D firm in Manila with backing from global investors. A small but focused team set out to prove that engineering at this level could be built right here",
  },
  {
    num: "2020",
    id: "sec-ch0b",
    tag: "Pandemic",
    title: "Pandemic",
    sub: "Adapting under pressure",
    color: CHAPTER_ACCENTS["2020"]!,
    images: ["/2020/1.webp", "/2020/2.jpg"],
    body: "Transitioned our technical team to strategic remote work setups to ensure safety and continuity. The disruption forced us to rethink how distributed teams collaborate - and we came out stronger for it",
  },
  {
    num: "2021",
    id: "sec-ch1",
    tag: "New Normal",
    title: "Adjusting to the new normal",
    sub: "Distributed, but never disconnected",
    color: CHAPTER_ACCENTS["2021"]!,
    images: [
      "/images/timeline/Image-from-iOS-4-768x576.jpg",
      "/images/timeline/Image-from-iOS-8-768x1024.jpg",
      "/images/timeline/DSCF0257-768x512.jpg",
      "/images/timeline/Image-from-iOS-7-768x1024.jpg",
    ],
    body: "Solidified our distributed workflow while continuing to provide fascinating work and reliable support for our global clients. Culture and quality remained non-negotiable, regardless of where the team sat",
  },
  {
    num: "2022",
    id: "sec-ch2",
    tag: "Momentum",
    title: "Gaining momentum",
    sub: "Engineering at scale",
    color: CHAPTER_ACCENTS["2022"]!,
    images: [
      "/images/timeline/Image-from-iOS-21-768x576.jpg",
      "/images/timeline/Image-from-iOS-33-1-768x512.jpg",
      "/images/timeline/Image-from-iOS-1-768x576.jpg",
    ],
    body: "Expanded our teams in Manila and strengthened our core engineering capabilities as global demand for tech solutions surged. New practices, new hires, and a growing appetite for harder problems",
  },
  {
    num: "2023",
    id: "sec-ch3",
    tag: "Acceleration",
    title: "Accelerating the mission",
    sub: "Deeper, faster, further",
    color: CHAPTER_ACCENTS["2023"]!,
    images: [
      "/images/timeline/46E1B7F6-6580-4DCC-AB2A-C3E634F57080-2-2048x2048.jpg",
      "/images/timeline/IMG_9159-1-1-2048x1336.jpg",
      "/images/timeline/IMG_1945-1-1-2048x1536.jpg",
      "/images/timeline/IMG_5547-2-2048x1536.jpg",
    ],
    body: "Scaled operations and integrated more advanced technologies into our development and research pipelines to meet growing client needs. The work got harder - and the team rose to match it",
  },
  {
    num: "2024",
    id: "sec-ch4",
    tag: "New Heights",
    title: "Reaching new heights",
    sub: "Milestones that matter",
    color: CHAPTER_ACCENTS["2024"]!,
    images: [
      "/images/timeline/hike-with-mike-blog-1.jpg",
      "/images/timeline/group-pic-final-2048x1687.jpg",
      "/images/timeline/2Q-CSR_001-min-1-2048x1536.png",
      "/images/timeline/HPC-With-Tom_001.png",
    ],
    body: "Achieved major milestones in project deliveries and significantly grew our workforce, firmly establishing our reputation. Five years in, Phitopolis had become the partner clients came back to",
  },
  {
    num: "2025",
    id: "sec-ch5",
    tag: "Expansion",
    title: "Expansion",
    sub: "New frontiers, new possibilities",
    color: CHAPTER_ACCENTS["2025"]!,
    images: [
      "/images/timeline/image8.png",
      "/images/timeline/DLSU-Job-Expo_001.png",
      "/images/timeline/05-2025_Enrique_Summer_Outing-7049.jpeg-2048x1536.jpg",
      "/images/timeline/3029999c-3cc5-4a42-8e66-c1d181babbc3.png",
    ],
    body: "Broadened our market presence and explored new technological frontiers, laying the groundwork for substantial future scale. The pipeline of ideas grew as fast as the team delivering them",
  },
  {
    num: "2026",
    id: "sec-ch6",
    tag: "AI Day",
    title: "New challenges, the work continues",
    sub: "Tomorrow's technology, available today",
    color: CHAPTER_ACCENTS["2026"]!,
    images: [
      "/images/timeline/5-2048x870.jpg",
      "/images/timeline/Image-2-2048x1536.jpg",
      "/images/timeline/Jogging-768x539.jpg",
      "/images/timeline/3-768x485.png",
    ],
    body: "Looking ahead with a renewed commitment to making tomorrow's technology available today through relentless innovation. The mission is clearer than ever - and the best work is still ahead of us",
  },
];

interface ScatterPos {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  width: string;
  rotate: string;
  zIndex: number;
}

// Unique scatter layouts per year — desktop polaroid placement. Each array maps
// positionally to that chapter's images[0..3].
const CHAPTER_SCATTER: Record<string, ScatterPos[]> = {
  "2019": [
    { top: "-2%", left: "48%", width: "36%", rotate: "-7deg", zIndex: 2 },
    { top: "20%", right: "2%", width: "34%", rotate: "6deg", zIndex: 3 },
    { bottom: "2%", left: "50%", width: "38%", rotate: "-3deg", zIndex: 1 },
  ],
  "2020": [
    { top: "4%", left: "46%", width: "44%", rotate: "-9deg", zIndex: 2 },
    { top: "18%", right: "0%", width: "44%", rotate: "7deg", zIndex: 3 },
  ],
  "2021": [
    { top: "14%", left: "46%", width: "30%", rotate: "-4deg", zIndex: 2 },
    { top: "-4%", right: "4%", width: "24%", rotate: "9deg", zIndex: 3 },
    { bottom: "8%", left: "50%", width: "27%", rotate: "-8deg", zIndex: 1 },
    { bottom: "-3%", right: "9%", width: "22%", rotate: "6deg", zIndex: 3 },
  ],
  "2022": [
    { top: "0%", left: "46%", width: "36%", rotate: "-10deg", zIndex: 1 },
    { top: "22%", left: "54%", width: "38%", rotate: "-1deg", zIndex: 2 },
    { bottom: "3%", right: "2%", width: "36%", rotate: "8deg", zIndex: 3 },
  ],
  "2023": [
    { top: "4%", left: "46%", width: "32%", rotate: "-21deg", zIndex: 1 },
    { top: "14%", left: "54%", width: "30%", rotate: "-7deg", zIndex: 2 },
    { top: "24%", left: "61%", width: "27%", rotate: "6deg", zIndex: 3 },
    { top: "34%", right: "2%", width: "23%", rotate: "20deg", zIndex: 4 },
  ],
  "2024": [
    { top: "14%", left: "46%", width: "36%", rotate: "-3deg", zIndex: 1 },
    { top: "4%", left: "55%", width: "29%", rotate: "14deg", zIndex: 2 },
    { top: "36%", left: "48%", width: "27%", rotate: "-16deg", zIndex: 3 },
    { top: "10%", right: "2%", width: "25%", rotate: "8deg", zIndex: 4 },
  ],
  "2025": [
    { top: "-6%", left: "46%", width: "27%", rotate: "-7deg", zIndex: 2 },
    { top: "28%", right: "4%", width: "32%", rotate: "10deg", zIndex: 1 },
    { bottom: "10%", left: "48%", width: "25%", rotate: "-11deg", zIndex: 3 },
    { bottom: "-5%", right: "14%", width: "26%", rotate: "3deg", zIndex: 2 },
  ],
  "2026": [
    { top: "6%", left: "46%", width: "34%", rotate: "-5deg", zIndex: 2 },
    { top: "38%", right: "3%", width: "29%", rotate: "8deg", zIndex: 3 },
    { bottom: "4%", left: "50%", width: "31%", rotate: "-3deg", zIndex: 1 },
    { top: "-3%", right: "5%", width: "18%", rotate: "15deg", zIndex: 4 },
  ],
};

// ── Fallback for failed images ──────────────────────────────────────────────
// Used to rewrite a failed ".jpg" to ".svg" on the *same* external WordPress
// host — which is still unreachable if that host is gone, so it just traded
// one dead request for a second one — and did nothing at all for the ".png"
// URLs above, which stayed visibly broken. Now any failed extension degrades
// once to a hidden element (an empty polaroid frame) instead of firing a
// second network request against a host that may no longer exist.
/**
 * Two-stage fallback, because these `src`s are rewritten to `.webp` by
 * `preferWebp` at render time (see `TimelinePhoto`/`StaticJourneyImage`).
 *
 * Stage 1 — retry the original raster. Every timeline photo has a WebP twin
 * today (26/26, converted 2026-08-23), but the rewrite is a *convention*, not a
 * guarantee: a photo added later without running the conversion would 404 its
 * `.webp` and, under the previous version of this handler, silently vanish.
 * Falling back to the path actually committed to the repo turns that into a
 * slower image rather than a missing one.
 *
 * Stage 2 — hide, as before, if the original is missing too (the genuinely
 * broken case this function was originally written for).
 */
function handleImgError(event: SyntheticEvent<HTMLImageElement>): void {
  const el = event.currentTarget;
  const fallback = el.dataset.fallbackSrc;
  if (fallback && el.dataset.triedFallback !== "1") {
    el.dataset.triedFallback = "1";
    el.src = fallback;
    return;
  }
  if (el.dataset.brokenImage === "1") return; // already handled — don't loop
  el.dataset.brokenImage = "1";
  el.style.display = "none";
}

// ── FLOATING STRING — cursor-following gold string + traveling year dots ────
function FloatingString({
  years,
  scrollProgressRef,
}: {
  years: string[];
  scrollProgressRef: { current: number };
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let visible = true;
    let rawCursorY = window.innerHeight / 2;
    let springY = window.innerHeight / 2;
    let springVel = 0;
    let idlePhase = 0;
    let lastMoveTime = performance.now();

    // Ring buffer
    const HISTORY = 180;
    const TRAVEL_FRAMES = 36;
    const cursorHistory = new Float32Array(HISTORY).fill(0);
    let histHead = 0;

    // Per-year smooth dot progresses (1 = right end, 0 = left end)
    const N = years.length;
    const chapterSpan = 1 / Math.max(1, N - 1);
    const smoothProgresses = new Float32Array(N).fill(1);
    const entryTimes = new Array<number>(N).fill(-1);

    const onMouseMove = (e: MouseEvent) => {
      rawCursorY = e.clientY;
      lastMoveTime = performance.now();
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    // Cached so the frame loop never reads layout. `canvas.offsetWidth/offsetHeight`
    // and `window.innerHeight` used to be read on every single frame, forcing a
    // synchronous reflow 60 times a second for the whole 480vh of the About page.
    let cssW = 0;
    let cssH = 0;
    let viewportH = window.innerHeight;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      cssW = canvas.offsetWidth;
      cssH = canvas.offsetHeight;
      viewportH = window.innerHeight;
      canvas.width = cssW * dpr;
      canvas.height = cssH * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    // Debounced: the raw event fires continuously during a window drag, and each
    // call reallocates the canvas backing store.
    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 120);
    };

    const sampleY = (tp: number, centerY: number) => {
      const delay = (1 - tp) * TRAVEL_FRAMES;
      const dFloor = Math.floor(delay);
      const dFrac = delay - dFloor;
      const iA = (histHead - 1 - dFloor + HISTORY * 4) % HISTORY;
      const iB = (histHead - 1 - dFloor - 1 + HISTORY * 4) % HISTORY;
      const disp = (cursorHistory[iA] ?? 0) * (1 - dFrac) + (cursorHistory[iB] ?? 0) * dFrac;
      const taper = 0.2 + 0.8 * tp;
      return centerY + disp * taper;
    };

    const draw = () => {
      const w = cssW;
      const h = cssH;
      ctx.clearRect(0, 0, w, h);

      const idleElapsed = performance.now() - lastMoveTime;
      const idleFactor = Math.min(1, Math.max(0, (idleElapsed - 800) / 600));
      idlePhase += 0.022;
      const idleOffset = Math.sin(idlePhase) * 100 * idleFactor;

      springVel += (rawCursorY + idleOffset - springY) * 0.055;
      springVel *= 0.82;
      springY += springVel;
      const displace = ((springY - viewportH / 2) / (viewportH / 2)) * h * 0.42;
      cursorHistory[histHead] = displace;
      histHead = (histHead + 1) % HISTORY;

      const centerY = h / 2;
      const segments = 120;
      const dotR = 3;
      const stringW = w * 0.75 - dotR;

      const leftDisplace = (cursorHistory[(histHead - 1 - TRAVEL_FRAMES + HISTORY * 4) % HISTORY] ?? 0) * 0.2;
      ctx.beginPath();
      ctx.moveTo(0, centerY + leftDisplace);
      let lastY = centerY + leftDisplace;
      for (let i = 1; i <= segments; i++) {
        const progress = i / segments;
        const x = progress * stringW;
        const delay = (1 - progress) * TRAVEL_FRAMES;
        const dFloor = Math.floor(delay);
        const dFrac = delay - dFloor;
        const idxA = (histHead - 1 - dFloor + HISTORY * 4) % HISTORY;
        const idxB = (histHead - 1 - dFloor - 1 + HISTORY * 4) % HISTORY;
        const cDisp = (cursorHistory[idxA] ?? 0) * (1 - dFrac) + (cursorHistory[idxB] ?? 0) * dFrac;
        const taper = 0.2 + 0.8 * progress;
        lastY = centerY + cDisp * taper;
        ctx.lineTo(x, lastY);
      }
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(stringW, lastY, dotR, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fill();

      const scrollProg = scrollProgressRef.current;
      ctx.font = `bold 13px ${FONT}`;
      ctx.textBaseline = "bottom";

      for (let i = 0; i < N; i++) {
        // Dot i must ARRIVE (tp -> 0) exactly when the page turns to year[i],
        // which happens at progress i/(N-1) (see the label-swap tl.call
        // above). Starting its journey a whole chapterSpan earlier — at
        // (i-1)/(N-1) instead of i/(N-1) — keeps the two in sync; the old
        // i*chapterSpan start made every arrival land one year late.
        const chapterStart = (i - 1) * chapterSpan;
        const localProg = Math.max(0, Math.min(1, (scrollProg - chapterStart) / chapterSpan));
        const target = 1 - localProg;

        if (scrollProg < chapterStart - 0.001) {
          smoothProgresses[i] = 1;
          entryTimes[i] = -1;
          continue;
        }

        const entered = entryTimes[i] ?? -1;
        const entryStart = entered < 0 ? performance.now() : entered;
        entryTimes[i] = entryStart;
        const entryAlpha = Math.min(1, (performance.now() - entryStart) / 300);

        const cur = smoothProgresses[i] ?? 1;
        const lerpRate = target > cur ? 0.1 : 0.04;
        const tp = cur + (target - cur) * lerpRate;
        smoothProgresses[i] = tp;
        const travelX = tp * stringW;
        const travelY = sampleY(tp, centerY);

        const alpha = Math.min(tp / 0.12, 1) * entryAlpha;
        if (alpha < 0.01) continue;

        ctx.beginPath();
        ctx.arc(travelX, travelY, dotR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${NOIR.navyFieldRgb},${alpha.toFixed(3)})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${NOIR.goldRgb},${alpha.toFixed(3)})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = `rgba(${NOIR.goldRgb},${(0.9 * alpha).toFixed(3)})`;
        const yr = years[i] ?? "";
        const lw = ctx.measureText(yr).width;
        ctx.fillText(yr, travelX - lw / 2, travelY - dotR - 4);
      }

      raf = visible && !document.hidden ? requestAnimationFrame(draw) : 0;
    };

    const start = () => {
      if (raf === 0 && visible && !document.hidden) raf = requestAnimationFrame(draw);
    };
    const stop = () => {
      if (raf !== 0) { cancelAnimationFrame(raf); raf = 0; }
    };

    // The spring physics, 180-slot ring buffer and per-year ctx.measureText used to
    // run at 60fps for the entire 480vh About page, on- or off-screen, and kept
    // running in a backgrounded tab. Now it only animates while actually visible.
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        visible = entry.isIntersecting;
        if (visible) start(); else stop();
      },
      { threshold: 0.02 },
    );
    observer.observe(canvas);

    const onVisibility = () => { if (document.hidden) stop(); else start(); };
    document.addEventListener("visibilitychange", onVisibility);

    resize();
    draw();
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      stop();
      window.clearTimeout(resizeTimer);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [years, scrollProgressRef]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 3,
      }}
    />
  );
}

// ── SECTION BADGE ──────────────────────────────────────────────────────────
function Badge({ n, label }: { n: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
      <span style={{ color: NOIR.gold, fontFamily: FONT, fontWeight: 700, fontSize: 11, letterSpacing: "0.2em" }}>
        {n}
      </span>
      <div style={{ width: 36, height: 1, background: NOIR.gold }} />
      <span style={{ color: "var(--text-2)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: FONT }}>
        {label}
      </span>
    </div>
  );
}

// ── SCATTERED POLAROID PHOTO ───────────────────────────────────────────────
function ScatterPhoto({ src, alt, pos }: { src: string; alt: string; pos: ScatterPos }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => {
        setHovered(true);
      }}
      onMouseLeave={() => {
        setHovered(false);
      }}
      style={{
        position: "absolute",
        top: pos.top,
        bottom: pos.bottom,
        left: pos.left,
        right: pos.right,
        width: pos.width,
        aspectRatio: "4 / 3",
        borderRadius: 8,
        border: `3px solid rgba(255,255,255,${hovered ? 1 : 0.82})`,
        boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
        overflow: "hidden",
        transform: `rotate(${pos.rotate})`,
        zIndex: pos.zIndex,
        transition: "border-color 0.15s ease",
        cursor: "pointer",
        pointerEvents: "auto",
        willChange: "transform",
      }}
    >
      {/* preferWebp: the committed paths are .jpg/.png; every one has a WebP
          twin (9.9MB -> 5.3MB across the 26 timeline photos). data-fallback-src
          is what handleImgError retries if a twin is ever missing. */}
      <img decoding="async" loading="lazy"
        src={preferWebp(src)}
        data-fallback-src={src}
        alt={alt}
        onError={handleImgError}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </div>
  );
}

// ── Reduced-motion fallback: a simple static vertical stack ─────────────────
function StaticJourneyImage({ src, title }: { src: string; title: string }) {
  return (
    <div 
      style={{ 
        aspectRatio: "4/3", maxWidth: 360, borderRadius: 10, overflow: "hidden", 
        border: "2px solid rgba(255,255,255,0.7)",
      }}>
      <img decoding="async" loading="lazy" src={preferWebp(src)} data-fallback-src={src} alt={title} onError={handleImgError} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
    </div>
  );
}

function StaticJourney() {
  return (
    <section
      id="sec-timeline"
      data-ground="dark"
      style={{ background: NOIR.navyField, padding: "96px clamp(24px, 6vw, 96px)", color: "#fff" }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 64 }}>
        {CHAPTERS.map((ch) => (
          <div key={ch.id} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: "clamp(2.5rem, 6vw, 4rem)", color: `${ch.color}cc`, lineHeight: 1 }}>
              {ch.num}
            </div>
            <Badge n={ch.num} label={ch.tag} />
            <p style={{ fontFamily: FONT, fontWeight: 600, fontSize: "1.1rem", color: ch.color, margin: 0 }}>
              {ch.title}
            </p>
            <p style={{ fontFamily: FONT, fontSize: "0.95rem", color: "rgba(255,255,255,0.62)", lineHeight: 1.8, margin: 0, maxWidth: 560 }}>
              {ch.body}
            </p>
            {ch.images[0] ? (
              <StaticJourneyImage src={ch.images[0]} title={ch.title} />
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

// ── The pinned horizontal journey (UAT ChapterGroup, 1:1) ──────────────────
export function JourneyTimeline() {
  const reduced = useReducedMotion();
  const containerRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);
  const imgRefs = useRef<(HTMLDivElement | null)[]>([]);
  const progressRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const yearLabelRef = useRef<HTMLDivElement>(null);
  const scrollProgressRef = useRef(0);
  const isMobile = useIsMobile();
  const N = CHAPTERS.length;

  useEffect(() => {
    if (reduced === true) return;
    const ctx = gsap.context(() => {
      for (let i = 1; i < N; i++) {
        gsap.set(textRefs.current[i] ?? null, { x: 80, opacity: 0 });
        gsap.set(imgRefs.current[i] ?? null, { x: 60, opacity: 0, scale: 0.9 });
      }
      const first = CHAPTERS[0];
      if (first) gsap.set(dotRefs.current[0] ?? null, { backgroundColor: first.color, scale: 1.5 });
      gsap.set(progressRef.current, { scaleX: 0, transformOrigin: "left center" });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom bottom",
          // SCRUB POLICY (beatThresholds.ts): legitimate here because this is
          // a progress-linked narrative — scroll position IS the timeline
          // position, and reversing on scroll-back is the intended behaviour.
          scrub: SCROLL_SPEED,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            scrollProgressRef.current = self.progress;
          },
        },
        defaults: { ease: "none" },
      });

      tl.to(
        trackRef.current,
        {
          x: () => (trackRef.current ? -(trackRef.current.scrollWidth - window.innerWidth) : 0),
          duration: 1,
        },
        0,
      );

      tl.to(progressRef.current, { scaleX: 1, duration: 1 }, 0);

      CHAPTERS.forEach((ch, i) => {
        const c = i / (N - 1);
        const eD = 0.08;
        const xD = 0.08;

        if (i > 0) {
          tl.to(textRefs.current[i] ?? null, { x: 0, opacity: 1, duration: eD }, c - eD);
        }
        if (i < N - 1) {
          tl.to(textRefs.current[i] ?? null, { x: -80, opacity: 0, duration: xD }, c + 0.04);
        }

        if (i > 0) {
          tl.to(imgRefs.current[i] ?? null, { x: 0, opacity: 1, scale: 1, duration: eD * 1.2 }, c - eD * 1.1);
        }
        if (i < N - 1) {
          tl.to(imgRefs.current[i] ?? null, { x: -60, opacity: 0, scale: 0.9, duration: xD }, c + 0.05);
        }

        if (i > 0) {
          tl.to(yearLabelRef.current, { opacity: 0, duration: 0.02 }, c - 0.03);
          tl.call(
            () => {
              if (yearLabelRef.current) yearLabelRef.current.textContent = ch.num;
            },
            [],
            c - 0.01,
          );
          tl.to(yearLabelRef.current, { opacity: 1, duration: 0.02 }, c);
        }

        if (i > 0) {
          tl.to(dotRefs.current[i] ?? null, { backgroundColor: ch.color, scale: 1.5, duration: 0.04 }, c - 0.02);
          tl.to(dotRefs.current[i - 1] ?? null, { backgroundColor: "rgba(255,255,255,0.12)", scale: 1, duration: 0.04 }, c - 0.02);
        }
      });
    }, containerRef);
    return () => {
      ctx.revert();
    };
  }, [reduced, N]);

  if (reduced === true) {
    return <StaticJourney />;
  }

  return (
    <section id="sec-timeline" ref={containerRef} data-ground="dark" style={{ height: "480vh", position: "relative", background: NOIR.navyField }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>
        <FloatingString years={CHAPTERS.map((c) => c.num)} scrollProgressRef={scrollProgressRef} />

        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 4,
            pointerEvents: "none",
            background: `linear-gradient(to bottom, ${NOIR.navyField} 0%, transparent 5%, transparent 92%, ${NOIR.navyField} 100%)`,
          }}
        />

        <div ref={trackRef} style={{ display: "flex", width: `${String(N * 100)}vw`, height: "100%", willChange: "transform" }}>
          {CHAPTERS.map((ch, i) => (
            <div
              key={ch.id}
              style={{
                width: "100vw",
                height: "100%",
                flexShrink: 0,
                position: "relative",
                display: "flex",
                alignItems: "center",
                padding: isMobile ? "80px 24px 120px" : "0 clamp(48px, 6vw, 96px)",
                overflow: "visible",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  width: "58vw",
                  height: "58vw",
                  borderRadius: "50%",
                  background: `radial-gradient(circle, ${ch.color}0B 0%, transparent 68%)`,
                  right: "-8vw",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
              />

              {!isMobile && (
                <div
                  ref={(el) => {
                    imgRefs.current[i] = el;
                  }}
                  style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }}
                >
                  {(CHAPTER_SCATTER[ch.num] ?? []).map((pos, j) => {
                    const photo = ch.images[j];
                    if (!photo) return null;
                    return <ScatterPhoto key={ch.id + "-" + String(j)} src={photo} alt={`${ch.title}, photo ${String(j + 1)}`} pos={pos} />;
                  })}
                </div>
              )}

              <div
                style={{
                  width: "100%",
                  maxWidth: 1400,
                  margin: "0 auto",
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  alignItems: "center",
                  gap: isMobile ? 44 : "clamp(48px, 7vw, 88px)",
                  position: "relative",
                  zIndex: 2,
                }}
              >
                <div
                  ref={(el) => {
                    textRefs.current[i] = el;
                  }}
                  style={{ flex: "0 0 auto", width: isMobile ? "100%" : "44%" }}
                >
                  <div
                    style={{
                      fontFamily: FONT,
                      fontWeight: 900,
                      fontSize: "clamp(3.5rem, 9vw, 7rem)",
                      color: `${ch.color}cc`,
                      lineHeight: 1,
                      letterSpacing: "-0.05em",
                      marginBottom: -4,
                      userSelect: "none",
                    }}
                  >
                    {ch.num}
                  </div>
                  <Badge n={ch.num} label={ch.tag} />
                  <p
                    style={{
                      fontFamily: FONT,
                      fontWeight: 600,
                      fontSize: "clamp(0.9rem, 1.3vw, 1.1rem)",
                      color: ch.color,
                      margin: "12px 0 0",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {ch.title}
                  </p>
                  <p
                    style={{
                      fontFamily: FONT,
                      fontSize: "clamp(0.8rem, 1vw, 0.92rem)",
                      color: "rgba(255,255,255,0.62)",
                      lineHeight: 1.9,
                      margin: "18px 0 0",
                      maxWidth: 440,
                    }}
                  >
                    {ch.body}
                  </p>
                </div>

                {isMobile && (
                  <div
                    ref={(el) => {
                      imgRefs.current[i] = el;
                    }}
                    style={{ display: "flex", gap: 8, width: "100%" }}
                  >
                    {ch.images.slice(0, 2).map((src, j) => (
                      <div
                        key={ch.id + "-m-" + String(j)}
                        style={{ flex: 1, aspectRatio: "4/3", borderRadius: 10, overflow: "hidden", border: "2px solid rgba(255,255,255,0.7)", boxShadow: "0 4px 16px rgba(0,0,0,0.35)" }}
                      >
                        <img decoding="async" loading="lazy" src={preferWebp(src)} data-fallback-src={src} alt={`${ch.title}, photo ${String(j + 1)}`} onError={handleImgError} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 32,
            left: 0,
            right: 0,
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            pointerEvents: "none",
          }}
        >
          <div
            ref={yearLabelRef}
            style={{
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: isMobile ? "0.9rem" : "1.05rem",
              color: "rgba(255,255,255,0.55)",
              letterSpacing: "0.06em",
              marginBottom: 4,
            }}
          >
            {CHAPTERS[0]?.num ?? ""}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 18 : 32 }}>
            {CHAPTERS.map((ch, i) => (
              <div key={ch.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <div
                  ref={(el) => {
                    dotRefs.current[i] = el;
                  }}
                  style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.12)", flexShrink: 0 }}
                />
                {/* Was 8px at rgba(255,255,255,0.22) — 1.95:1, roughly four times under
                    the AA floor, at a size below the practical legibility limit.
                    Now 11px at 0.7 alpha (7.4:1). */}
                {!isMobile && (
                  <span style={{ fontFamily: FONT, fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: "0.08em" }}>
                    {ch.num}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div style={{ width: isMobile ? 180 : 280, height: 1, background: "rgba(255,255,255,0.08)", borderRadius: 1, overflow: "hidden" }}>
            <div ref={progressRef} style={{ height: "100%", background: "rgba(255,255,255,0.28)", transformOrigin: "left center" }} />
          </div>
        </div>
      </div>
    </section>
  );
}
