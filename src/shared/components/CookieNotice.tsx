import { useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import CookieOutlinedIcon from "@mui/icons-material/CookieOutlined";
import { AnimatePresence, motion } from "motion/react";

import { useReducedMotion } from "@/shared/motion";
import { RouterLink } from "@/shared/components/RouterLink";
import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";

const STORAGE_KEY = "phitopolis_cookie_notice_dismissed";

function readDismissed(): boolean {
  if (typeof window === "undefined") return true; // SSR/build: never render
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    // Storage can throw in locked-down contexts (private mode quotas, etc.) —
    // fail open to "not dismissed" rather than crash the banner.
    return false;
  }
}

/**
 * CookieNotice — a minimal, dismissible banner disclosing the site's actual
 * storage/tracking posture.
 *
 * As of this component's authoring, a grep of `src/` for `document.cookie`
 * found zero matches: the site sets no cookies. `localStorage`/`sessionStorage`
 * are used only for first-party UI state (hero background persistence, the
 * admin debug-overlay toggle, "seen the preloader this session") — never for
 * tracking or third-party identifiers. `@vercel/analytics` and
 * `@vercel/speed-insights` are wired into `__root.tsx` but gated off in
 * production (see `useVercelAnalytics` there) unless the site is served from
 * a `*.vercel.app` host or `VITE_ANALYTICS=on` is set.
 *
 * Because none of that is asserted here as settled legal fact, the banner's
 * copy is left as an awaiting-content slot rather than a claim — do not fill
 * it in without confirming current practice at ship time, and keep it in
 * sync with whatever `/privacy` ends up saying under "Cookies & Similar
 * Technologies".
 *
 * ── BEFORE LAUNCH ────────────────────────────────────────────────────────────
 *
 * **Replace `NOTICE_COPY` below with counsel-approved language** describing the
 * site's actual cookie and storage practices, and drop the `DRAFT` chip once it
 * has been reviewed.
 *
 * That instruction used to be the banner's *rendered copy* — three sentences of
 * developer TODO shown to every visitor. Measured 2026-08-23: it covered the
 * hero's CTAs at 1440x900 and took roughly a third of the viewport at 390x844,
 * so the first thing anyone saw was the site apologising for itself. It is a
 * note to us, so it lives here, in a comment, where notes to us belong.
 *
 * What renders instead states only what is certainly true — that the notice is
 * not final — and makes no claim about cookies either way, which is exactly the
 * restraint the paragraph above asks for. Deliberately NOT added: an
 * Accept/Reject pair. The wiring here is dismiss-only (`STORAGE_KEY`), so
 * consent buttons would imply a choice was recorded when none is.
 */

/** The one user-facing line. Says the notice is provisional and nothing more —
 *  no claim about what is or isn't set, because that is not settled yet (see
 *  the note above). Swap for counsel-approved copy before launch. */
const NOTICE_COPY = "Our cookie and storage notice is being finalised.";
export function CookieNotice() {
  const reduced = useReducedMotion();
  // This is a CSR-only app (see the comment on SITE_URL in shared/seo.ts), so
  // there is no server-rendered markup to hydrate and no mismatch risk in
  // reading localStorage straight from the lazy initializer below.
  const [dismissed, setDismissed] = useState<boolean>(() => readDismissed());

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Best-effort — if storage is unavailable the banner simply reappears
      // next visit, which is a safe failure mode for a notice, not a defect.
    }
  };

  return (
    <AnimatePresence>
      {dismissed ? null : (
        <motion.div
          role="region"
          aria-label="Cookie and storage notice"
          initial={reduced ? false : { y: 32, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduced ? { opacity: 0 } : { y: 32, opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1400, // theme.zIndex.snackbar — same tier CommandPalette uses
            display: "flex",
            justifyContent: "center",
            padding: "16px",
            pointerEvents: "none",
          }}
        >
          <Box
            sx={{
              pointerEvents: "auto",
              width: "100%",
              maxWidth: 720,
              // Owned by the glass system rather than a local multiplier — see
              // theme.ts's note on why `shape.borderRadius` stays 4.
              borderRadius: "var(--r-card)",
              border: `1px solid ${NOIR.gold}55`,
              bgcolor: NOIR.navyDeep,
              color: NOIR.frost,
              boxShadow: "var(--glass-shadow-3)",
              px: { xs: 2, md: 2.5 },
              // Halved now that the copy is a single line instead of a
              // heading-plus-paragraph stack.
              py: { xs: 1, md: 1.125 },
            }}
          >
            {/* One row, one line. `alignItems: center` (not flex-start) because
                there is no longer a heading + paragraph stack to top-align. */}
            <Stack direction="row" spacing={1.75} alignItems="center">
              <CookieOutlinedIcon sx={{ color: NOIR.gold, flexShrink: 0, fontSize: "1.15rem" }} />

              {/* Chip, copy and link share ONE inline flow rather than sitting
                  in a flex row. As flex siblings the chip wrapped onto its own
                  line at 390px, which left the cookie icon centred against the
                  second line and the whole bar looking misassembled. Inline,
                  the chip is just the first word of the sentence and wraps with
                  it. */}
              <Typography
                variant="body2"
                sx={{ flex: 1, minWidth: 0, color: `rgba(${NOIR.whiteRgb}, 0.85)` }}
              >
                {/* The honesty marker, reduced from a full headline to a chip.
                    Remove it once the copy has been reviewed. */}
                <Box
                  component="span"
                  sx={{
                    display: "inline-block",
                    fontFamily: MONO,
                    fontSize: "0.625rem",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    color: NOIR.gold,
                    border: `1px solid ${NOIR.gold}55`,
                    borderRadius: "var(--r-pill)",
                    px: 0.875,
                    py: 0.125,
                    mr: 1,
                    // Nudges the pill's optical centre onto the text baseline —
                    // `vertical-align: middle` alone rides high next to
                    // lowercase copy.
                    verticalAlign: "1px",
                  }}
                >
                  Draft
                </Box>
                {NOTICE_COPY}{" "}
                <RouterLink
                  to="/privacy"
                  sx={{
                    color: NOIR.frost,
                    textUnderlineOffset: "3px",
                    "&:hover": { color: NOIR.gold },
                  }}
                >
                  Privacy Policy
                </RouterLink>
              </Typography>

              <IconButton
                aria-label="Dismiss cookie notice"
                onClick={dismiss}
                size="small"
                sx={{
                  color: `rgba(${NOIR.whiteRgb}, 0.7)`,
                  flexShrink: 0,
                  "&:hover": { color: NOIR.gold, bgcolor: `rgba(${NOIR.whiteRgb}, 0.06)` },
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
