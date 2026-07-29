import { useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import WorkIcon from "@mui/icons-material/Work";
import SendIcon from "@mui/icons-material/Send";
import { createFileRoute } from "@tanstack/react-router";

import { CAREER_POSITIONS } from "@/shared/careersData";
import { Reveal } from "@/shared/components/Reveal";
import { Section } from "@/shared/components/Section";
import { RouterButton } from "@/shared/components/RouterLink";
import { pageHead } from "@/shared/seo";
import { MONO } from "@/shared/theme/theme";

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

  const [formSubmitted, setFormSubmitted] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [university, setUniversity] = useState("");
  const [coverNote, setCoverNote] = useState("");

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  return (
    <Box sx={{ width: "100%", pt: { xs: 12, md: 18 }, pb: { xs: 10, md: 16 } }}>
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
                    bgcolor: "#FFC72C",
                    color: "#0A2A66",
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
              <Typography variant="h1" component="h1" sx={{ fontWeight: 800 }}>
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
                  <Typography variant="h3" component="h2" sx={{ fontWeight: 800 }}>
                    Program Overview
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7, fontSize: "1.05rem" }}>
                    {job.description}
                  </Typography>
                </Stack>

                {/* Key Responsibilities */}
                <Stack spacing={2}>
                  <Typography variant="h3" component="h2" sx={{ fontWeight: 800 }}>
                    Key Responsibilities
                  </Typography>
                  <Stack spacing={1.5}>
                    {job.responsibilities.map((item, idx) => (
                      <Box key={idx} sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#FFC72C", mt: 1, flexShrink: 0 }} />
                        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                          {item}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Stack>

                {/* Candidate Requirements */}
                <Stack spacing={2}>
                  <Typography variant="h3" component="h2" sx={{ fontWeight: 800 }}>
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
                  <Typography variant="h3" component="h2" sx={{ fontWeight: 800 }}>
                    What We Offer
                  </Typography>
                  <Stack spacing={1.5}>
                    {job.benefits.map((item, idx) => (
                      <Box key={idx} sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                        <CheckCircleOutlineIcon sx={{ color: "#FFC72C", fontSize: "1.2rem", mt: 0.2, flexShrink: 0 }} />
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
                {formSubmitted ? (
                  <Stack spacing={3} alignItems="center" textAlign="center" sx={{ py: 4 }}>
                    <CheckCircleOutlineIcon sx={{ fontSize: "4rem", color: "#FFC72C" }} />
                    <Typography variant="h3" component="h2" sx={{ fontWeight: 800 }}>
                      Application Received!
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      Thank you for applying to the <strong>{job.title}</strong> position. Our technical recruitment team will review your application and reach out shortly.
                    </Typography>
                    <Button variant="outlined" onClick={() => setFormSubmitted(false)} sx={{ mt: 2, fontFamily: MONO, fontWeight: 700 }}>
                      SUBMIT ANOTHER APPLICATION
                    </Button>
                  </Stack>
                ) : (
                  <Stack component="form" onSubmit={handleSubmit} spacing={3}>
                    <Stack spacing={1}>
                      <Typography variant="h3" component="h2" sx={{ fontWeight: 800, fontSize: "1.5rem" }}>
                        Apply for this Position
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Submit your details below for direct evaluation by Phitopolis R&D engineering leads.
                      </Typography>
                    </Stack>

                    <TextField
                      label="Full Name"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      fullWidth
                    />

                    <TextField
                      label="Email Address"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      fullWidth
                    />

                    <TextField
                      label="University / Current Company"
                      required
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                      placeholder="e.g. DLSU, Ateneo, UP, or Current Firm"
                      fullWidth
                    />

                    <TextField
                      label="Cover Note / Relevant Projects"
                      multiline
                      rows={3}
                      value={coverNote}
                      onChange={(e) => setCoverNote(e.target.value)}
                      placeholder="Tell us briefly about your technical background or GitHub portfolio..."
                      fullWidth
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      endIcon={<SendIcon />}
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
                      SUBMIT APPLICATION
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
