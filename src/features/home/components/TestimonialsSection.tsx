import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import { SectionBeat } from "@/shared/components/stage/SectionBeat";
import { aboutSection, sectionOrder } from "@/shared/sections";
import { NOIR } from "@/shared/theme/palette";
import { MONO, DISPLAY_FONT } from "@/shared/theme/theme";
import { BEAT_START, refreshPriorityFor } from "@/shared/motion/beatThresholds";
import { useReducedMotion } from "@/shared/motion";
import { NAV_ANCHORS } from "@/shared/components/NavbarContext";
import { useNavbarAnchor } from "@/shared/components/navbarHooks";

gsap.registerPlugin(ScrollTrigger);

/** Same page order as the `SectionBeat` wrapper below — derived from the
 *  registry via `sectionOrder`, rather than a second hand-written constant,
 *  because the card stagger runs on its own ScrollTrigger, scoped to this
 *  component's own ref rather than SectionBeat's (SectionBeat does not
 *  forward its internal ref). */
const TESTIMONIALS_ORDER = sectionOrder("testimonials");

/** Card entrance stagger, in seconds. */
const CARD_STAGGER = 0.08;

interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  colSpan: { xs: number; md: number };
}

const TESTIMONIALS: readonly Testimonial[] = [
  {
    id: "mikki",
    name: "Mikki",
    role: "Quantitative Researcher",
    quote:
      "Joining Phitopolis is one of the best decisions I've ever made. I am fortunate to be part of a deeply talented team where high-stakes collaboration is the default and everyone roots for each other's success on every trading model.",
    colSpan: { xs: 12, md: 6 },
  },
  {
    id: "tyrone",
    name: "Tyrone",
    role: "Graduate Trainee",
    quote:
      "What helped me the most were the teammates around me who mentored me and supported my growth. The sense of community stands out—asking questions is actively encouraged, providing the perfect runway to build production-grade instincts.",
    colSpan: { xs: 12, md: 6 },
  },
  {
    id: "patricia",
    name: "Patricia",
    role: "Data Scientist / Graduate Trainee",
    quote:
      "Phitopolis keeps you on your toes because every day brings a complex real-world puzzle. What makes it truly special are the people who genuinely support you in an environment that values deep mathematical curiosity, rigorous testing, and continuous learning.",
    colSpan: { xs: 12, md: 12 },
  },
  {
    id: "jes",
    name: "Jes",
    role: "DevOps Engineer",
    quote:
      "Working hands-on with people solving high-throughput latency problems gives you real-world experience transforming distributed open-source technologies and complex infrastructure into high-reliability business systems.",
    colSpan: { xs: 12, md: 6 },
  },
  {
    id: "ayesha",
    name: "Ayesha",
    role: "Software Engineer",
    quote:
      "The engineering atmosphere is transparent, demanding, and immensely collaborative. It provided the ideal environment to transition smoothly from an intern into a full-time low-latency systems engineer.",
    colSpan: { xs: 12, md: 6 },
  },
];

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <Grid
      className="testimonial-card-item"
      size={{ xs: testimonial.colSpan.xs, md: testimonial.colSpan.md }}
      sx={{ display: "flex" }}
    >
      <Box
        className="testimonial-card"
        sx={{
          position: "relative",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          bgcolor: "rgba(255, 255, 255, 0.92)",
          border: "1px solid",
          borderColor: "rgba(10, 42, 102, 0.1)",
          boxShadow: "0 12px 32px -8px rgba(10, 42, 102, 0.05)",
          borderRadius: 4,
          p: { xs: 3.5, md: 4.5 },
          transition: "border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease",
          "&:hover": {
            borderColor: "rgba(255, 199, 44, 0.5)",
            boxShadow: "0 24px 48px -12px rgba(10, 42, 102, 0.12)",
            transform: "translateY(-4px)",
          },
        }}
      >
        {/* Testimonial Quote */}
        <Typography
          variant="body1"
          sx={{
            fontSize: { xs: "1.05rem", md: testimonial.colSpan.md === 12 ? "1.2rem" : "1.1rem" },
            lineHeight: 1.65,
            fontWeight: 500,
            color: NOIR.navyDeep,
            mb: 4,
            flexGrow: 1,
            letterSpacing: "-0.01em",
          }}
        >
          &ldquo;{testimonial.quote}&rdquo;
        </Typography>

        {/* Author Details Footer */}
        <Box
          sx={{
            pt: 2.5,
            borderTop: "1px solid rgba(10, 42, 102, 0.08)",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Avatar
            sx={{
              width: 44,
              height: 44,
              bgcolor: NOIR.navyField,
              color: NOIR.frost,
              fontFamily: MONO,
              fontWeight: 700,
              fontSize: "0.95rem",
              border: "1px solid rgba(255, 199, 44, 0.3)",
            }}
          >
            {testimonial.name[0]}
          </Avatar>
          <Box>
            <Typography
              variant="h6"
              component="h3"
              sx={{
                fontWeight: 800,
                fontSize: "1rem",
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
                color: NOIR.navyDeep,
              }}
            >
              {testimonial.name}
            </Typography>
            <Typography
              sx={{
                fontFamily: MONO,
                fontSize: "0.75rem",
                color: NOIR.mist,
                fontWeight: 600,
                letterSpacing: "0.06em",
                mt: 0.25,
              }}
            >
              {testimonial.role}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Grid>
  );
}

export function TestimonialsSection() {
  const scopeRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const anchorRef = useNavbarAnchor(NAV_ANCHORS.ABOUT_TESTIMONIALS, { dark: false });

  useGSAP(
    () => {
      if (reduced === true || !scopeRef.current) return;
      const root = scopeRef.current;

      gsap.from(".testimonial-card-item", {
        opacity: 0,
        y: 36,
        stagger: CARD_STAGGER,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: root,
          start: BEAT_START,
          once: true,
          refreshPriority: refreshPriorityFor(TESTIMONIALS_ORDER),
          invalidateOnRefresh: true,
        },
      });
    },
    { scope: scopeRef, dependencies: [reduced] },
  );

  return (
    <SectionBeat section={aboutSection("testimonials")} muted>
      <Box
        ref={(el: HTMLDivElement | null) => {
          scopeRef.current = el;
          if (anchorRef) anchorRef.current = el;
        }}
        sx={{ width: "100%", py: { xs: 4, md: 8 } }}
      >
        <Grid container spacing={{ xs: 5, md: 8 }} sx={{ width: "100%" }}>
          {/* Left Column (Sticky Overview) */}
          <Grid
            size={{ xs: 12, lg: 4 }}
            sx={{
              position: { lg: "sticky" },
              top: "120px",
              height: "fit-content",
            }}
          >
            <Stack spacing={3.5}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ width: 8, height: 8, bgcolor: NOIR.gold }} />
                <Typography
                  sx={{
                    fontFamily: MONO,
                    fontSize: "0.75rem",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: NOIR.navyField,
                    fontWeight: 700,
                  }}
                >
                  ENGINEERING PERSPECTIVES
                </Typography>
              </Stack>

              <Typography
                variant="h2"
                component="h2"
                sx={{
                  fontFamily: DISPLAY_FONT,
                  fontWeight: 800,
                  fontSize: { xs: "2.5rem", sm: "3rem", md: "3.5rem" },
                  lineHeight: 1.05,
                  letterSpacing: "-0.035em",
                  color: NOIR.navyDeep,
                }}
              >
                At the core of our business is our people.
              </Typography>

              <Typography
                sx={{
                  fontSize: "1.1rem",
                  lineHeight: 1.65,
                  color: NOIR.mist,
                  maxWidth: 400,
                }}
              >
                Meet the researchers, engineers, and platform architects building the next generation of institutional financial technology in Manila.
              </Typography>
            </Stack>
          </Grid>

          {/* Right Column (Editorial Testimonial Bento Grid) */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Grid container spacing={3.5}>
              {TESTIMONIALS.map((testimonial) => (
                <TestimonialCard key={testimonial.id} testimonial={testimonial} />
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Box>
    </SectionBeat>
  );
}
