import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import { alpha } from "@mui/material/styles";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

import { StageSection } from "@/shared/components/StageSection";
import { homeSection } from "@/shared/sections";
import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";

interface Testimonial {
  name: string;
  role: string;
  text: string;
  bgColor: string;
  textColor: string;
  subColor: string;
  colSpan: { xs: number; md: number };
  yOffset?: number;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "MIKKI",
    role: "QUANTITATIVE RESEARCHER",
    text: "Joining Phitopolis is one of the best decisions I've ever made. I am fortunate to be part of a very talented team... It is refreshing to be in a work environment where everyone collaborates and roots for each other's success.",
    bgColor: "rgba(92, 113, 157, 0.95)",
    textColor: "#FFFFFF",
    subColor: "rgba(255, 255, 255, 0.75)",
    colSpan: { xs: 12, md: 6 },
    yOffset: 0
  },
  {
    name: "TYRONE",
    role: "GRADUATE TRAINEE",
    text: "What helped me the most were the teammates around me who mentored me and supported my growth. The sense of community... really stands out as it made it easier for me to ask questions and provided the perfect opportunity... to develop my skills.",
    bgColor: "rgba(0, 163, 224, 0.95)",
    textColor: "#FFFFFF",
    subColor: "rgba(255, 255, 255, 0.8)",
    colSpan: { xs: 12, md: 6 },
    yOffset: 40
  },
  {
    name: "PATRICIA",
    role: "DATA SCIENTIST / GRADUATE TRAINEE",
    text: "Phitopolis is the kind of place that keeps you on your toes — every day brings something new to learn and discover. What makes it truly special are the people who genuinely support you... You're encouraged to grow... in an environment that values teamwork, curiosity, and continuous learning.",
    bgColor: "rgba(5, 26, 59, 0.98)",
    textColor: "#FFFFFF",
    subColor: "rgba(255, 255, 255, 0.7)",
    colSpan: { xs: 12, md: 12 },
    yOffset: 0
  },
  {
    name: "JES",
    role: "DEVOPS ENGINEER",
    text: "Work in a highly collaborative development environment with people that are hands-on... Have a real-world experience in leveraging free and open-source technologies... and how the real-world problems and opportunities... are being transformed into a business avenue.",
    bgColor: "rgba(138, 158, 167, 0.95)",
    textColor: "#0A2A66",
    subColor: "rgba(10, 42, 102, 0.8)",
    colSpan: { xs: 12, md: 6 },
    yOffset: 0
  },
  {
    name: "AYESHA",
    role: "SOFTWARE ENGINEER",
    text: "I like how the atmosphere is very collaborative and everyone's just open to discuss everything... It has been a perfect place to transition from intern to a full time low-latency engineer.",
    bgColor: "rgba(10, 46, 92, 0.95)",
    textColor: "#FFFFFF",
    subColor: "rgba(255, 255, 255, 0.75)",
    colSpan: { xs: 12, md: 6 },
    yOffset: 40
  }
];

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const cardRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["0 1", "1 0.5"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [80, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 1], [0, 1, 1]);

  return (
    <Grid 
      size={{ xs: testimonial.colSpan.xs, md: testimonial.colSpan.md }} 
      sx={{ 
        mt: { xs: 0, md: `${testimonial.yOffset || 0}px` } 
      }}
    >
      <Box
        ref={cardRef}
        component={motion.div}
        style={{ y, opacity }}
        sx={{
          position: "relative",
          p: "1px", // for the moving border thickness
          borderRadius: "28px",
          height: "100%",
          overflow: "hidden",
          boxShadow: "0 15px 30px rgba(0,0,0,0.08)",
          // Subtle outer border that acts as base for the animated signal
          bgcolor: alpha(testimonial.textColor, 0.05),
        }}
      >
        {/* Animated Moving Border Signal */}
        <Box
          component={motion.div}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
          sx={{
            position: "absolute",
            top: "-50%",
            left: "-50%",
            width: "200%",
            height: "200%",
            background: `conic-gradient(from 0deg, transparent 70%, ${alpha(testimonial.textColor, 0.8)} 100%)`,
            zIndex: 0,
            pointerEvents: "none",
          }}
        />

        {/* Inner Card Content */}
        <Box
          sx={{
            position: "relative",
            bgcolor: testimonial.bgColor,
            color: testimonial.textColor,
            p: { xs: 4, md: 5 },
            borderRadius: "27px", // 1px smaller to fit perfectly inside the 28px outer radius
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backdropFilter: "blur(20px)",
            zIndex: 1,
          }}
        >
          {/* Decorative Quote Mark */}
          <Typography
            sx={{
              position: "absolute",
              top: -10,
              right: 16,
              fontSize: "8rem",
              lineHeight: 1,
              fontFamily: "serif",
              opacity: 0.05,
              userSelect: "none",
              pointerEvents: "none",
            }}
          >
            "
          </Typography>

          <Stack spacing={3} sx={{ height: "100%", position: "relative", zIndex: 1 }}>
            {/* Testimonial Quote Text */}
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: "1rem", md: "1.15rem" },
                lineHeight: 1.65,
                fontWeight: 500,
                opacity: 0.95,
                textWrap: "pretty",
                flex: 1,
                fontStyle: "italic"
              }}
            >
              "{testimonial.text}"
            </Typography>

            {/* Header: Avatar, Name, Role */}
            <Stack direction="row" spacing={2.5} alignItems="center">
              <Avatar
                sx={{
                  width: 52,
                  height: 52,
                  border: `2px solid ${alpha(testimonial.textColor, 0.2)}`,
                  bgcolor: alpha(testimonial.textColor, 0.1),
                  color: testimonial.textColor,
                  fontWeight: 800,
                  fontSize: "1.25rem"
                }}
              >
                {testimonial.name[0]}
              </Avatar>
              <Stack spacing={0.25}>
                <Typography
                  variant="h6"
                  component="h3"
                  sx={{
                    fontWeight: 800,
                    letterSpacing: "0.05em",
                    fontSize: "1rem",
                  }}
                >
                  {testimonial.name}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: MONO,
                    fontSize: "0.7rem",
                    color: testimonial.subColor,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                  }}
                >
                  {testimonial.role}
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        </Box>
      </Box>
    </Grid>
  );
}

export function TestimonialsSection() {
  return (
    <StageSection section={homeSection("testimonials")} muted>
      <Grid container spacing={{ xs: 4, md: 8 }} sx={{ width: "100%" }}>
        {/* Left Sticky Header Info Panel */}
        <Grid size={{ xs: 12, md: 4 }} sx={{ position: { md: "sticky" }, top: "120px", height: "fit-content" }}>
          <Stack spacing={4}>
            {/* Section Eyebrow */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography
                sx={{
                  fontFamily: MONO,
                  fontSize: "0.85rem",
                  color: NOIR.goldDark,
                  letterSpacing: "0.2em",
                  fontWeight: 700,
                }}
              >
                HEAR FROM OUR PEOPLE
              </Typography>
              <Box sx={{ width: 24, height: "1px", bgcolor: NOIR.gold }} />
            </Box>

            {/* Main Gunshot Title */}
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                fontSize: { xs: "2.5rem", sm: "3rem", md: "4rem" },
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                color: "text.primary",
              }}
            >
              At the core of our business is our People.
            </Typography>

            {/* Description */}
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                fontSize: "1.2rem",
                lineHeight: 1.7,
                maxWidth: 420,
              }}
            >
              Meet some of them, get inspired, and see how you will shape your future within Phitopolis.
            </Typography>
          </Stack>
        </Grid>

        {/* Right Testimonials Grid */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Grid container spacing={{ xs: 4, md: 5 }}>
            {TESTIMONIALS.map((testimonial) => (
              <TestimonialCard key={testimonial.name} testimonial={testimonial} />
            ))}
          </Grid>
        </Grid>
      </Grid>
    </StageSection>
  );
}
