/**
 * The command registry and its one dispatch implementation.
 *
 * `CommandPalette.tsx` (⌘K) and `TopNavMegaDrawer.tsx` (the mega-nav's own
 * command search) are two surfaces over the same command set, and until this
 * file existed each carried its own copy of the filter, the `execute` switch
 * and the results-row hint text — so adding a `run.kind` meant remembering to
 * edit both, and nothing enforced it. `TopNavMegaDrawer.tsx` had already
 * drifted once (its `sys-nav-*` entries only ever reached one of the two
 * switches at a time in review). This is the shared implementation; both
 * files call into it rather than keeping their own.
 *
 * `COMMANDS` lives here now, not in `CommandPalette.tsx` — `TopNavMegaDrawer`
 * used to import it from there, which meant the registry's "real" home was
 * just whichever file got it first. Both files now import it from here.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavbar, type NavbarMode } from "./NavbarContext";
import { useReducedMotion } from "@/shared/motion";
import { setHeroMode, type HeroMode } from "@/features/hero/heroModeStore";

export const GROUP_ORDER = ["NAVIGATE", "ACTION", "HERO", "SYSTEM"] as const;
export type Group = (typeof GROUP_ORDER)[number];

export const COMMANDS = [
  { id: "nav-home", group: "NAVIGATE", label: "Home", keywords: "index landing start root", run: { kind: "nav", to: "/" } },
  { id: "nav-about", group: "NAVIGATE", label: "About", keywords: "firm team story who we are", run: { kind: "nav", to: "/about" } },
  { id: "nav-services", group: "NAVIGATE", label: "Services", keywords: "offering consulting engineering what we do", run: { kind: "nav", to: "/services" } },
  { id: "nav-blog", group: "NAVIGATE", label: "Blog", keywords: "posts articles writing news", run: { kind: "nav", to: "/blog" } },
  { id: "nav-innovation-hub", group: "NAVIGATE", label: "Innovation Lab", keywords: "labs experiment innovation data science", run: { kind: "nav", to: "/innovation-hub" } },
  { id: "nav-contact", group: "NAVIGATE", label: "Contact", keywords: "reach email talk address", run: { kind: "nav", to: "/contact" } },
  { id: "act-conversation", group: "ACTION", label: "Start a conversation", keywords: "contact talk hire enquiry inquiry", run: { kind: "nav", to: "/contact" } },
  { id: "act-careers", group: "ACTION", label: "Copy careers email", keywords: "jobs hiring recruiting jobs@phitopolis.com", run: { kind: "copy", address: "jobs@phitopolis.com" } },
  { id: "act-inquiries", group: "ACTION", label: "Copy general inquiries email", keywords: "info hello support info@phitopolis.com", run: { kind: "copy", address: "info@phitopolis.com" } },
  { id: "hero-mode-monolith", group: "HERO", label: "Hero: Monolith", keywords: "hero mode monolith 3d room glass poc design", run: { kind: "hero-mode", mode: "monolith" } },
  { id: "hero-mode-legacy", group: "HERO", label: "Hero: Legacy Grid", keywords: "hero mode legacy grid plane 2d classic", run: { kind: "hero-mode", mode: "legacy" } },

  { id: "sys-signal", group: "SYSTEM", label: "Signal check", keywords: "ping latency status desk easter", run: { kind: "signal" } },
  { id: "sys-nav-minimal", group: "SYSTEM", label: "Navbar: Minimal Mode", keywords: "navbar minimal left logo padding margin 2xl default", run: { kind: "navbar-mode", mode: "minimal" } },
  { id: "sys-nav-dynamic", group: "SYSTEM", label: "Navbar: Dynamic Mode", keywords: "navbar auto dynamic", run: { kind: "navbar-mode", mode: "dynamic" } },
  { id: "sys-nav-island", group: "SYSTEM", label: "Navbar: Island Mode", keywords: "navbar island forced compact", run: { kind: "navbar-mode", mode: "island" } },
  { id: "sys-nav-immersive", group: "SYSTEM", label: "Navbar: Immersive Mode", keywords: "navbar immersive full", run: { kind: "navbar-mode", mode: "immersive" } },
  { id: "sys-nav-notch", group: "SYSTEM", label: "Navbar: Notch Mode", keywords: "navbar notch macbook camera capsule dark island", run: { kind: "navbar-mode", mode: "notch" } },
  { id: "sys-nav-standard", group: "SYSTEM", label: "Navbar: Standard Mode", keywords: "navbar standard wide stretch full top normal center nav items", run: { kind: "navbar-mode", mode: "standard" } },
  { id: "sys-nav-glassmorphism", group: "SYSTEM", label: "Navbar: Glassmorphism Mode", keywords: "navbar glass blur modern apple translucent mode gradient", run: { kind: "navbar-mode", mode: "glassmorphism" } },
  { id: "sys-nav-autohide", group: "SYSTEM", label: "Toggle Navigation Autohide", keywords: "navigation autohide navbar scroll hide show toggle", run: { kind: "toggle-autohide" } },
  { id: "sys-toggle-motto", group: "SYSTEM", label: "Toggle Logo Motto", keywords: "motto slogan tagline company header show hide toggle brand text", run: { kind: "toggle-motto" } },
  { id: "sys-toggle-id-overlay", group: "SYSTEM", label: "Toggle ID Overlay", keywords: "id overlay developer outline tag inspect elements box layout toggle", run: { kind: "toggle-id-overlay" } },
] as const;

export type Cmd = (typeof COMMANDS)[number];

export const SIGNAL_TEXT = ["> pinging desk… ", "> latency: 87µs", "> signal acquired ▲"].join("\n");

/**
 * The filtered, mode-aware command list.
 */
export function filterCommands(query: string): Cmd[] {
  const q = query.trim().toLowerCase();
  return q
    ? COMMANDS.filter((c) => `${c.label} ${c.keywords}`.toLowerCase().includes(q))
    : [...COMMANDS];
}

/**
 * The right-hand hint column's text, and whether this row reflects the
 * *current* state (rendered as `● active`, in gold, by each caller).
 *
 * `active` is a separate concern from keyboard/mouse selection (`aria-selected`
 * in both callers) — a command can be the live hero mode without being the
 * row the arrow keys are currently on. Callers should mark it with
 * `aria-current="true"` rather than overloading `aria-selected`.
 */
export function commandHint(
  cmd: Cmd,
  ctx: { copied: boolean; heroMode: HeroMode },
): { text: string; active: boolean } {
  if (ctx.copied) return { text: "copied ✓", active: false };
  switch (cmd.run.kind) {
    case "nav":
      return { text: cmd.run.to, active: false };
    case "copy":
      return { text: cmd.run.address, active: false };
    case "hero-mode": {
      const active = ctx.heroMode === cmd.run.mode;
      return { text: active ? "● active" : "run", active };
    }
    default:
      return { text: "run", active: false };
  }
}

/**
 * The one `execute` implementation, and the runtime state its two special
 * commands need (the signal-check typewriter, the copy-to-clipboard toast).
 *
 * `navigate` is passed in rather than imported, since the two callers reach
 * the router through slightly different entry points (`useNavigate()`'s
 * returned function vs `useRouter().navigate`). `close` is a per-call argument
 * to `execute`, not a hook argument — the two callers also close differently
 * (`CommandPalette` resets its own query/index state alongside closing;
 * `TopNavMegaDrawer` just calls `onClose`), and each caller's own `close`
 * function commonly wants to call this hook's `resetRuntime` too, which would
 * be a circular dependency if `close` were baked in at the `useCommandExecutor`
 * call instead.
 */
export function useCommandExecutor(navigate: (opts: { to: string }) => void) {
  const reducedMotion = useReducedMotion();
  const { setOverrideMode, toggleAutohide, toggleMotto } = useNavbar();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  // null = signal check not run; otherwise chars of SIGNAL_TEXT revealed
  const [signalChars, setSignalChars] = useState<number | null>(null);
  const copyTimer = useRef<number | null>(null);
  const twTimer = useRef<number | null>(null);

  const stopTypewriter = useCallback(() => {
    if (twTimer.current !== null) {
      window.clearInterval(twTimer.current);
      twTimer.current = null;
    }
  }, []);

  /** Reset both special commands' state — call this alongside closing. */
  const resetRuntime = useCallback(() => {
    setSignalChars(null);
    setCopiedId(null);
    stopTypewriter();
  }, [stopTypewriter]);

  useEffect(
    () => () => {
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
      stopTypewriter();
    },
    [stopTypewriter],
  );

  const runSignal = useCallback(() => {
    stopTypewriter();
    if (reducedMotion) {
      setSignalChars(SIGNAL_TEXT.length);
      return;
    }
    setSignalChars(0);
    twTimer.current = window.setInterval(() => {
      setSignalChars((c) => {
        const next = Math.min((c ?? 0) + 1, SIGNAL_TEXT.length);
        if (next >= SIGNAL_TEXT.length) stopTypewriter();
        return next;
      });
    }, 28);
  }, [reducedMotion, stopTypewriter]);

  const copyAddress = useCallback((id: string, address: string) => {
    navigator.clipboard
      .writeText(address)
      .then(() => {
        setCopiedId(id);
        if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
        copyTimer.current = window.setTimeout(() => setCopiedId(null), 1600);
      })
      .catch(() => {});
  }, []);

  const execute = useCallback(
    (cmd: Cmd, close: () => void) => {
      switch (cmd.run.kind) {
        case "nav":
          close();
          navigate({ to: cmd.run.to });
          break;
        case "copy":
          copyAddress(cmd.id, cmd.run.address);
          break;
        case "signal":
          runSignal();
          break;
        case "navbar-mode":
          close();
          setOverrideMode(cmd.run.mode as NavbarMode);
          break;
        case "toggle-autohide":
          close();
          toggleAutohide();
          break;
        case "toggle-motto":
          close();
          toggleMotto();
          break;
        case "toggle-id-overlay":
          close();
          window.dispatchEvent(new CustomEvent("phitopolis-toggle-id-overlay"));
          break;
        case "hero-mode":
          close();
          setHeroMode(cmd.run.mode as HeroMode);
          break;
      }
    },
    [navigate, copyAddress, runSignal, setOverrideMode, toggleAutohide, toggleMotto],
  );

  return { execute, copiedId, signalChars, resetRuntime };
}
