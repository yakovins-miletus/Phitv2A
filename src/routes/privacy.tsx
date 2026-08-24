import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import { alpha } from "@mui/material/styles";
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/shared/components/PageHeader";
import { Reveal } from "@/shared/components/Reveal";
import { Section } from "@/shared/components/Section";
import { pageHead } from "@/shared/seo";
import { MONO } from "@/shared/theme/theme";

export const Route = createFileRoute("/privacy")({
  head: () =>
    pageHead(
      "Privacy Policy · Phitopolis",
      "How Phitopolis International Corp. collects, uses, and protects personal data submitted through this site.",
      undefined,
      // noindex while every section body is an unreviewed placeholder.
      // A legal page carries obligations the moment it is public, and a
      // crawler cannot tell scaffold from policy. Remove this once
      // counsel-approved text lands.
      { noindex: true },
    ),
  component: PrivacyPage,
});

// Standard structural skeleton for a privacy policy. Headings only — every
// section body is a placeholder pending counsel-approved text (see
// LegalSectionPlaceholder below). Do not fill these in without legal review.
const PRIVACY_SECTIONS = [
  { id: "scope", heading: "Scope of This Policy" },
  { id: "controller", heading: "Data Controller" },
  { id: "collection", heading: "Information We Collect" },
  { id: "use", heading: "How We Use Your Information" },
  { id: "legal-basis", heading: "Legal Basis for Processing" },
  { id: "retention", heading: "Data Retention" },
  { id: "third-parties", heading: "Third-Party Service Providers & Disclosures" },
  { id: "cookies", heading: "Cookies & Similar Technologies" },
  { id: "transfers", heading: "International Data Transfers" },
  { id: "rights", heading: "Your Privacy Rights" },
  { id: "children", heading: "Children's Privacy" },
  { id: "security", heading: "Data Security" },
  { id: "changes", heading: "Changes to This Policy" },
  { id: "contact", heading: "Contact Us & Data Requests" },
] as const;

/** Visible, unmissable marker that a section's legal text has not been
 *  written or approved yet. This is a scaffold, not a policy — no clause
 *  text is invented here, only the structural heading skeleton these
 *  documents share. */
function LegalSectionPlaceholder({ id, heading }: { id: string; heading: string }) {
  return (
    <Box component="section" aria-labelledby={id} sx={{ py: { xs: 3, md: 3.5 }, borderBottom: 1, borderColor: "divider" }}>
      <Typography id={id} variant="h2" component="h2" sx={{ fontSize: { xs: "1.3rem", md: "1.45rem" }, mb: 1.75 }}>
        {heading}
      </Typography>
      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          p: 2.25,
          borderRadius: 2,
          border: "1px dashed",
          borderColor: "warning.main",
          bgcolor: (theme) => alpha(theme.palette.warning.main, 0.08),
        }}
      >
        <WarningAmberOutlinedIcon sx={{ color: "warning.main", flexShrink: 0, mt: "1px" }} fontSize="small" />
        <Stack spacing={0.4}>
          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: "0.7rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontWeight: 800,
              color: "warning.dark",
            }}
          >
            Awaiting legal review
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This section has no approved content yet. Do not publish without counsel-reviewed text.
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}

function PrivacyPage() {
  return (
    <Section>
      <PageHeader
        overline="Legal"
        title="Privacy Policy"
        lead="This page is a structural scaffold awaiting counsel-approved content — it does not yet describe Phitopolis's actual data practices."
      />

      <Reveal>
        <Alert severity="warning" sx={{ mb: { xs: 4, md: 5 } }}>
          <strong>Draft scaffold — not a published policy.</strong> Every section below is a
          placeholder. Nothing on this page has been reviewed or approved by legal counsel, and
          it must not be treated as Phitopolis's binding privacy policy until that review is
          complete.
        </Alert>
      </Reveal>

      <Stack sx={{ maxWidth: 820 }}>
        {PRIVACY_SECTIONS.map((section) => (
          <Reveal key={section.id}>
            <LegalSectionPlaceholder id={section.id} heading={section.heading} />
          </Reveal>
        ))}
      </Stack>
    </Section>
  );
}
