import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { Box, InputBase, Modal, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";
import { useReducedMotion } from "@/shared/motion";
import { useNavbar } from "./NavbarContext";

const GROUP_ORDER = ["NAVIGATE", "ACTION", "SYSTEM"] as const;
type Group = (typeof GROUP_ORDER)[number];

const COMMANDS = [
  { id: "nav-home", group: "NAVIGATE", label: "Home", keywords: "index landing start root", run: { kind: "nav", to: "/" } },
  { id: "nav-about", group: "NAVIGATE", label: "About", keywords: "firm team story who we are", run: { kind: "nav", to: "/about" } },
  { id: "nav-services", group: "NAVIGATE", label: "Services", keywords: "offering consulting engineering what we do", run: { kind: "nav", to: "/services" } },
  { id: "nav-blog", group: "NAVIGATE", label: "Blog", keywords: "posts articles writing news", run: { kind: "nav", to: "/blog" } },
  { id: "nav-innovation-hub", group: "NAVIGATE", label: "Innovation Lab", keywords: "labs experiment innovation data science", run: { kind: "nav", to: "/innovation-hub" } },
  { id: "nav-contact", group: "NAVIGATE", label: "Contact", keywords: "reach email talk address", run: { kind: "nav", to: "/contact" } },
  { id: "act-conversation", group: "ACTION", label: "Start a conversation", keywords: "contact talk hire enquiry inquiry", run: { kind: "nav", to: "/contact" } },
  { id: "act-careers", group: "ACTION", label: "Copy careers email", keywords: "jobs hiring recruiting jobs@phitopolis.com", run: { kind: "copy", address: "jobs@phitopolis.com" } },
  { id: "act-inquiries", group: "ACTION", label: "Copy general inquiries email", keywords: "info hello support info@phitopolis.com", run: { kind: "copy", address: "info@phitopolis.com" } },
  { id: "sys-signal", group: "SYSTEM", label: "Signal check", keywords: "ping latency status desk easter", run: { kind: "signal" } },
  { id: "sys-nav-minimal", group: "SYSTEM", label: "Navbar: Minimal Mode", keywords: "navbar minimal left logo padding margin 2xl default", run: { kind: "navbar-mode", mode: "minimal" } },
  { id: "sys-nav-dynamic", group: "SYSTEM", label: "Navbar: Dynamic Mode", keywords: "navbar auto dynamic", run: { kind: "navbar-mode", mode: "dynamic" } },
  { id: "sys-nav-island", group: "SYSTEM", label: "Navbar: Island Mode", keywords: "navbar island forced compact", run: { kind: "navbar-mode", mode: "island" } },
  { id: "sys-nav-immersive", group: "SYSTEM", label: "Navbar: Immersive Mode", keywords: "navbar immersive full", run: { kind: "navbar-mode", mode: "immersive" } },
  { id: "sys-nav-notch", group: "SYSTEM", label: "Navbar: Notch Mode", keywords: "navbar notch macbook camera capsule dark island", run: { kind: "navbar-mode", mode: "notch" } },
  { id: "sys-nav-standard", group: "SYSTEM", label: "Navbar: Standard Mode", keywords: "navbar standard wide stretch full top normal center nav items", run: { kind: "navbar-mode", mode: "standard" } },
  { id: "sys-nav-autohide", group: "SYSTEM", label: "Toggle Navigation Autohide", keywords: "navigation autohide navbar scroll hide show toggle", run: { kind: "toggle-autohide" } },
  { id: "sys-toggle-motto", group: "SYSTEM", label: "Toggle Logo Motto", keywords: "motto slogan tagline company header show hide toggle brand text", run: { kind: "toggle-motto" } },
  { id: "sys-toggle-id-overlay", group: "SYSTEM", label: "Toggle ID Overlay", keywords: "id overlay developer outline tag inspect elements box layout toggle", run: { kind: "toggle-id-overlay" } },
] as const;

type Cmd = (typeof COMMANDS)[number];

const SIGNAL_TEXT = ["> pinging desk… ", "> latency: 87µs", "> signal acquired ▲"].join("\n");
const LISTBOX_ID = "cmdk-listbox";
const optId = (id: string) => `cmdk-opt-${id}`;

const isEditableTarget = (t: EventTarget | null): boolean => {
  if (!(t instanceof HTMLElement)) return false;
  return t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable;
};

export function CommandPalette() {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const { setOverrideMode, toggleAutohide, toggleMotto } = useNavbar();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  // null = signal check not run; otherwise chars of SIGNAL_TEXT revealed
  const [signalChars, setSignalChars] = useState<number | null>(null);

  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);
  const copyTimer = useRef<number | null>(null);
  const twTimer = useRef<number | null>(null);

  const [isMac] = useState(
    () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/i.test(navigator.platform),
  );

  const stopTypewriter = useCallback(() => {
    if (twTimer.current !== null) {
      window.clearInterval(twTimer.current);
      twTimer.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
    setSignalChars(null);
    setCopiedId(null);
    stopTypewriter();
  }, [stopTypewriter]);

  // Global hotkeys — ⌘K/Ctrl+K toggles, Esc closes. Opening is suppressed
  // while an editable element has focus; closing always works.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        if (!openRef.current && isEditableTarget(e.target)) return;
        e.preventDefault();
        if (openRef.current) handleClose();
        else setOpen(true);
      } else if (e.key === "Escape" && openRef.current) {
        handleClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose]);

  useEffect(
    () => () => {
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
      stopTypewriter();
    },
    [stopTypewriter],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [...COMMANDS];
    return COMMANDS.filter((c) => `${c.label} ${c.keywords}`.toLowerCase().includes(q));
  }, [query]);

  const active: Cmd | undefined = filtered[activeIndex];
  const activeId = active ? optId(active.id) : undefined;

  useEffect(() => {
    if (!open || !activeId) return;
    document.getElementById(activeId)?.scrollIntoView({ block: "nearest" });
  }, [open, activeId]);

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
    (cmd: Cmd) => {
      switch (cmd.run.kind) {
        case "nav":
          handleClose();
          void navigate({ to: cmd.run.to });
          break;
        case "copy":
          copyAddress(cmd.id, cmd.run.address);
          break;
        case "signal":
          runSignal();
          break;
        case "navbar-mode":
          handleClose();
          setOverrideMode(cmd.run.mode);
          break;
        case "toggle-autohide":
          handleClose();
          toggleAutohide();
          break;
        case "toggle-motto":
          handleClose();
          toggleMotto();
          break;
        case "toggle-id-overlay":
          handleClose();
          window.dispatchEvent(new CustomEvent("phitopolis-toggle-id-overlay"));
          break;
      }
    },
    [handleClose, navigate, copyAddress, runSignal, setOverrideMode, toggleAutohide, toggleMotto],
  );

  const onInputKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (filtered.length ? (i + 1) % filtered.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (filtered.length ? (i - 1 + filtered.length) % filtered.length : 0));
    } else if (e.key === "Home" && filtered.length) {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End" && filtered.length) {
      e.preventDefault();
      setActiveIndex(filtered.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cmd = filtered[activeIndex];
      if (cmd) execute(cmd);
    }
  };

  const monoLabelSx = {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: "0.16em",
    color: NOIR.mist,
    textTransform: "uppercase",
  } as const;

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: `rgba(${NOIR.navyFieldRgb}, 0.2)`,
              backdropFilter: "blur(4px)",
            },
          },
        }}
      >
        <Box
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          sx={{
            position: "fixed",
            top: "16vh",
            left: "50%",
            transform: "translateX(-50%)",
            width: "min(620px, calc(100vw - 32px))",
            bgcolor: NOIR.panel,
            border: `1px solid ${NOIR.hairline}`,
            borderRadius: "6px",
            boxShadow: `0 24px 64px rgba(${NOIR.navyFieldRgb}, 0.18)`,
            outline: "none",
            overflow: "hidden",
            animation: reducedMotion ? "none" : "cmdkIn 150ms ease-out",
            "@keyframes cmdkIn": {
              from: { opacity: 0, transform: "translateX(-50%) translateY(-6px) scale(0.985)" },
              to: { opacity: 1, transform: "translateX(-50%) translateY(0) scale(1)" },
            },
          }}
        >
          {/* prompt row */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              px: 2,
              py: 1.5,
              borderBottom: `1px solid ${NOIR.hairline}`,
            }}
          >
            <Typography
              component="span"
              aria-hidden
              sx={{ fontFamily: MONO, fontSize: 15, color: NOIR.gold, lineHeight: 1 }}
            >
              ❯
            </Typography>
            <InputBase
              autoFocus
              fullWidth
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={onInputKeyDown}
              placeholder="Type a command…"
              inputProps={{
                role: "combobox",
                "aria-expanded": true,
                "aria-controls": LISTBOX_ID,
                "aria-autocomplete": "list",
                "aria-label": "Search commands",
                autoCapitalize: "off",
                autoCorrect: "off",
                spellCheck: false,
                ...(activeId !== undefined ? { "aria-activedescendant": activeId } : {}),
              }}
              sx={{
                fontFamily: MONO,
                fontSize: 14,
                color: NOIR.ink,
                "& input::placeholder": { color: NOIR.mist, opacity: 0.8 },
              }}
            />
            <Typography component="span" sx={{ ...monoLabelSx, flexShrink: 0 }}>
              esc
            </Typography>
          </Box>

          {/* results */}
          <Box
            component="ul"
            role="listbox"
            id={LISTBOX_ID}
            aria-label="Commands"
            sx={{ listStyle: "none", m: 0, p: 0, py: 0.5, maxHeight: 320, overflowY: "auto" }}
          >
            {filtered.length === 0 && (
              <Typography
                component="li"
                role="presentation"
                sx={{ ...monoLabelSx, px: 2, py: 1.5 }}
              >
                no match — 0 results
              </Typography>
            )}
            {GROUP_ORDER.map((group: Group) => {
              const rows = filtered.filter((c) => c.group === group);
              if (rows.length === 0) return null;
              return (
                <Box component="li" role="group" aria-label={group} key={group} sx={{ px: 0 }}>
                  <Typography aria-hidden sx={{ ...monoLabelSx, px: 2, pt: 1.25, pb: 0.5 }}>
                    {group}
                  </Typography>
                  <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
                    {rows.map((cmd) => {
                      const index = filtered.indexOf(cmd);
                      const selected = index === activeIndex;
                      const copied = copiedId === cmd.id;
                      return (
                        <Box
                          component="li"
                          key={cmd.id}
                          id={optId(cmd.id)}
                          role="option"
                          aria-selected={selected}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => execute(cmd)}
                          onMouseMove={() => {
                            if (!selected) setActiveIndex(index);
                          }}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 2,
                            px: 2,
                            py: 1,
                            cursor: "pointer",
                            borderLeft: `2px solid ${selected ? NOIR.gold : "transparent"}`,
                            backgroundColor: selected
                              ? `rgba(${NOIR.goldRgb}, 0.10)`
                              : "transparent",
                          }}
                        >
                          <Typography
                            sx={{ fontFamily: MONO, fontSize: 13, color: NOIR.ink }}
                          >
                            {cmd.label}
                          </Typography>
                          <Typography
                            component="span"
                            sx={{
                              ...monoLabelSx,
                              flexShrink: 0,
                              ...(copied ? { color: NOIR.goldDark } : {}),
                            }}
                          >
                            {copied
                              ? "copied ✓"
                              : cmd.run.kind === "nav"
                                ? cmd.run.to
                                : cmd.run.kind === "copy"
                                  ? cmd.run.address
                                  : "run"}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              );
            })}
          </Box>

          {/* signal-check terminal output (clearly simulated, hence SIM tag) */}
          {signalChars !== null && (
            <Box sx={{ borderTop: `1px solid ${NOIR.hairline}`, px: 2, py: 1.25 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", pb: 0.5 }}>
                <Typography sx={monoLabelSx}>signal</Typography>
                <Typography sx={{ ...monoLabelSx, color: NOIR.goldDark }}>sim</Typography>
              </Box>
              <Box
                component="pre"
                aria-hidden
                sx={{
                  m: 0,
                  fontFamily: MONO,
                  fontSize: 12,
                  lineHeight: 1.7,
                  color: NOIR.ink,
                  whiteSpace: "pre-wrap",
                  minHeight: "calc(3 * 1.7em)",
                }}
              >
                {SIGNAL_TEXT.slice(0, signalChars)}
              </Box>
              <Box
                component="span"
                role="status"
                sx={{
                  position: "absolute",
                  width: 1,
                  height: 1,
                  overflow: "hidden",
                  clipPath: "inset(50%)",
                }}
              >
                {signalChars >= SIGNAL_TEXT.length ? SIGNAL_TEXT : ""}
              </Box>
            </Box>
          )}

          {/* footer */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              px: 2,
              py: 1,
              borderTop: `1px solid ${NOIR.hairline}`,
              backgroundColor: NOIR.void,
            }}
          >
            <Typography sx={monoLabelSx}>↑↓ navigate</Typography>
            <Typography sx={monoLabelSx}>↵ run</Typography>
            <Typography sx={{ ...monoLabelSx, ml: "auto" }}>phitopolis // terminal</Typography>
          </Box>
        </Box>
      </Modal>

      {/* hotkey hint chip — precise pointers only */}
      <Box
        component="button"
        type="button"
        aria-label={`Open command palette (${isMac ? "Command" : "Control"} K)`}
        onClick={() => setOpen(true)}
        sx={{
          position: "fixed",
          right: 16,
          bottom: 16,
          zIndex: (t) => t.zIndex.snackbar,
          display: "none",
          "@media (pointer: fine)": { display: "inline-flex" },
          alignItems: "center",
          gap: 0.75,
          px: 1.25,
          py: 0.5,
          fontFamily: MONO,
          fontSize: 11,
          letterSpacing: "0.12em",
          color: NOIR.mist,
          backgroundColor: NOIR.panel,
          border: `1px solid ${NOIR.hairline}`,
          borderRadius: "4px",
          cursor: "pointer",
          transition: "border-color 120ms ease, color 120ms ease",
          "&:hover, &:focus-visible": { borderColor: NOIR.gold, color: NOIR.ink },
        }}
      >
        {isMac ? "⌘K" : "Ctrl K"}
      </Box>
    </>
  );
}
