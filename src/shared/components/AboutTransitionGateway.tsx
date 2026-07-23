import React, { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { alpha } from "@mui/material/styles";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "@tanstack/react-router";
import { CONTENT } from "@/shared/content";
import { StageSection } from "@/shared/components/StageSection";
import { Reveal } from "@/shared/components/Reveal";
import { homeSection } from "@/shared/sections";
import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

export function AboutTransitionGateway() {
  const [hovered, setHovered] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const navigate = useNavigate();

  const handleTransition = (e: React.MouseEvent) => {
    e.preventDefault();
    setTransitioning(true);
    setTimeout(() => {
      void navigate({ to: "/about" });
    }, 600);
  };

  return (
    <StageSection section={homeSection("closing")}>
      <Box sx={{ position: "relative", width: "100%", textAlign: "center", py: { xs: 4, md: 8 } }}>

        <Reveal delay={0.1}>
          <Typography
            variant="h1"
            sx={{
              color: "primary.main",
              maxWidth: 1000,
              mx: "auto",
              fontSize: { xs: "2.4rem", sm: "3.8rem", md: "4.8rem" },
              fontWeight: 900,
              lineHeight: 1.1,
              mb: 4,
            }}
          >
            {CONTENT.story.title}
          </Typography>
        </Reveal>

        <Reveal delay={0.15}>
          <Typography
            variant="body1"
            sx={{
              color: "text.secondary",
              maxWidth: 720,
              mx: "auto",
              fontSize: { xs: "1rem", md: "1.2rem" },
              lineHeight: 1.7,
              mb: 6,
            }}
          >
            {CONTENT.story.body}
          </Typography>
        </Reveal>

        <Reveal delay={0.2}>
          <Stack spacing={2} alignItems="center">
            <Button
              onClick={handleTransition}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              variant="contained"
              color="primary"
              size="large"
              sx={{
                fontFamily: MONO,
                letterSpacing: "0.18em",
                px: 5,
                py: 2.2,
                borderRadius: "4px",
                textTransform: "uppercase",
                fontSize: "0.95rem",
                minWidth: "360px",
                position: "relative",
                overflow: "hidden",
                boxShadow: `0 8px 30px ${alpha(NOIR.navyField, 0.25)}`,
                transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                "&:hover": {
                  transform: "scale(1.04)",
                  boxShadow: `0 12px 40px ${alpha(NOIR.navyField, 0.4)}`,
                },
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Typography component="span" sx={{ fontFamily: MONO, fontWeight: 700, letterSpacing: "0.18em" }}>
                  DISCOVER OUR FULL STORY
                </Typography>
                <ArrowForwardIcon sx={{ transition: "transform 0.3s ease", transform: hovered ? "translateX(6px)" : "none" }} />
              </Stack>
            </Button>

            <Typography
              sx={{
                fontFamily: MONO,
                fontSize: "0.75rem",
                letterSpacing: "0.08em",
                color: "text.secondary",
                maxWidth: 520,
                mt: 3,
              }}
            >
              {CONTENT.contact.address}
            </Typography>
          </Stack>
        </Reveal>

        {/* Lusion-style Transition Portal Overlay */}
        <AnimatePresence>
          {transitioning && (
            <motion.div
              initial={{ clipPath: "circle(0% at 50% 50%)", opacity: 0 }}
              animate={{ clipPath: "circle(150% at 50% 50%)", opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.65, ease: [0.76, 0, 0.24, 1] }}
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: NOIR.navyField,
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                variant="h2"
                sx={{
                  color: NOIR.gold,
                  fontFamily: MONO,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                }}
              >
                ENTERING ABOUT // PHITOPOLIS STORY
              </Typography>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </StageSection>
  );
}
