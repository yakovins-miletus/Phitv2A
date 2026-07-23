import { useRef } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import HomeIcon from "@mui/icons-material/Home";
import { motion } from "motion/react";
import { useRouter } from "@tanstack/react-router";
import { alpha } from "@mui/material/styles";

import { NOIR } from "@/shared/theme/palette";
import { FONT, MONO } from "@/shared/theme/theme";

/** Subtle animated grid lines — pure CSS, no canvas, GPU-friendly. */
function GridBackground() {
  return (
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        inset: 0,
        backgroundImage: `
          linear-gradient(${alpha(NOIR.gold, 0.06)} 1px, transparent 1px),
          linear-gradient(90deg, ${alpha(NOIR.gold, 0.06)} 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
        maskImage:
          "radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 100%)",
      }}
    />
  );
}

/** Radial glow behind the 404 number. */
function CenterGlow() {
  return (
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 700,
        height: 500,
        borderRadius: "50%",
        background: `radial-gradient(ellipse at center, ${alpha(NOIR.gold, 0.14)} 0%, transparent 70%)`,
        pointerEvents: "none",
      }}
    />
  );
}

export function NotFoundPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <Box
      ref={containerRef}
      sx={{
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: NOIR.navyField,
        position: "relative",
        overflow: "hidden",
        px: { xs: 3, md: 6 },
        textAlign: "center",
      }}
    >
      {/* Background decoration */}
      <GridBackground />
      <CenterGlow />

      {/* Top kicker */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <Typography
          sx={{
            fontFamily: MONO,
            fontSize: { xs: "0.7rem", md: "0.8rem" },
            letterSpacing: "0.3em",
            color: NOIR.gold,
            fontWeight: 700,
            textTransform: "uppercase",
            mb: 3,
          }}
        >
          ERROR // 404 — PAGE NOT FOUND
        </Typography>
      </motion.div>

      {/* Giant 404 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
        style={{ position: "relative", zIndex: 1 }}
      >
        <Typography
          component="h1"
          sx={{
            fontFamily: FONT,
            fontSize: { xs: "clamp(7rem, 28vw, 18rem)" },
            fontWeight: 900,
            lineHeight: 0.9,
            letterSpacing: "-0.05em",
            color: "transparent",
            WebkitTextStroke: `2px ${NOIR.gold}`,
            textShadow: `0 0 80px ${alpha(NOIR.gold, 0.35)}, 0 0 160px ${alpha(NOIR.gold, 0.15)}`,
            userSelect: "none",
            position: "relative",
            // Glitch duplication via pseudo-element workaround using ::before overlay
            "&::after": {
              content: '"404"',
              position: "absolute",
              inset: 0,
              color: alpha(NOIR.gold, 0.07),
              WebkitTextStroke: "0px",
              transform: "translate(4px, 4px)",
              pointerEvents: "none",
            },
          }}
        >
          404
        </Typography>
      </motion.div>

      {/* Divider line */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.25 }}
        style={{
          width: "100%",
          maxWidth: 400,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${NOIR.gold}, transparent)`,
          margin: "2rem auto",
        }}
      />

      {/* Headline + sub */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.35 }}
      >
        <Typography
          variant="h2"
          sx={{
            fontFamily: FONT,
            fontSize: { xs: "1.6rem", sm: "2.2rem", md: "2.8rem" },
            fontWeight: 800,
            color: "#FFFFFF",
            letterSpacing: "-0.02em",
            mb: 1.5,
          }}
        >
          This signal got lost.
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: alpha("#FFFFFF", 0.6),
            maxWidth: 480,
            mx: "auto",
            fontSize: { xs: "0.95rem", md: "1.05rem" },
            lineHeight: 1.7,
          }}
        >
          The page you're looking for doesn't exist or has been moved.
          Check the URL or navigate back to a known section.
        </Typography>
      </motion.div>

      {/* CTA buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.5 }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ mt: 5, justifyContent: "center" }}
        >
          <Button
            variant="contained"
            size="large"
            startIcon={<HomeIcon />}
            onClick={() => router.navigate({ to: "/" })}
            sx={{
              bgcolor: NOIR.gold,
              color: NOIR.navyField,
              fontWeight: 700,
              px: 4,
              py: 1.4,
              fontSize: "0.9rem",
              borderRadius: "8px",
              "&:hover": {
                bgcolor: NOIR.goldLight,
                transform: "translateY(-2px)",
                boxShadow: `0 8px 24px ${alpha(NOIR.gold, 0.4)}`,
              },
              transition: "all 0.25s ease",
            }}
          >
            Back to Home
          </Button>

          <Button
            variant="outlined"
            size="large"
            endIcon={<ArrowForwardIcon />}
            onClick={() => router.navigate({ to: "/contact" })}
            sx={{
              borderColor: alpha("#FFFFFF", 0.3),
              color: "#FFFFFF",
              fontWeight: 600,
              px: 4,
              py: 1.4,
              fontSize: "0.9rem",
              borderRadius: "8px",
              "&:hover": {
                borderColor: NOIR.gold,
                color: NOIR.gold,
                bgcolor: alpha(NOIR.gold, 0.06),
                transform: "translateY(-2px)",
              },
              transition: "all 0.25s ease",
            }}
          >
            Contact Us
          </Button>
        </Stack>
      </motion.div>

      {/* Bottom monospace footer stamp */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.7 }}
        style={{ marginTop: "4rem" }}
      >
        <Typography
          sx={{
            fontFamily: MONO,
            fontSize: "0.68rem",
            letterSpacing: "0.2em",
            color: alpha("#FFFFFF", 0.2),
            textTransform: "uppercase",
          }}
        >
          PHITOPOLIS · FINTECH ENGINEERING · QUANTITATIVE R&D
        </Typography>
      </motion.div>
    </Box>
  );
}
