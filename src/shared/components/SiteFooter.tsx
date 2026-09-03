import React from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import MailIcon from "@mui/icons-material/Mail";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { alpha } from "@mui/material/styles";

import { RouterLink, RouterButton } from "@/shared/components/RouterLink";
import { useTransitionCurtain } from "@/shared/components/transitionCurtainContext";
import { LogoParticleField } from "@/shared/components/LogoParticleField";
import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";
import { EASE_OUT_EXPO_CSS } from "@/shared/motion/easing";

interface SiteFooterProps {
  footerAnchorRef: React.RefObject<HTMLElement | null>;
  currentNarration: { next: string; label: string; to?: string } | undefined;
}

const PRIMARY_LINKS = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Services", to: "/services" },
  { label: "Careers", to: "/careers" },
  { label: "Journal", to: "/blog" },
  { label: "Contact", to: "/contact" },
] as const;

const footerLabelSx = {
  color: alpha(NOIR.white, 0.5), fontFamily: MONO, fontSize: "0.69rem", fontWeight: 700,
  letterSpacing: "0.12em", textTransform: "uppercase",
} as const;

const contactLinkSx = {
  alignItems: "center", color: NOIR.white, display: "inline-flex", fontSize: "0.92rem", fontWeight: 600,
  gap: 0.8, textDecoration: "none !important", transition: "color 180ms ease",
  "&:hover, &:focus-visible": { color: NOIR.gold },
} as const;

const legalLinkSx = {
  color: alpha(NOIR.white, 0.55), fontFamily: MONO, fontSize: "0.7rem", textDecoration: "none !important",
  transition: "color 180ms ease", "&:hover, &:focus-visible": { color: NOIR.gold },
} as const;

export function SiteFooter({ footerAnchorRef, currentNarration }: SiteFooterProps) {
  const { navigateWithCurtain } = useTransitionCurtain();
  const currentYear = new Date().getFullYear();
  const handleInternalNavigation = (to: string) => (event: React.MouseEvent) => {
    if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      navigateWithCurtain(to);
    }
  };

  return (
    <Box component="footer" ref={footerAnchorRef} sx={{ bgcolor: NOIR.navyDeep, color: NOIR.white, mt: "auto", overflow: "hidden", position: "relative", py: { xs: 6, md: 8 } }}>
      <Box aria-hidden sx={{ background: `radial-gradient(circle at 82% 12%, ${alpha(NOIR.gold, 0.12)}, transparent 24%), linear-gradient(145deg, ${NOIR.navyDeep}, ${NOIR.navyFloor})`, inset: 0, pointerEvents: "none", position: "absolute" }} />
      <Container maxWidth="xl" sx={{ position: "relative" }}>
        <Grid container columnSpacing={{ xs: 4, md: 6, lg: 10 }} rowSpacing={{ xs: 5, md: 4 }}>
          <Grid size={{ xs: 12, md: 5, lg: 4 }}>
            <Stack spacing={2.5} sx={{ maxWidth: 410 }}>
              <Typography component="p" sx={{ color: NOIR.gold, fontFamily: MONO, fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.14em" }}>ABOUT PHITOPOLIS</Typography>
              <Typography sx={{ fontSize: { xs: "2rem", md: "2.45rem" }, fontWeight: 700, letterSpacing: "-0.045em", lineHeight: 1.02 }}>Making Tomorrow&apos;s Technology, Today</Typography>
              <Typography sx={{ color: alpha(NOIR.white, 0.68), fontSize: "0.96rem", lineHeight: 1.65, maxWidth: 360 }}>Research and Development FinTech Firm</Typography>
              <RouterButton to="/contact" variant="contained" endIcon={<ArrowForwardIcon />} sx={{ alignSelf: "flex-start", bgcolor: NOIR.gold, borderRadius: "8px", boxShadow: "none", color: NOIR.navyInk, fontFamily: MONO, fontSize: "0.75rem", fontWeight: 800, px: 2.25, py: 1.05, "&:hover": { bgcolor: NOIR.goldLight, boxShadow: `0 10px 28px ${alpha(NOIR.gold, 0.2)}` }, "&:active": { transform: "translateY(1px)" } }}>Start a conversation</RouterButton>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3, lg: 3 }}>
            <Stack spacing={2}>
              <Typography sx={footerLabelSx}>PATHWAYS</Typography>
              <Box component="nav" aria-label="Footer navigation" sx={{ display: "grid", gap: 0.35 }}>
                {PRIMARY_LINKS.map((link) => <Box component={RouterLink} key={link.to} to={link.to} underline="none" onClick={handleInternalNavigation(link.to)} sx={{ alignItems: "center", color: alpha(NOIR.white, 0.8), display: "inline-flex", fontSize: "0.96rem", fontWeight: 600, gap: 0.8, py: 0.45, textDecoration: "none !important", transition: `color 180ms ${EASE_OUT_EXPO_CSS}, transform 180ms ${EASE_OUT_EXPO_CSS}`, width: "fit-content", "&:hover, &:focus-visible": { color: NOIR.gold, transform: "translateX(4px)" } }}>{link.label}<ArrowForwardIcon sx={{ fontSize: 15 }} /></Box>)}
              </Box>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <Stack spacing={2.25}>
              <Typography sx={footerLabelSx}>CONTACT</Typography>
              <Stack spacing={1.65}>
                <Box><Typography sx={{ ...footerLabelSx, fontSize: "0.62rem", mb: 0.55 }}>INQUIRIES</Typography><Box component="a" href="mailto:info@phitopolis.com" sx={contactLinkSx}><MailIcon sx={{ color: NOIR.gold, fontSize: 17 }} />info@phitopolis.com</Box></Box>
                <Box><Typography sx={{ ...footerLabelSx, fontSize: "0.62rem", mb: 0.55 }}>CAREERS</Typography><Box component="a" href="mailto:jobs@phitopolis.com" sx={contactLinkSx}><MailIcon sx={{ color: NOIR.gold, fontSize: 17 }} />jobs@phitopolis.com</Box></Box>
                <Box sx={{ display: "flex", gap: 1, pt: 0.2 }}><LocationOnIcon sx={{ color: NOIR.gold, fontSize: 18, mt: 0.1 }} /><Typography sx={{ color: alpha(NOIR.white, 0.68), fontSize: "0.86rem", lineHeight: 1.55 }}>27/F Ecotower, BGC<br />Metro Manila, Philippines</Typography></Box>
              </Stack>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, lg: 2 }} sx={{ display: { xs: "none", lg: "block" } }}><Box sx={{ height: "100%", minHeight: 220, opacity: 0.85, position: "relative" }}><LogoParticleField /></Box></Grid>
        </Grid>
        <Box sx={{ borderTop: `1px solid ${alpha(NOIR.white, 0.12)}`, mt: { xs: 5, md: 7 }, pt: 2.25 }}>
          <Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "flex-start", md: "center" }} justifyContent="space-between" spacing={2}>
            <Stack direction="row" spacing={2.25} sx={{ flexWrap: "wrap" }}>
              <Typography sx={{ color: alpha(NOIR.white, 0.55), fontFamily: MONO, fontSize: "0.7rem" }}>© {currentYear} Phitopolis International Corp.</Typography>
              {[{ label: "Privacy", to: "/privacy" }, { label: "Terms", to: "/terms" }].map((link) => <Box component={RouterLink} key={link.to} to={link.to} underline="none" sx={legalLinkSx}>{link.label}</Box>)}
            </Stack>
            {currentNarration && <Box component={RouterLink} to={currentNarration.next} underline="none" onClick={handleInternalNavigation(currentNarration.next)} sx={{ alignItems: "center", color: NOIR.white, display: "inline-flex", fontFamily: MONO, fontSize: "0.7rem", fontWeight: 700, gap: 1, letterSpacing: "0.04em", textDecoration: "none !important", transition: `color 180ms ${EASE_OUT_EXPO_CSS}`, "&:hover, &:focus-visible": { color: NOIR.gold } }}>Continue to {currentNarration.label}<ArrowForwardIcon sx={{ fontSize: 16 }} /></Box>}
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
