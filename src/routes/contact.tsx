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
import { alpha } from "@mui/material/styles";

import { NOIR } from "@/shared/theme/palette";
import { MONO, TYPE_SCALE } from "@/shared/theme/theme";
import { useNavbarAnchor, NAV_ANCHORS } from "@/shared/components/NavbarContext";

// Three steps, and the middle one used to undo the third: it promised
// "immediate review" directly above "within 24 to 48 business hours". A reader
// notices that. It also described an internal tool ("our active inquiry
// dashboard") that tells the sender nothing about what happens to their
// message. Both replaced with what the sender actually cares about.
const NEXT_STEPS = [
  { line: "Your message goes straight to our engineering and partnerships leads." },
  { line: "We read it ourselves. No auto-reply, no ticket queue, no routing bot." },
  { line: "You get a reply from a person within 24 to 48 business hours." },
] as const;

function NextStepsTimeline() {
  return (
    <Stack sx={{ position: "relative", pl: 0.5 }}>
      {NEXT_STEPS.map((step, index) => {
        const isLast = index === NEXT_STEPS.length - 1;
        return (
          <Stack
            key={index}
            direction="row"
            spacing={2.5}
            sx={{
              "&:hover .timeline-node": { transform: "scale(1.4)", bgcolor: "var(--accent)", borderColor: "var(--accent)" }
            }}
          >
            <Stack alignItems="center" sx={{ flexShrink: 0 }}>
              <Box
                className="timeline-node"
                sx={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  bgcolor: NOIR.ink,
                  border: "2px solid var(--accent)",
                  mt: 0.5,
                  transition: "all 0.25s ease",
                }}
              />
              {isLast ? null : <Box sx={{ width: "2px", flexGrow: 1, bgcolor: `${alpha(NOIR.ink, 0.12)}`, my: 0.8 }} />}
            </Stack>
            <Box sx={{ pb: isLast ? 0 : 3.5, pt: 0.2 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, color: "text.primary", lineHeight: 1.5 }}>
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
      "Start a conversation with the Phitopolis partnerships team in Bonifacio Global City, Metro Manila.",
    ),
  component: ContactPage,
});

function ContactPage() {
  const anchorRef = useNavbarAnchor(NAV_ANCHORS.CONTACT_PAGE, { dark: false });

  return (
    <Section ref={anchorRef}>
      <PageHeader
        overline="Contact & Partnerships"
        title="Direct Inquiries"
        lead="Whether for partnership inquiries, data questions, or research paper discussions, our engineering leadership team in Bonifacio Global City reads every message."
      />

      <Grid container spacing={6} alignItems="stretch" sx={{ mb: 10 }}>
        {/* Contact Form Column */}
        <Grid size={{ xs: 12, md: 7 }} sx={{ display: "flex", flexDirection: "column" }}>
          <ContactForm />
        </Grid>

        {/* Inspector Column */}
        <Grid size={{ xs: 12, md: 5 }} sx={{ display: "flex", flexDirection: "column" }}>
          <Stack spacing={5} sx={{ height: "100%" }}>
            {/* No eyebrow. It read "INQUIRY PROTOCOL", which is jargon for a
                contact page, and its replacement would have restated the
                heading directly below it word for word. */}
            <Box>
              <Typography variant="h3" component="h2" sx={{ fontWeight: 800, color: "text.primary" }}>
                What happens next
              </Typography>
            </Box>

            <NextStepsTimeline />

            {/* Direct Reach Channels — quiet mono labels over plain links,
                no nested surfaces. */}
            <Stack spacing={2.5}>
              <Typography
                sx={{ fontFamily: MONO, fontSize: TYPE_SCALE.caption, letterSpacing: "0.18em", textTransform: "uppercase", color: "text.secondary", fontWeight: 700 }}
              >
                Direct Channels
              </Typography>

              <Stack spacing={0.5}>
                <Typography sx={{ fontFamily: MONO, fontSize: TYPE_SCALE.caption, color: "text.secondary", fontWeight: 700 }}>
                  GENERAL &amp; PARTNERSHIPS
                </Typography>
                <Link href={`mailto:${CONTENT.contact.generalInquiries}`} underline="hover" color="primary" sx={{ fontWeight: 800, fontSize: TYPE_SCALE.subtitle1 }}>
                  {CONTENT.contact.generalInquiries}
                </Link>
              </Stack>

              <Stack spacing={0.5}>
                <Typography sx={{ fontFamily: MONO, fontSize: TYPE_SCALE.caption, color: "text.secondary", fontWeight: 700 }}>
                  CAREERS &amp; GRADUATE FELLOWSHIPS
                </Typography>
                <Link href={`mailto:${CONTENT.contact.careersEmail}`} underline="hover" color="primary" sx={{ fontWeight: 800, fontSize: TYPE_SCALE.subtitle1 }}>
                  {CONTENT.contact.careersEmail}
                </Link>
              </Stack>
            </Stack>

            {/* HQ Address Info */}
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, fontSize: TYPE_SCALE.body2 }}>
                <strong>Phitopolis International Corp.</strong><br />
                27/F Ecotower, 32nd St. cor. 9th Ave., Bonifacio Global City, Taguig, Metro Manila, Philippines 1634
              </Typography>
            </Stack>
          </Stack>
        </Grid>
      </Grid>

      {/* Interactive BGC Ecotower Map Section */}
      <Box sx={{ mt: 8, mb: 10 }}>
        <EcotowerMap />
      </Box>

      {/* ── COMMONLY ASKED QUESTIONS (FAQ) SECTION ── */}
      <ContactFAQ />
    </Section>
  );
}
