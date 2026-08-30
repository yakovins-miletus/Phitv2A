import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CookieOutlinedIcon from "@mui/icons-material/CookieOutlined";
import { AnimatePresence, motion } from "motion/react";

import { useReducedMotion } from "@/shared/motion";
import { RouterLink } from "@/shared/components/RouterLink";
import { NOIR } from "@/shared/theme/palette";
import {
  ANALYTICS_PROVIDER_ENABLED,
  setAnalyticsConsent,
  useAnalyticsConsent,
} from "@/shared/consent";

/**
 * CookieNotice — the GDPR consent gate for analytics.
 *
 * ── What the site actually stores ───────────────────────────────────────────
 *
 * A grep of `src/` for `document.cookie` finds zero matches: the site sets no
 * cookies. `localStorage`/`sessionStorage` are used only for first-party UI
 * state (hero background persistence, the admin debug-overlay toggle, "seen the
 * preloader this session") — never for tracking or third-party identifiers.
 * `@vercel/analytics` and `@vercel/speed-insights` are wired into `__root.tsx`
 * but gated off in production (see `useVercelAnalytics` there) unless served
 * from a `*.vercel.app` host or `VITE_ANALYTICS=on`.
 *
 * ── Why this usually renders nothing ────────────────────────────────────────
 *
 * There is no Google Analytics yet — no script, no measurement ID, no `gtag`.
 * This component is the consent UI that a future GA integration will sit
 * behind. It renders only when BOTH:
 *   1. `ANALYTICS_PROVIDER_ENABLED` is true (an analytics provider exists), and
 *   2. the visitor has not yet chosen (`useAnalyticsConsent()` is `null`).
 * Today (1) is false, so this renders `null` — correct, and it removes the old
 * DRAFT banner from the live site.
 *
 * ── No dismiss-only path ────────────────────────────────────────────────────
 *
 * The previous version had an X button and a `phitopolis_cookie_notice_dismissed`
 * flag that recorded no consent — its own header called that out as the
 * anti-pattern to avoid. That is gone. "Decline" IS the negative choice; both
 * buttons write a real value via `setAnalyticsConsent`, and the card dismisses
 * because that state flip removes it, not via a separate flag.
 *
 * Keep this component's copy in sync with whatever `/privacy` ends up saying
 * under "Cookies & Similar Technologies".
 */
export function CookieNotice() {
  const reduced = useReducedMotion();
  const consent = useAnalyticsConsent();

  // Nothing to consent to (no provider), or the choice is already made.
  const show = ANALYTICS_PROVIDER_ENABLED && consent === null;

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          role="region"
          aria-label="Cookie consent"
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
            // Docked to the trailing edge on desktop rather than centred, so it
            // clears the home hero's CTA row. Full width on mobile, where there
            // is no room to dock and nothing beside it.
            justifyContent: "flex-end",
            padding: "16px",
            pointerEvents: "none",
          }}
        >
          <Box
            sx={{
              pointerEvents: "auto",
              width: "100%",
              maxWidth: { xs: "100%", md: 460 },
              // Owned by the glass system rather than a local multiplier — see
              // theme.ts's note on why `shape.borderRadius` stays 4.
              borderRadius: "var(--r-card)",
              border: `1px solid ${NOIR.gold}55`,
              bgcolor: NOIR.navyDeep,
              color: NOIR.frost,
              boxShadow: "var(--glass-shadow-3)",
              px: { xs: 2, md: 2.5 },
              py: { xs: 1.5, md: 1.75 },
            }}
          >
            <Stack direction="row" spacing={1.75} alignItems="flex-start">
              <CookieOutlinedIcon
                sx={{ color: NOIR.gold, flexShrink: 0, fontSize: "1.15rem", mt: 0.25 }}
              />

              <Stack spacing={1.25} sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{ color: `rgba(${NOIR.whiteRgb}, 0.85)` }}
                >
                  We use analytics cookies to understand how visitors use this
                  site. Essential local storage (interface preferences) is always
                  on.{" "}
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

                <Stack direction="row" spacing={1}>
                  <Button
                    aria-label="Accept analytics cookies"
                    onClick={() => setAnalyticsConsent("granted")}
                    size="small"
                    variant="contained"
                    sx={{
                      bgcolor: NOIR.gold,
                      color: NOIR.navyDeep,
                      fontWeight: 700,
                      "&:hover": { bgcolor: NOIR.gold, filter: "brightness(1.08)" },
                    }}
                  >
                    Accept
                  </Button>
                  <Button
                    aria-label="Decline analytics cookies"
                    onClick={() => setAnalyticsConsent("denied")}
                    size="small"
                    variant="outlined"
                    sx={{
                      color: `rgba(${NOIR.whiteRgb}, 0.85)`,
                      borderColor: `rgba(${NOIR.whiteRgb}, 0.3)`,
                      "&:hover": {
                        borderColor: NOIR.gold,
                        color: NOIR.gold,
                        bgcolor: `rgba(${NOIR.whiteRgb}, 0.06)`,
                      },
                    }}
                  >
                    Decline
                  </Button>
                </Stack>
              </Stack>
            </Stack>
          </Box>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
