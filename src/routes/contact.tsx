import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { createFileRoute } from "@tanstack/react-router";

import { ContactForm, EcotowerMap } from "@/features/contact";
import { CONTENT } from "@/shared/content";
import { PageHeader } from "@/shared/components/PageHeader";
import { Section } from "@/shared/components/Section";
import { pageHead } from "@/shared/seo";
import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";

const NEXT_STEPS = [
  { number: "01", line: "Your message lands with the partnerships team" },
  { number: "02", line: "It counts toward the inquiry metric on the R&D Lab dashboard" },
  { number: "03", line: "You get a reply within two business days" },
] as const;

function NextStepsTimeline() {
  return (
    <Stack sx={{ position: "relative", pl: 0.5 }}>
      {NEXT_STEPS.map((step, index) => {
        const isLast = index === NEXT_STEPS.length - 1;
        return (
          <Stack key={step.number} direction="row" spacing={2.5} sx={{
            "&:hover .timeline-node": { transform: "scale(1.5)", bgcolor: "primary.main", borderColor: "primary.main" }
          }}>
            <Stack alignItems="center" sx={{ flexShrink: 0 }}>
              <Box
                className="timeline-node"
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  bgcolor: NOIR.gold,
                  border: 2,
                  borderColor: NOIR.ink,
                  mt: 0.5,
                  transition: "all 0.2s ease",
                }}
              />
              {isLast ? null : <Box sx={{ width: "2px", flexGrow: 1, bgcolor: "divider", my: 0.5 }} />}
            </Stack>
            <Box sx={{ pb: isLast ? 0 : 3.5 }}>
              <Typography
                sx={{ fontFamily: MONO, fontSize: "0.7rem", letterSpacing: "0.2em", color: "text.secondary" }}
              >
                {step.number}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
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
        overline="Contact"
        title="Bring us a hard problem"
        lead="Partnership inquiries, data questions, or a paper you want to argue with — we read everything"
      />
      <Grid container spacing={6} sx={{ mb: 8 }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <ContactForm />
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          {/* macOS Inspector Panel Card */}
          <Box
            sx={{
              borderRadius: "16px",
              overflow: "hidden",
              border: "1px solid rgba(10, 42, 102, 0.15)",
              bgcolor: "#FFFFFF",
              boxShadow: "0 20px 40px rgba(10, 42, 102, 0.08)",
              p: 4,
            }}
          >
            <Stack spacing={3}>
              <Typography variant="h4" component="h2" sx={{ fontWeight: 700 }}>
                What happens next
              </Typography>
              <NextStepsTimeline />
              <Stack spacing={1.5} sx={{ pt: 3, borderTop: 1, borderColor: "divider" }}>
                <Typography
                  sx={{ fontFamily: MONO, fontSize: "0.72rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "text.secondary" }}
                >
                  Reach us directly
                </Typography>
                <Stack spacing={0.5}>
                  <Link href={`mailto:${CONTENT.contact.generalInquiries}`} underline="hover" color="primary" sx={{ fontWeight: 600 }}>
                    {CONTENT.contact.generalInquiries}
                  </Link>
                  <Typography variant="caption" color="text.secondary">
                    General &amp; partnership inquiries
                  </Typography>
                </Stack>
                <Stack spacing={0.5}>
                  <Link href={`mailto:${CONTENT.contact.careersEmail}`} underline="hover" color="primary" sx={{ fontWeight: 600 }}>
                    {CONTENT.contact.careersEmail}
                  </Link>
                  <Typography variant="caption" color="text.secondary">
                    Careers &amp; the graduate program
                  </Typography>
                </Stack>
              </Stack>
              <Stack spacing={1} sx={{ pt: 2, borderTop: 1, borderColor: "divider" }}>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                  Phitopolis International Corp. · 27/F Ecotower, Bonifacio Global City,
                  Taguig, Metro Manila, Philippines, 1634
                </Typography>
              </Stack>
            </Stack>
          </Box>
        </Grid>
      </Grid>

      {/* Featured BGC Ecotower Interactive Map Window */}
      <Box sx={{ mt: 4 }}>
        <Typography
          sx={{
            fontFamily: MONO,
            fontSize: "0.78rem",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: NOIR.navyField,
            fontWeight: 700,
            mb: 2.5,
          }}
        >
          HEADQUARTERS LOCATION // BONIFACIO GLOBAL CITY
        </Typography>
        <EcotowerMap />
      </Box>
    </Section>
  );
}
