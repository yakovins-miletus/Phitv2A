import { useId, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
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
import { SpecularButton as Button } from "@/shared/components/ui/specular";
import { messageFromError } from "@/shared/api/errors";
import { pageHead } from "@/shared/seo";
import { MONO, TRACKING } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";
import { MINIMAL_FIELD_SX } from "@/shared/theme/formField";
import { NAV_ANCHORS } from "@/shared/components/NavbarContext";
import { useNavbarAnchor } from "@/shared/components/navbarHooks";
import { useSubmitContactMessage } from "@/features/contact/api";

/**
 * Client-side validation guardrails matching the backend constraints.
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
  const anchorRef = useNavbarAnchor(NAV_ANCHORS.CAREERS_PAGE, { dark: false });
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
      <Box
        data-ground="light"
        ref={anchorRef}
        sx={{
          width: "100%",
          minHeight: "100dvh",
          bgcolor: "var(--g-void)",
          color: "var(--text-1)",
          background: "var(--g-page)",
          pt: { xs: 14, md: 22 },
          pb: { xs: 10, md: 16 },
          display: "flex",
          alignItems: "center",
        }}
      >
        <Section>
          <Box
            sx={{
              maxWidth: 640,
              mx: "auto",
              p: { xs: 4, md: 6 },
              borderRadius: "var(--r-panel)",
              bgcolor: "var(--glass-fill-2)",
              border: "1px solid var(--glass-border-1)",
              boxShadow: "var(--glass-shadow-2)",
              backdropFilter: "var(--glass-filter)",
              WebkitBackdropFilter: "var(--glass-filter)",
              textAlign: "center",
            }}
          >
            <Stack spacing={3} alignItems="center">
              <Typography
                variant="overline"
                sx={{
                  fontFamily: MONO,
                  fontWeight: 800,
                  fontSize: "0.75rem",
                  letterSpacing: TRACKING.meta,
                  color: "var(--accent-ink)",
                }}
              >
                ERROR 404 · POSITION NOT FOUND
              </Typography>
              <Typography variant="h2" component="h1" sx={{ fontWeight: 800, color: "var(--text-1)" }}>
                Position Not Found
              </Typography>
              <Typography variant="body1" sx={{ color: "var(--text-2)", lineHeight: 1.6, maxWidth: 460 }}>
                The requested engineering position file could not be located in our active register. It may have been filled or archived.
              </Typography>
              <RouterButton
                to="/careers"
                variant="contained"
                sx={{
                  fontFamily: MONO,
                  fontWeight: 800,
                  fontSize: "0.82rem",
                  letterSpacing: "0.06em",
                  bgcolor: "var(--accent-fg)",
                  color: NOIR.navyInk,
                  borderRadius: "var(--r-control)",
                  boxShadow: "0 4px 16px rgba(var(--accent-rgb), 0.25)",
                  "&:hover": {
                    bgcolor: NOIR.goldLight,
                  },
                }}
              >
                RETURN TO CAREERS REGISTER
              </RouterButton>
            </Stack>
          </Box>
        </Section>
      </Box>
    );
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nextErrors = validate({ fullName, email, university, coverNote });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
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
    <Box
      data-ground="light"
      ref={anchorRef}
      sx={{
        width: "100%",
        minHeight: "100dvh",
        bgcolor: "var(--g-void)",
        color: "var(--text-1)",
        background: "var(--g-page)",
        pt: { xs: 12, md: 18 },
        pb: { xs: 10, md: 16 },
        position: "relative",
      }}
    >
      <Section>
        <Stack spacing={{ xs: 5, md: 7 }}>
          {/* Quiet Back Navigation */}
          <Reveal>
            <RouterButton
              to="/careers"
              variant="text"
              startIcon={<ArrowBackIcon sx={{ fontSize: "1rem" }} />}
              sx={{
                fontFamily: MONO,
                fontWeight: 600,
                fontSize: "0.75rem",
                letterSpacing: TRACKING.meta,
                color: "var(--text-3)",
                px: 0,
                transition: "color var(--dur) var(--ease-out)",
                "&:hover": {
                  color: "var(--text-1)",
                  bgcolor: "transparent",
                },
              }}
            >
              ← RETURN TO OPEN ROLES
            </RouterButton>
          </Reveal>

          {/* Job Header & Eye's First Stop (D4) */}
          <Stack spacing={2.5} sx={{ maxWidth: 960 }}>
            <Reveal delay={0.05}>
              <Typography
                variant="h1"
                component="h1"
                sx={{
                  fontWeight: 800,
                  color: "var(--text-1)",
                  fontSize: { xs: "2.2rem", sm: "3rem", md: "3.5rem" },
                  lineHeight: 1.1,
                  letterSpacing: TRACKING.display,
                }}
              >
                {job.title}
              </Typography>
            </Reveal>

            <Reveal delay={0.1}>
              {/* Technical Mono Meta-Rail */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  flexWrap: "wrap",
                  fontFamily: MONO,
                  fontSize: "0.75rem",
                  letterSpacing: "0.08em",
                }}
              >
                <Chip
                  label={job.badge}
                  size="small"
                  sx={{
                    fontFamily: MONO,
                    fontWeight: 800,
                    fontSize: "0.7rem",
                    letterSpacing: "0.1em",
                    bgcolor: "var(--glass-fill-1)",
                    color: "var(--accent-ink)",
                    border: "1px solid var(--accent-border)",
                    borderRadius: "var(--r-pill)",
                    boxShadow: "0 0 12px var(--accent-15)",
                  }}
                />
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, color: "var(--text-3)" }}>
                  <LocationOnIcon sx={{ fontSize: "0.95rem", color: "var(--text-3)" }} />
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: MONO,
                      fontSize: "inherit",
                      fontWeight: 600,
                      color: "var(--text-2)",
                    }}
                  >
                    {job.location}
                  </Typography>
                </Box>
                <Typography component="span" sx={{ color: "var(--divider)" }}>
                  /
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, color: "var(--text-3)" }}>
                  <WorkIcon sx={{ fontSize: "0.95rem", color: "var(--text-3)" }} />
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: MONO,
                      fontSize: "inherit",
                      fontWeight: 600,
                      color: "var(--text-2)",
                    }}
                  >
                    {job.department}
                  </Typography>
                </Box>
                <Typography component="span" sx={{ color: "var(--divider)" }}>
                  /
                </Typography>
                <Chip
                  label={job.type.toUpperCase()}
                  size="small"
                  sx={{
                    fontFamily: MONO,
                    fontWeight: 700,
                    fontSize: "0.68rem",
                    letterSpacing: "0.06em",
                    bgcolor: "var(--glass-fill-1)",
                    color: "var(--text-3)",
                    border: "1px solid var(--glass-border-1)",
                    borderRadius: "var(--r-pill)",
                  }}
                />
              </Box>
            </Reveal>
          </Stack>

          {/* 2-Column Register Grid: Left (Prose & 3 Lists) vs Right (Application Form) */}
          <Grid container spacing={{ xs: 6, md: 8 }} alignItems="flex-start">
            {/* Left Column: Role Details */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Stack spacing={6}>
                {/* 1. Program Overview / Description */}
                <Reveal delay={0.15}>
                  <Stack spacing={2}>
                    <Typography
                      variant="h3"
                      component="h2"
                      sx={{
                        fontWeight: 700,
                        color: "var(--text-1)",
                        fontSize: { xs: "1.3rem", md: "1.5rem" },
                      }}
                    >
                      Role Overview
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: "var(--text-2)",
                        lineHeight: 1.75,
                        fontSize: "1.05rem",
                        maxWidth: "65ch",
                      }}
                    >
                      {job.description}
                    </Typography>
                  </Stack>
                </Reveal>

                {/* 2. Key Responsibilities */}
                <Reveal delay={0.2}>
                  <Stack spacing={2.5}>
                    <Typography
                      variant="h3"
                      component="h2"
                      sx={{
                        fontWeight: 700,
                        color: "var(--text-1)",
                        fontSize: { xs: "1.2rem", md: "1.35rem" },
                      }}
                    >
                      Key Responsibilities
                    </Typography>
                    <Stack spacing={1.75}>
                      {job.responsibilities.map((item, idx) => (
                        <Box key={idx} sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              bgcolor: "var(--accent-fg)",
                              mt: 1.1,
                              flexShrink: 0,
                              boxShadow: "0 0 8px rgba(var(--accent-rgb), 0.5)",
                            }}
                          />
                          <Typography
                            variant="body1"
                            sx={{
                              color: "var(--text-2)",
                              lineHeight: 1.65,
                              fontSize: "0.95rem",
                              maxWidth: "65ch",
                            }}
                          >
                            {item}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Stack>
                </Reveal>

                {/* 3. Candidate Requirements / Qualifications */}
                <Reveal delay={0.25}>
                  <Stack spacing={2.5}>
                    <Typography
                      variant="h3"
                      component="h2"
                      sx={{
                        fontWeight: 700,
                        color: "var(--text-1)",
                        fontSize: { xs: "1.2rem", md: "1.35rem" },
                      }}
                    >
                      Candidate Requirements & Qualifications
                    </Typography>
                    <Stack spacing={1.75}>
                      {job.requirements.map((item, idx) => (
                        <Box key={idx} sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              bgcolor: "var(--accent-fg)",
                              mt: 1.1,
                              flexShrink: 0,
                              boxShadow: "0 0 8px var(--accent-20)",
                            }}
                          />
                          <Typography
                            variant="body1"
                            sx={{
                              color: "var(--text-2)",
                              lineHeight: 1.65,
                              fontSize: "0.95rem",
                              maxWidth: "65ch",
                            }}
                          >
                            {item}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Stack>
                </Reveal>

                {/* 4. Benefits & Compensation */}
                <Reveal delay={0.3}>
                  <Stack spacing={2.5}>
                    <Typography
                      variant="h3"
                      component="h2"
                      sx={{
                        fontWeight: 700,
                        color: "var(--text-1)",
                        fontSize: { xs: "1.2rem", md: "1.35rem" },
                      }}
                    >
                      Benefits & Compensation
                    </Typography>
                    <Stack spacing={1.75}>
                      {job.benefits.map((item, idx) => (
                        <Box key={idx} sx={{ display: "flex", alignItems: "flex-start", gap: 1.75 }}>
                          <CheckCircleOutlineIcon
                            sx={{
                              color: "var(--accent-ink)",
                              fontSize: "1.2rem",
                              mt: 0.2,
                              flexShrink: 0,
                            }}
                          />
                          <Typography
                            variant="body1"
                            sx={{
                              color: "var(--text-2)",
                              lineHeight: 1.65,
                              fontSize: "0.95rem",
                              fontWeight: 500,
                              maxWidth: "65ch",
                            }}
                          >
                            {item}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Stack>
                </Reveal>

                {/* 5. Technology Stack Pills */}
                <Reveal delay={0.35}>
                  <Stack spacing={2} sx={{ pt: 1 }}>
                    <Typography
                      variant="overline"
                      sx={{
                        fontFamily: MONO,
                        fontWeight: 700,
                        fontSize: "0.72rem",
                        letterSpacing: TRACKING.meta,
                        color: "var(--text-3)",
                      }}
                    >
                      TECHNOLOGY STACK & TOOLS
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {job.stack.map((tech) => (
                        <Chip
                          key={tech}
                          label={tech}
                          size="small"
                          sx={{
                            fontFamily: MONO,
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            bgcolor: "var(--glass-fill-1)",
                            color: "var(--text-2)",
                            border: "1px solid var(--glass-border-1)",
                            borderRadius: "var(--r-pill)",
                            px: 0.5,
                            transition: "all var(--dur) var(--ease-out)",
                            "&:hover": {
                              bgcolor: "var(--glass-fill-2)",
                              borderColor: "var(--glass-border-2)",
                              color: "var(--text-1)",
                            },
                          }}
                        />
                      ))}
                    </Box>
                  </Stack>
                </Reveal>
              </Stack>
            </Grid>

            {/* Right Column: Interactive Application Form */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Reveal delay={0.2}>
                <Box
                  sx={{
                    position: { md: "sticky" },
                    top: 120,
                    p: { xs: 3.5, sm: 4, md: 4.5 },
                    borderRadius: "var(--r-panel)",
                    bgcolor: "var(--glass-fill-2)",
                    border: "1px solid var(--glass-border-1)",
                    boxShadow: "var(--glass-shadow-2)",
                    backdropFilter: "var(--glass-filter)",
                    WebkitBackdropFilter: "var(--glass-filter)",
                  }}
                >
                  {mutation.isSuccess ? (
                    <Stack spacing={3} alignItems="center" textAlign="center" sx={{ py: 4 }}>
                      <CheckCircleOutlineIcon sx={{ fontSize: "3.8rem", color: "var(--accent-ink)" }} />
                      <Typography
                        variant="h3"
                        component="h2"
                        sx={{
                          fontWeight: 800,
                          color: "var(--text-1)",
                          fontSize: "1.45rem",
                        }}
                      >
                        Application Received!
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color: "var(--text-2)",
                          lineHeight: 1.65,
                          fontSize: "0.95rem",
                          maxWidth: 380,
                        }}
                      >
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
                        sx={{
                          mt: 1.5,
                          fontFamily: MONO,
                          fontWeight: 700,
                          fontSize: "0.78rem",
                          letterSpacing: "0.06em",
                          color: "var(--accent-ink)",
                          borderColor: "var(--accent-border)",
                          borderRadius: "var(--r-control)",
                        }}
                      >
                        SUBMIT ANOTHER APPLICATION
                      </Button>
                    </Stack>
                  ) : (
                    <Stack component="form" onSubmit={handleSubmit} noValidate spacing={2.75}>
                      {errorSummary.length > 0 ? (
                        <Alert severity="error">{errorSummary.join(" ")}</Alert>
                      ) : null}
                      {mutation.isError ? (
                        <Alert severity="error">{messageFromError(mutation.error)}</Alert>
                      ) : null}
                      
                      <Stack spacing={1}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              bgcolor: "var(--accent-fg)",
                              boxShadow: "0 0 10px var(--accent-fg)",
                            }}
                          />
                          <Typography
                            variant="overline"
                            sx={{
                              fontFamily: MONO,
                              fontWeight: 800,
                              fontSize: "0.72rem",
                              letterSpacing: TRACKING.meta,
                              color: "var(--accent-ink)",
                            }}
                          >
                            APPLICATION REGISTER
                          </Typography>
                        </Box>
                        <Typography
                          variant="h3"
                          component="h2"
                          sx={{
                            fontWeight: 800,
                            fontSize: "1.4rem",
                            color: "var(--text-1)",
                          }}
                        >
                          Apply for this Position
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: "var(--text-3)",
                            fontSize: "0.85rem",
                            lineHeight: 1.5,
                          }}
                        >
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
                        variant="standard"
                        sx={MINIMAL_FIELD_SX}
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
                        variant="standard"
                        sx={MINIMAL_FIELD_SX}
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
                        variant="standard"
                        sx={MINIMAL_FIELD_SX}
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
                        variant="standard"
                        sx={MINIMAL_FIELD_SX}
                      />

                      {/* Honeypot */}
                      <Box
                        aria-hidden
                        sx={{ position: "absolute", left: "-10000px", width: "1px", overflow: "hidden" }}
                      >
                        <TextField
                          label="Company website"
                          value={companyWebsite}
                          onChange={(e) => setCompanyWebsite(e.target.value)}
                          autoComplete="off"
                          slotProps={{ htmlInput: { tabIndex: -1 } }}
                        />
                      </Box>

                      {/* Primary Contained Specular CTA (D2) */}
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={mutation.isPending}
                        endIcon={
                          mutation.isPending ? (
                            <CircularProgress size={18} color="inherit" />
                          ) : (
                            <SendIcon sx={{ fontSize: "1rem" }} />
                          )
                        }
                        sx={{
                          py: 1.75,
                          bgcolor: "var(--accent-fg)",
                          color: NOIR.navyInk,
                          fontFamily: MONO,
                          fontWeight: 800,
                          fontSize: "0.85rem",
                          letterSpacing: "0.06em",
                          borderRadius: "var(--r-control)",
                          border: "1px solid var(--accent-border)",
                          boxShadow: "0 4px 16px rgba(var(--accent-rgb), 0.25)",
                          "&:hover": {
                            bgcolor: NOIR.goldLight,
                            boxShadow: "0 6px 20px rgba(var(--accent-rgb), 0.4)",
                          },
                          "&:active": {
                            bgcolor: NOIR.goldDark,
                          },
                          "&.Mui-disabled": {
                            bgcolor: "rgba(255, 199, 44, 0.4)",
                            color: "rgba(6, 18, 38, 0.6)",
                          },
                        }}
                      >
                        {mutation.isPending ? "SUBMITTING…" : "SUBMIT APPLICATION"}
                      </Button>

                      {/* Quiet Secondary Action */}
                      <Button
                        href="https://forms.gle/niyMK6Wkc4v5yfLm7"
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="outlined"
                        endIcon={<OpenInNewIcon sx={{ fontSize: "0.9rem" }} />}
                        sx={{
                          py: 1.3,
                          borderColor: "var(--glass-border-1)",
                          color: "var(--text-3)",
                          fontFamily: MONO,
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          letterSpacing: "0.04em",
                          borderRadius: "var(--r-control)",
                          bgcolor: "transparent",
                          "&:hover": {
                            borderColor: "var(--glass-border-2)",
                            color: "var(--text-1)",
                            bgcolor: "var(--glass-fill-1)",
                          },
                        }}
                      >
                        OR APPLY VIA OFFICIAL GOOGLE FORM
                      </Button>
                    </Stack>
                  )}
                </Box>
              </Reveal>
            </Grid>
          </Grid>
        </Stack>
      </Section>
    </Box>
  );
}
