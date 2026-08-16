import { useId, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import { SpecularButton as Button } from "@/shared/components/ui/specular";
import Chip from "@mui/material/Chip";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import WorkIcon from "@mui/icons-material/Work";
import SendIcon from "@mui/icons-material/Send";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { createFileRoute } from "@tanstack/react-router";

import { CAREER_POSITIONS } from "@/shared/careersData";
import { Reveal } from "@/shared/components/Reveal";
import { Section } from "@/shared/components/Section";
import { RouterButton } from "@/shared/components/RouterLink";
import { messageFromError } from "@/shared/api/errors";
import { pageHead } from "@/shared/seo";
import { MONO } from "@/shared/theme/theme";
import { useSubmitContactMessage } from "@/features/contact/api";

const lightTextFieldSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "rgba(10, 42, 102, 0.03)",
    color: "text.primary",
    borderRadius: "12px",
    "& fieldset": { borderColor: "rgba(10, 42, 102, 0.18)" },
    "&:hover fieldset": { borderColor: "primary.main" },
    "&.Mui-focused fieldset": { borderColor: "primary.main", borderWidth: 1 },
  },
  "& .MuiInputLabel-root": {
    color: "text.secondary",
    "&.Mui-focused": { color: "primary.main" },
  },
};

/**
 * This form POSTs to the same `/api/v1/contact-messages` endpoint as
 * ContactForm.tsx, so it needs the same client-side guardrails — duplicated
 * here rather than extracted to a shared module because that would mean
 * adding a file outside this fix's owned file list. Field names differ
 * (fullName/university/coverNote vs. name/subject/message) since this form
 * composes its own `message` payload; `fullName` maps 1:1 to the server's
 * `name` constraint, and `coverNote` is capped so the assembled message
 * (boilerplate + cover note) stays under the server's message max.
 */
const RULES = {
  fullName: { min: 2, max: 100, label: "Full name" },
  university: { min: 2, max: 150, label: "University / Current Company" },
  coverNote: { max: 3500, label: "Cover Note" },
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ApplicationValues {
  fullName: string;
  email: string;
  university: string;
  coverNote: string;
}

const FIELD_ORDER = ["fullName", "email", "university", "coverNote"] as const;
type ApplicationField = (typeof FIELD_ORDER)[number];
type FieldErrors = Partial<Record<ApplicationField, string>>;

function validate(values: ApplicationValues): FieldErrors {
  const errors: FieldErrors = {};
  const nameLength = values.fullName.trim().length;
  if (nameLength < RULES.fullName.min) {
    errors.fullName = `${RULES.fullName.label} must be at least ${String(RULES.fullName.min)} characters.`;
  } else if (nameLength > RULES.fullName.max) {
    errors.fullName = `${RULES.fullName.label} must be at most ${String(RULES.fullName.max)} characters.`;
  }
  if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  const universityLength = values.university.trim().length;
  if (universityLength < RULES.university.min) {
    errors.university = `${RULES.university.label} must be at least ${String(RULES.university.min)} characters.`;
  } else if (universityLength > RULES.university.max) {
    errors.university = `${RULES.university.label} must be at most ${String(RULES.university.max)} characters.`;
  }
  if (values.coverNote.trim().length > RULES.coverNote.max) {
    errors.coverNote = `${RULES.coverNote.label} must be at most ${String(RULES.coverNote.max)} characters.`;
  }
  return errors;
}

export const Route = createFileRoute("/careers/$jobId")({
  head: ({ params }) => {
    const job = CAREER_POSITIONS.find((p) => p.id === params.jobId);
    return pageHead(
      `${job ? job.title : "Position Details"} | Phitopolis Careers`,
      job ? job.summary : "Explore career & graduate opportunities at Phitopolis R&D Manila."
    );
  },
  component: JobDetailPage,
});

function JobDetailPage() {
  const { jobId } = Route.useParams();
  const job = CAREER_POSITIONS.find((p) => p.id === jobId);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [university, setUniversity] = useState("");
  const [coverNote, setCoverNote] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  const mutation = useSubmitContactMessage();

  // Stable id prefix so each field's helperText is wired to it via
  // aria-describedby (MUI only generates that link when the field has an id).
  const formId = useId();
  const fullNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const universityRef = useRef<HTMLInputElement>(null);
  const coverNoteRef = useRef<HTMLInputElement>(null);
  const fieldRefs: Record<ApplicationField, React.RefObject<HTMLInputElement | null>> = {
    fullName: fullNameRef,
    email: emailRef,
    university: universityRef,
    coverNote: coverNoteRef,
  };
  const errorSummary = FIELD_ORDER.map((field) => errors[field]).filter(
    (message): message is string => Boolean(message),
  );

  if (!job) {
    return (
      <Section>
        <Stack spacing={3} alignItems="flex-start" sx={{ pt: 16, pb: 16 }}>
          <Typography variant="h2">Position Not Found</Typography>
          <Typography variant="body1">The requested job position could not be found.</Typography>
          <RouterButton to="/careers" variant="contained">
            RETURN TO CAREERS
          </RouterButton>
        </Stack>
      </Section>
    );
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nextErrors = validate({ fullName, email, university, coverNote });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      // Deliberately left without `noValidate`: the browser's own HTML5
      // validation (required/type=email) still runs first and auto-focuses
      // an empty/malformed field before this handler ever sees the submit.
      // This custom pass only catches what HTML5 can't (length limits, a
      // stricter email check), so it takes over focus management only for
      // those — moving to the first invalid field the same way the browser
      // would have.
      const firstInvalidField = FIELD_ORDER.find((field) => nextErrors[field]);
      if (firstInvalidField) {
        fieldRefs[firstInvalidField].current?.focus();
      }
      return;
    }
    mutation.mutate({
      name: fullName.trim(),
      email: email.trim(),
      subject: `Application: ${job.title}`,
      message: `Applicant: ${fullName.trim()}\nInstitution/Company: ${university.trim()}\nPosition: ${job.title}\n\nCover Note:\n${coverNote.trim()}`,
      company_website: companyWebsite,
    });
  };

  return (
    <Box sx={{ width: "100%", bgcolor: "background.default", pt: { xs: 12, md: 18 }, pb: { xs: 10, md: 16 } }}>
      <Section>
        <Stack spacing={{ xs: 6, md: 8 }}>
          {/* Back Navigation Button */}
          <Reveal>
            <RouterButton
              to="/careers"
              variant="text"
              startIcon={<ArrowBackIcon />}
              sx={{
                fontFamily: MONO,
                fontWeight: 700,
                color: "#0A2A66",
                px: 0,
              }}
            >
              BACK TO CAREERS & GRADUATE POSITIONS
            </RouterButton>
          </Reveal>

          {/* Job Header Info */}
          <Stack spacing={2} sx={{ maxWidth: 840 }}>
            <Reveal>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                <Chip
                  label={job.badge}
                  size="small"
                  sx={{
                    fontFamily: MONO,
                    fontWeight: 800,
                    fontSize: "0.72rem",
                    bgcolor: "secondary.main",
                    color: "secondary.contrastText",
                  }}
                />
                <Chip
                  label={job.type}
                  size="small"
                  sx={{
                    fontFamily: MONO,
                    fontWeight: 700,
                    fontSize: "0.7rem",
                    bgcolor: "rgba(10, 42, 102, 0.08)",
                  }}
                />
              </Box>
            </Reveal>

            <Reveal delay={0.1}>
              <Typography variant="h1" component="h1" sx={{ fontWeight: 800, color: "text.primary" }}>
                {job.title}
              </Typography>
            </Reveal>

            <Reveal delay={0.2}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", color: "text.secondary" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                  <LocationOnIcon sx={{ fontSize: "1.1rem" }} />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {job.location}
                  </Typography>
                </Box>
                <Typography variant="body2">•</Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                  <WorkIcon sx={{ fontSize: "1.1rem" }} />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {job.department}
                  </Typography>
                </Box>
              </Box>
            </Reveal>
          </Stack>

          {/* Grid Layout: Job Description vs Application Form */}
          <Grid container spacing={{ xs: 6, md: 8 }}>
            {/* Left Column: Role Details */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Stack spacing={5}>
                {/* Overview */}
                <Stack spacing={2}>
                  <Typography variant="h3" component="h2" sx={{ fontWeight: 800, color: "text.primary" }}>
                    Program Overview
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7, fontSize: "1.05rem" }}>
                    {job.description}
                  </Typography>
                </Stack>

                {/* Key Responsibilities */}
                <Stack spacing={2}>
                  <Typography variant="h3" component="h2" sx={{ fontWeight: 800, color: "text.primary" }}>
                    Key Responsibilities
                  </Typography>
                  <Stack spacing={1.5}>
                    {job.responsibilities.map((item, idx) => (
                      <Box key={idx} sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "var(--accent)", mt: 1, flexShrink: 0 }} />
                        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                          {item}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Stack>

                {/* Candidate Requirements */}
                <Stack spacing={2}>
                  <Typography variant="h3" component="h2" sx={{ fontWeight: 800, color: "text.primary" }}>
                    Qualifications & Requirements
                  </Typography>
                  <Stack spacing={1.5}>
                    {job.requirements.map((item, idx) => (
                      <Box key={idx} sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#0A2A66", mt: 1, flexShrink: 0 }} />
                        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                          {item}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Stack>

                {/* Program Benefits */}
                <Stack spacing={2}>
                  <Typography variant="h3" component="h2" sx={{ fontWeight: 800, color: "text.primary" }}>
                    What We Offer
                  </Typography>
                  <Stack spacing={1.5}>
                    {job.benefits.map((item, idx) => (
                      <Box key={idx} sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                        <CheckCircleOutlineIcon sx={{ color: "var(--accent-fg)", fontSize: "1.2rem", mt: 0.2, flexShrink: 0 }} />
                        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6, fontWeight: 500 }}>
                          {item}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Stack>
              </Stack>
            </Grid>

            {/* Right Column: Interactive Application Form */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Box
                sx={{
                  position: { md: "sticky" },
                  top: 120,
                  p: { xs: 4, md: 5 },
                  borderRadius: 6,
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "rgba(10, 42, 102, 0.12)",
                  boxShadow: "0 12px 40px rgba(10, 42, 102, 0.06)",
                }}
              >
                {mutation.isSuccess ? (
                  <Stack spacing={3} alignItems="center" textAlign="center" sx={{ py: 4 }}>
                    <CheckCircleOutlineIcon sx={{ fontSize: "4rem", color: "var(--accent-fg)" }} />
                    <Typography variant="h3" component="h2" sx={{ fontWeight: 800 }}>
                      Application Received!
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      Thank you for applying to the <strong>{job.title}</strong> position. Our technical recruitment team will review your application and reach out shortly.
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        mutation.reset();
                        setFullName("");
                        setEmail("");
                        setUniversity("");
                        setCoverNote("");
                        setCompanyWebsite("");
                        setErrors({});
                      }}
                      sx={{ mt: 2, fontFamily: MONO, fontWeight: 700 }}
                    >
                      SUBMIT ANOTHER APPLICATION
                    </Button>
                  </Stack>
                ) : (
                  <Stack component="form" onSubmit={handleSubmit} spacing={3}>
                    {/* Client-side validation summary — role="alert" (MUI Alert's
                        default) so a failed submit is announced. HTML5
                        required/type=email still runs first and auto-focuses
                        empty/malformed fields; this only fires for what that
                        misses (length limits, a stricter email check). */}
                    {errorSummary.length > 0 ? (
                      <Alert severity="error">{errorSummary.join(" ")}</Alert>
                    ) : null}
                    {mutation.isError ? (
                      <Alert severity="error">{messageFromError(mutation.error)}</Alert>
                    ) : null}
                    <Stack spacing={1}>
                      <Typography variant="h3" component="h2" sx={{ fontWeight: 800, fontSize: "1.5rem", color: "text.primary" }}>
                        Apply for this Position
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Submit your details below for direct evaluation by Phitopolis R&D engineering leads.
                      </Typography>
                    </Stack>

                    <TextField
                      id={`${formId}-fullName`}
                      label="Full Name"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      error={errors.fullName !== undefined}
                      helperText={errors.fullName ?? " "}
                      fullWidth
                      inputRef={fullNameRef}
                      sx={lightTextFieldSx}
                    />

                    <TextField
                      id={`${formId}-email`}
                      label="Email Address"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      error={errors.email !== undefined}
                      helperText={errors.email ?? " "}
                      fullWidth
                      inputRef={emailRef}
                      sx={lightTextFieldSx}
                    />

                    <TextField
                      id={`${formId}-university`}
                      label="University / Current Company"
                      required
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                      error={errors.university !== undefined}
                      helperText={errors.university ?? " "}
                      placeholder="e.g. DLSU, Ateneo, UP, or Current Firm"
                      fullWidth
                      inputRef={universityRef}
                      sx={lightTextFieldSx}
                    />

                    <TextField
                      id={`${formId}-coverNote`}
                      label="Cover Note / Relevant Projects"
                      multiline
                      rows={3}
                      value={coverNote}
                      onChange={(e) => setCoverNote(e.target.value)}
                      error={errors.coverNote !== undefined}
                      helperText={errors.coverNote ?? " "}
                      placeholder="Tell us briefly about your technical background or GitHub portfolio..."
                      fullWidth
                      inputRef={coverNoteRef}
                      sx={lightTextFieldSx}
                    />

                    {/* Honeypot — same treatment as ContactForm.tsx: visually
                        hidden off-screen, aria-hidden, and out of the tab
                        order, so only bots that fill every field find it. */}
                    <Box
                      aria-hidden
                      sx={{ position: "absolute", left: "-10000px", width: "1px", overflow: "hidden" }}
                    >
                      <TextField
                        label="Company website"
                        value={companyWebsite}
                        onChange={(e) => setCompanyWebsite(e.target.value)}
                        autoComplete="off"
                        // See ContactForm.tsx: a top-level `tabIndex` prop on
                        // TextField lands on the wrapper div, not the actual
                        // <input>, so it must go through slotProps.htmlInput
                        // to actually remove this field from the tab order.
                        slotProps={{ htmlInput: { tabIndex: -1 } }}
                      />
                    </Box>

                    <Button
                      type="submit"
                      variant="contained"
                      disabled={mutation.isPending}
                      endIcon={
                        mutation.isPending ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : (
                          <SendIcon />
                        )
                      }
                      sx={{
                        py: 1.8,
                        bgcolor: "#0A2A66",
                        color: "common.white",
                        fontFamily: MONO,
                        fontWeight: 800,
                        fontSize: "0.85rem",
                        borderRadius: 3,
                        "&:hover": {
                          bgcolor: "#14418D",
                        },
                      }}
                    >
                      {mutation.isPending ? "SUBMITTING…" : "SUBMIT APPLICATION"}
                    </Button>

                    <Button
                      href="https://forms.gle/niyMK6Wkc4v5yfLm7"
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="outlined"
                      endIcon={<OpenInNewIcon />}
                      sx={{
                        py: 1.5,
                        borderColor: "rgba(10, 42, 102, 0.3)",
                        color: "#0A2A66",
                        fontFamily: MONO,
                        fontWeight: 700,
                        fontSize: "0.78rem",
                        borderRadius: 3,
                        "&:hover": {
                          borderColor: "#0A2A66",
                          bgcolor: "rgba(10, 42, 102, 0.05)",
                        },
                      }}
                    >
                      OR APPLY VIA OFFICIAL GOOGLE FORM
                    </Button>
                  </Stack>
                )}
              </Box>
            </Grid>
          </Grid>
        </Stack>
      </Section>
    </Box>
  );
}
