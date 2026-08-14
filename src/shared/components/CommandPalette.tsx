import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { Box, InputBase, Modal, Typography } from "@mui/material";
import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";
import { useReducedMotion } from "@/shared/motion";
import { useHeroModeState } from "@/features/hero/heroModeStore";
import { useHeroBgModeState } from "@/features/hero/heroBgModeStore";
import {
  GROUP_ORDER,
  SIGNAL_TEXT,
  commandHint,
  filterCommands,
  useCommandExecutor,
  type Cmd,
  type Group,
} from "./commandActions";

import { useTransitionCurtain } from "./TransitionCurtain";

const LISTBOX_ID = "cmdk-listbox";
const optId = (id: string) => `cmdk-opt-${id}`;

const isEditableTarget = (t: EventTarget | null): boolean => {
  if (!(t instanceof HTMLElement)) return false;
  return t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable;
};

export function CommandPalette() {
  const { navigateWithCurtain } = useTransitionCurtain();
  const reducedMotion = useReducedMotion();
  const { mode: heroMode } = useHeroModeState();
  const { mode: heroBgMode } = useHeroBgModeState();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const [isMac] = useState(
    () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/i.test(navigator.platform),
  );

  const { execute, copiedId, signalChars, resetRuntime } = useCommandExecutor(
    (opts) => {
      setOpen(false);
      navigateWithCurtain(opts.to);
    },
  );

  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
    resetRuntime();
  }, [resetRuntime]);

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

  const filtered = useMemo(() => filterCommands(query), [query]);

  const active: Cmd | undefined = filtered[activeIndex];
  const activeId = active ? optId(active.id) : undefined;

  useEffect(() => {
    if (!open || !activeId) return;
    document.getElementById(activeId)?.scrollIntoView({ block: "nearest" });
  }, [open, activeId]);

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
      if (cmd) execute(cmd, handleClose);
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
                      const hint = commandHint(cmd, {
                        copied: copiedId === cmd.id,
                        heroMode,
                        heroBgMode,
                      });
                      return (
                        <Box
                          component="li"
                          key={cmd.id}
                          id={optId(cmd.id)}
                          role="option"
                          aria-selected={selected}
                          {...(hint.active ? { "aria-current": "true" as const } : {})}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => execute(cmd, handleClose)}
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
                              ...(hint.active ? { color: NOIR.gold } : {}),
                              ...(copiedId === cmd.id ? { color: NOIR.goldDark } : {}),
                            }}
                          >
                            {hint.text}
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
