import { useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import CookieOutlinedIcon from "@mui/icons-material/CookieOutlined";
import { AnimatePresence, motion } from "motion/react";

import { useReducedMotion } from "@/shared/motion";
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
 */
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
              borderRadius: 3,
              border: `1px solid ${NOIR.gold}55`,
              bgcolor: NOIR.navyDeep,
              color: NOIR.frost,
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.35)",
              px: { xs: 2.5, md: 3 },
              py: { xs: 2, md: 2.25 },
            }}
          >
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <CookieOutlinedIcon sx={{ color: NOIR.gold, flexShrink: 0, mt: "2px" }} />
              <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontFamily: MONO,
                    fontSize: "0.68rem",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    fontWeight: 800,
                    color: NOIR.gold,
                  }}
                >
                  AWAITING LEGAL REVIEW — placeholder notice
                </Typography>
                <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.6 }}>
                  This banner's copy has not been reviewed or approved by legal counsel. Replace
                  it with counsel-approved language describing the site's actual cookie and
                  storage practices before launch — see the "Cookies &amp; Similar Technologies"
                  section of{" "}
                  <Box component="span" sx={{ fontFamily: MONO }}>
                    /privacy
                  </Box>
                  .
                </Typography>
              </Stack>
              <IconButton
                aria-label="Dismiss cookie notice"
                onClick={dismiss}
                size="small"
                sx={{
                  color: "rgba(255, 255, 255, 0.7)",
                  flexShrink: 0,
                  "&:hover": { color: NOIR.gold, bgcolor: "rgba(255, 255, 255, 0.06)" },
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
