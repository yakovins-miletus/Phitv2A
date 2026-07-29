import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { createFileRoute } from "@tanstack/react-router";

import { ContactForm, EcotowerMap, ContactFAQ } from "@/features/contact";
import { CONTENT } from "@/shared/content";
import { PageHeader } from "@/shared/components/PageHeader";
import { Section } from "@/shared/components/Section";
import { pageHead } from "@/shared/seo";
import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";

const NEXT_STEPS = [
  { number: "01", line: "Your message lands directly with our engineering & partnerships leadership team." },
  { number: "02", line: "It is logged into our active inquiry dashboard for immediate review." },
  { number: "03", line: "You get a direct human response within 24 to 48 business hours." },
] as const;

function NextStepsTimeline() {
  return (
    <Stack sx={{ position: "relative", pl: 0.5 }}>
      {NEXT_STEPS.map((step, index) => {
        const isLast = index === NEXT_STEPS.length - 1;
        return (
          <Stack
            key={step.number}
            direction="row"
            spacing={2.5}
            sx={{
              "&:hover .timeline-node": { transform: "scale(1.4)", bgcolor: "#FFC72C", borderColor: "#FFC72C" }
            }}
          >
            <Stack alignItems="center" sx={{ flexShrink: 0 }}>
              <Box
                className="timeline-node"
                sx={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  bgcolor: "#0A2A66",
                  border: "2px solid #FFC72C",
                  mt: 0.5,
                  transition: "all 0.25s ease",
                }}
              />
              {isLast ? null : <Box sx={{ width: "2px", flexGrow: 1, bgcolor: "rgba(10, 42, 102, 0.12)", my: 0.8 }} />}
            </Stack>
            <Box sx={{ pb: isLast ? 0 : 3.5 }}>
              <Typography
                sx={{ fontFamily: MONO, fontSize: "0.72rem", letterSpacing: "0.2em", color: "#FFC72C", fontWeight: 800 }}
              >
                STEP {step.number}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 500, color: "text.primary", lineHeight: 1.5 }}>
                {step.line}
              </Typography>
            </Box>
          </Stack>
        );
      })}
    </Stack>
  );
}

export const Route = createFileRoute("/contact")({
  head: () =>
    pageHead(
      "Contact · Phitopolis",
      "Bring us a hard problem. Start a conversation with the Phitopolis partnerships team — Bonifacio Global City, Metro Manila.",
    ),
  component: ContactPage,
});

function ContactPage() {
  return (
    <Section>
      <PageHeader
        overline="Contact & Partnerships"
        title="Bring us a hard problem"
        lead="Partnership inquiries, data questions, or a research paper you want to discuss — our engineering leadership team in Bonifacio Global City reads every single message."
      />

      <Grid container spacing={6} alignItems="stretch" sx={{ mb: 10 }}>
        {/* Contact Form Column */}
        <Grid size={{ xs: 12, md: 7 }} sx={{ display: "flex", flexDirection: "column" }}>
          <ContactForm />
        </Grid>

        {/* Inspector Panel Column */}
        <Grid size={{ xs: 12, md: 5 }} sx={{ display: "flex", flexDirection: "column" }}>
          <Box
            sx={{
              height: "100%",
              borderRadius: "24px",
              overflow: "hidden",
              border: "1px solid rgba(10, 42, 102, 0.12)",
              bgcolor: "background.paper",
              boxShadow: "0 20px 50px rgba(10, 42, 102, 0.06)",
              p: { xs: 3.5, md: 4.5 },
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <Stack spacing={3.5}>
              <Box>
                <Typography
                  sx={{
                    fontFamily: MONO,
                    fontSize: "0.72rem",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "#FFC72C",
                    fontWeight: 800,
                    mb: 0.5,
                  }}
                >
                  INQUIRY PROTOCOL
                </Typography>
                <Typography variant="h3" component="h2" sx={{ fontWeight: 800, color: "text.primary" }}>
                  What happens next
                </Typography>
              </Box>

              <NextStepsTimeline />

              {/* Direct Reach Channels */}
              <Stack spacing={2} sx={{ pt: 3, borderTop: "1px solid rgba(10, 42, 102, 0.08)" }}>
                <Typography
                  sx={{ fontFamily: MONO, fontSize: "0.72rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "text.secondary", fontWeight: 700 }}
                >
                  Direct Channels
                </Typography>

                <Box sx={{ p: 2, borderRadius: "12px", bgcolor: "rgba(10, 42, 102, 0.03)", border: "1px solid rgba(10, 42, 102, 0.08)" }}>
                  <Stack spacing={0.5}>
                    <Typography variant="caption" sx={{ fontFamily: MONO, color: "text.secondary", fontWeight: 700 }}>
                      GENERAL &amp; PARTNERSHIPS
                    </Typography>
                    <Link href={`mailto:${CONTENT.contact.generalInquiries}`} underline="hover" color="primary" sx={{ fontWeight: 800, fontSize: "1.05rem" }}>
                      {CONTENT.contact.generalInquiries}
                    </Link>
                  </Stack>
                </Box>

                <Box sx={{ p: 2, borderRadius: "12px", bgcolor: "rgba(10, 42, 102, 0.03)", border: "1px solid rgba(10, 42, 102, 0.08)" }}>
                  <Stack spacing={0.5}>
                    <Typography variant="caption" sx={{ fontFamily: MONO, color: "text.secondary", fontWeight: 700 }}>
                      CAREERS &amp; GRADUATE FELLOWSHIPS
                    </Typography>
                    <Link href={`mailto:${CONTENT.contact.careersEmail}`} underline="hover" color="primary" sx={{ fontWeight: 800, fontSize: "1.05rem" }}>
                      {CONTENT.contact.careersEmail}
                    </Link>
                  </Stack>
                </Box>
              </Stack>

              {/* HQ Address Info */}
              <Stack spacing={1} sx={{ pt: 2, borderTop: "1px solid rgba(10, 42, 102, 0.08)" }}>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, fontSize: "0.88rem" }}>
                  <strong>Phitopolis International Corp.</strong><br />
                  27/F Ecotower, 32nd St. cor. 9th Ave., Bonifacio Global City, Taguig, Metro Manila, Philippines 1634
                </Typography>
              </Stack>
            </Stack>
          </Box>
        </Grid>
      </Grid>

      {/* Interactive BGC Ecotower Map Section */}
      <Box sx={{ mt: 8, mb: 10 }}>
        <Typography
          sx={{
            fontFamily: MONO,
            fontSize: "0.78rem",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: NOIR.navyField,
            fontWeight: 800,
            mb: 2.5,
          }}
        >
          HEADQUARTERS LOCATION // BONIFACIO GLOBAL CITY
        </Typography>
        <EcotowerMap />
      </Box>

      {/* ── COMMONLY ASKED QUESTIONS (FAQ) SECTION ── */}
      <ContactFAQ />
    </Section>
  );
}
