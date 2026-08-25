import Modal from "@mui/material/Modal";
import Fade from "@mui/material/Fade";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { SpecularIconButton as IconButton } from "@/shared/components/ui/specular";
import { SpecularButton as Button } from "@/shared/components/ui/specular";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Container from "@mui/material/Container";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import StarOutlineIcon from "@mui/icons-material/StarOutline";
import LaunchIcon from "@mui/icons-material/Launch";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SpeedIcon from "@mui/icons-material/Speed";
import CodeIcon from "@mui/icons-material/Code";
import StorageIcon from "@mui/icons-material/Storage";
import PsychologylIcon from "@mui/icons-material/Psychology";
import CloudQueueIcon from "@mui/icons-material/CloudQueue";
import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";
import { SCROLL_SPEED } from "@/shared/motion/scrollSpeed";
import { CAREER_POSITIONS } from "@/shared/careersData";
import { JOB_DETAILS, type JobDetail } from "./jobDetails";

const MODAL_TRANSITION_MS = Math.round(SCROLL_SPEED * 1000);

// Visual Aid Diagram for each role
function RoleVisualAid({ roleId }: { roleId: string }) {
  if (roleId === "quant-researcher") {
    return (
      <Box sx={{ p: 3, borderRadius: 4, bgcolor: "rgba(6, 24, 59, 0.7)", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <PsychologylIcon sx={{ color: NOIR.gold }} />
            <Typography variant="subtitle2" sx={{ fontFamily: MONO, fontWeight: 700, letterSpacing: "0.12em", color: NOIR.gold, fontSize: "0.78rem" }}>
              RESEARCH PIPELINE ARCHITECTURE
            </Typography>
          </Stack>
          <Grid container spacing={2} textAlign="center">
            <Grid size={{ xs: 4 }}>
              <PaperBox label="Market Feeds" sub="Petabytes/Day" />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <PaperBox label="ML Signal Engine" sub="Python / Deep Learning" highlight />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <PaperBox label="Alpha Strategy" sub="Quantbot Hedge Fund" />
            </Grid>
          </Grid>
        </Stack>
      </Box>
    );
  }
  if (roleId === "software-engineer") {
    return (
      <Box sx={{ p: 3, borderRadius: 4, bgcolor: "rgba(6, 24, 59, 0.7)", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <SpeedIcon sx={{ color: NOIR.gold }} />
            <Typography variant="subtitle2" sx={{ fontFamily: MONO, fontWeight: 700, letterSpacing: "0.12em", color: NOIR.gold, fontSize: "0.78rem" }}>
              ULTRA-LOW LATENCY CORE
            </Typography>
          </Stack>
          <Grid container spacing={2} textAlign="center">
            <Grid size={{ xs: 4 }}>
              <PaperBox label="Exchange Gateway" sub="Order Routing" />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <PaperBox label="C++ / Rust Core" sub="Microsecond Execution" highlight />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <PaperBox label="FPGA Accelerator" sub="Sub-microsecond Logic" />
            </Grid>
          </Grid>
        </Stack>
      </Box>
    );
  }
  if (roleId === "full-stack-developer") {
    return (
      <Box sx={{ p: 3, borderRadius: 4, bgcolor: "rgba(6, 24, 59, 0.7)", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <CodeIcon sx={{ color: NOIR.gold }} />
            <Typography variant="subtitle2" sx={{ fontFamily: MONO, fontWeight: 700, letterSpacing: "0.12em", color: NOIR.gold, fontSize: "0.78rem" }}>
              SAAS PLATFORM STACK
            </Typography>
          </Stack>
          <Grid container spacing={2} textAlign="center">
            <Grid size={{ xs: 4 }}>
              <PaperBox label="React / TS UI" sub="Responsive Client" highlight />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <PaperBox label="NestJS / GraphQL" sub="Microservices API" />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <PaperBox label="Postgres & Mongo" sub="Data Layer" />
            </Grid>
          </Grid>
        </Stack>
      </Box>
    );
  }
  if (roleId === "data-scientist") {
    return (
      <Box sx={{ p: 3, borderRadius: 4, bgcolor: "rgba(6, 24, 59, 0.7)", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <StorageIcon sx={{ color: NOIR.gold }} />
            <Typography variant="subtitle2" sx={{ fontFamily: MONO, fontWeight: 700, letterSpacing: "0.12em", color: NOIR.gold, fontSize: "0.78rem" }}>
              ETL & DATA LAKE ARCHITECTURE
            </Typography>
          </Stack>
          <Grid container spacing={2} textAlign="center">
            <Grid size={{ xs: 4 }}>
              <PaperBox label="Raw Ingestion" sub="Tick Data Feeds" />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <PaperBox label="Python ETL" sub="Validation & Cleaning" highlight />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <PaperBox label="AWS Lakehouse" sub="Research Datasets" />
            </Grid>
          </Grid>
        </Stack>
      </Box>
    );
  }
  if (roleId === "technical-graduate-program") {
    return (
      <Box sx={{ p: 3, borderRadius: 4, bgcolor: "rgba(6, 24, 59, 0.7)", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <CodeIcon sx={{ color: NOIR.gold }} />
            <Typography variant="subtitle2" sx={{ fontFamily: MONO, fontWeight: 700, letterSpacing: "0.12em", color: NOIR.gold, fontSize: "0.78rem" }}>
              GRADUATE FELLOWSHIP PATHWAY
            </Typography>
          </Stack>
          <Grid container spacing={2} textAlign="center">
            <Grid size={{ xs: 4 }}>
              <PaperBox label="1-on-1 Mentorship" sub="Principal Staff Engineers" />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <PaperBox label="Production Stacks" sub="C++ / Python / TypeScript" highlight />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <PaperBox label="12-Month Fellowship" sub="AWS / GCP Deployment" />
            </Grid>
          </Grid>
        </Stack>
      </Box>
    );
  }
  if (roleId === "rd-internship-program") {
    return (
      <Box sx={{ p: 3, borderRadius: 4, bgcolor: "rgba(6, 24, 59, 0.7)", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <CodeIcon sx={{ color: NOIR.gold }} />
            <Typography variant="subtitle2" sx={{ fontFamily: MONO, fontWeight: 700, letterSpacing: "0.12em", color: NOIR.gold, fontSize: "0.78rem" }}>
              R&D INTERNSHIP PATHWAY
            </Typography>
          </Stack>
          <Grid container spacing={2} textAlign="center">
            <Grid size={{ xs: 4 }}>
              <PaperBox label="Mentorship" sub="Senior Staff guidance" />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <PaperBox label="Production Code" sub="Real-world features" highlight />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <PaperBox label="Graduate Pathway" sub="Fast-track full-time offer" />
            </Grid>
          </Grid>
        </Stack>
      </Box>
    );
  }
  return (
    <Box sx={{ p: 3, borderRadius: 4, bgcolor: "rgba(6, 24, 59, 0.7)", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <CloudQueueIcon sx={{ color: NOIR.gold }} />
          <Typography variant="subtitle2" sx={{ fontFamily: MONO, fontWeight: 700, letterSpacing: "0.12em", color: NOIR.gold, fontSize: "0.78rem" }}>
            24x7 CLOUD INFRASTRUCTURE
          </Typography>
        </Stack>
        <Grid container spacing={2} textAlign="center">
          <Grid size={{ xs: 4 }}>
            <PaperBox label="Kubernetes" sub="AWS / GCP / Azure" highlight />
          </Grid>
          <Grid size={{ xs: 4 }}>
            <PaperBox label="CI/CD Pipeline" sub="Automated Releases" />
          </Grid>
          <Grid size={{ xs: 4 }}>
            <PaperBox label="Prometheus" sub="Grafana Monitoring" />
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
}

function PaperBox({ label, sub, highlight }: { label: string; sub: string; highlight?: boolean }) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2.5,
        bgcolor: highlight ? "var(--accent-15)" : "rgba(255, 255, 255, 0.04)",
        color: "white",
        border: "1px solid",
        borderColor: highlight ? "var(--accent-40)" : "rgba(255, 255, 255, 0.08)",
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.85rem", color: highlight ? NOIR.gold : "rgba(244, 247, 252, 0.95)" }}>
        {label}
      </Typography>
      <Typography variant="caption" sx={{ opacity: 0.75, display: "block", fontSize: "0.72rem", mt: 0.5, fontFamily: MONO }}>
        {sub}
      </Typography>
    </Box>
  );
}

interface JobDetailsDrawerProps {
  open: boolean;
  jobTitle: string | null;
  onClose: () => void;
}

// A JOB_DETAILS miss must never silently show a different role's details.
// Fall back to the position's own real copy from careersData.ts instead —
// only the fields that exist there are populated; the rest stay unset so the
// drawer renders honestly instead of padding with someone else's content.
function buildFallbackDetail(title: string): JobDetail | null {
  const position = CAREER_POSITIONS.find((candidate) => candidate.title === title);
  if (!position) return null;

  return {
    id: position.id,
    title: position.title,
    role: position.summary,
    overview: position.description,
    stack: position.stack,
    location: position.location,
    type: position.type,
    applyUrl: "https://forms.gle/niyMK6Wkc4v5yfLm7",
    responsibilities: position.responsibilities,
    requirements: position.requirements,
  };
}

export function JobDetailsDrawer({ open, jobTitle, onClose }: JobDetailsDrawerProps) {
  const detail = jobTitle ? (JOB_DETAILS[jobTitle] ?? buildFallbackDetail(jobTitle)) : null;

  if (!detail) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      slotProps={{
        backdrop: {
          sx: {
            bgcolor: "rgba(3, 10, 22, 0.45)",
            backdropFilter: "blur(4px)",
          },
        },
      }}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Fade in={open} timeout={MODAL_TRANSITION_MS}>
        <Box
          data-lenis-prevent
          sx={{
            position: "relative",
            width: { xs: "95vw", sm: "88vw", md: "65vw", lg: "58vw" },
            height: { xs: "92vh", sm: "88vh", md: "82vh" },
            bgcolor: "rgba(6, 18, 38, 0.80)",
            backdropFilter: "blur(32px)",
            color: "common.white",
            borderRadius: 5,
            border: "1px solid rgba(255, 255, 255, 0.14)",
            boxShadow: "0 24px 64px rgba(0, 0, 0, 0.7), 0 0 40px rgba(10, 42, 102, 0.4)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            outline: "none",
          }}
        >
          {/* Fixed Header Bar */}
          <Box
            sx={{
              flexShrink: 0,
              px: { xs: 3, sm: 4, md: 5 },
              py: 2.2,
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              bgcolor: "rgba(6, 24, 59, 0.6)",
              backdropFilter: "blur(12px)",
              borderRadius: "20px 20px 0 0",
              zIndex: 10,
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={onClose}
                sx={{
                  color: "rgba(255, 255, 255, 0.75)",
                  fontFamily: MONO,
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  "&:hover": { color: NOIR.gold, bgcolor: "rgba(255, 255, 255, 0.05)" },
                }}
              >
                BACK TO POSITIONS
              </Button>

              <Stack direction="row" spacing={2} alignItems="center">
                <Button
                  variant="contained"
                  href={detail.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  endIcon={<LaunchIcon fontSize="small" />}
                  sx={{
                    borderRadius: "100px",
                    px: 3.5,
                    py: 1,
                    fontFamily: MONO,
                    fontWeight: 800,
                    fontSize: "0.78rem",
                    bgcolor: NOIR.gold,
                    color: NOIR.navyInk,
                    boxShadow: "0 4px 14px rgba(var(--accent-rgb), 0.25)",
                    "&:hover": {
                      bgcolor: NOIR.goldLight,
                      boxShadow: "0 6px 20px rgba(var(--accent-rgb), 0.4)",
                    },
                  }}
                >
                  APPLY NOW
                </Button>
                <IconButton
                  onClick={onClose}
                  aria-label="Close Job Details"
                  sx={{
                    color: "rgba(255, 255, 255, 0.8)",
                    bgcolor: "rgba(255, 255, 255, 0.06)",
                    "&:hover": { bgcolor: "rgba(255, 255, 255, 0.15)", color: "white" },
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>
          </Box>

          {/* Main Internally Scrollable Body */}
          <Box
            data-lenis-prevent
            sx={{
              flexGrow: 1,
              minHeight: 0,
              overflowY: "auto",
              overflowX: "hidden",
              WebkitOverflowScrolling: "touch",
              py: { xs: 4, md: 6 },
              px: { xs: 1, sm: 2 },
            }}
          >
            <Container maxWidth="lg">
              <Stack spacing={4.5}>
            
                {/* Title & Metadata Header */}
                <Stack spacing={2.5}>
                  <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Chip
                      icon={<LocationOnIcon sx={{ fontSize: "0.9rem !important", color: `${NOIR.gold} !important` }} />}
                      label={detail.location}
                      size="small"
                      sx={{
                        bgcolor: "rgba(var(--accent-rgb), 0.12)",
                        color: NOIR.gold,
                        border: "1px solid rgba(var(--accent-rgb), 0.3)",
                        fontWeight: 700,
                        fontFamily: MONO,
                        fontSize: "0.72rem",
                      }}
                    />
                    <Chip
                      icon={<WorkOutlineIcon sx={{ fontSize: "0.9rem !important", color: "rgba(244, 247, 252, 0.7) !important" }} />}
                      label={detail.type}
                      size="small"
                      variant="outlined"
                      sx={{
                        borderColor: "rgba(255, 255, 255, 0.2)",
                        color: "rgba(244, 247, 252, 0.9)",
                        fontWeight: 600,
                        fontFamily: MONO,
                        fontSize: "0.72rem",
                      }}
                    />
                  </Stack>

                  <Typography variant="h2" sx={{ fontSize: { xs: "2rem", sm: "2.6rem", md: "3.2rem" }, fontWeight: 800, color: NOIR.frost, lineHeight: 1.15 }}>
                    {detail.title}
                  </Typography>

                  <Typography variant="h5" sx={{ color: "rgba(244, 247, 252, 0.78)", fontWeight: 400, lineHeight: 1.6, maxWidth: 850 }}>
                    {detail.role}
                  </Typography>

                  {/* Tech Stack Pills */}
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ pt: 0.5 }}>
                    {detail.stack.map((tech) => (
                      <Chip
                        key={tech}
                        label={tech}
                        sx={{
                          fontFamily: MONO,
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          bgcolor: "rgba(255, 255, 255, 0.06)",
                          border: "1px solid rgba(255, 255, 255, 0.12)",
                          color: "rgba(244, 247, 252, 0.9)",
                          py: 0.5,
                        }}
                      />
                    ))}
                  </Stack>
                </Stack>

                {/* Visual Aid Diagram */}
                <RoleVisualAid roleId={detail.id} />

                {/* Role Overview */}
                <Box sx={{ p: 3.5, borderRadius: 4, bgcolor: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5, color: NOIR.frost, fontFamily: MONO, fontSize: "1.1rem" }}>
                    ROLE OVERVIEW
                  </Typography>
                  <Typography variant="body1" sx={{ color: "rgba(244, 247, 252, 0.75)", lineHeight: 1.75, fontSize: "1.02rem" }}>
                    {detail.overview}
                  </Typography>
                </Box>

                {/* Responsibilities */}
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, mb: 2.5, color: NOIR.frost, fontSize: "1.3rem" }}>
                    Key Responsibilities
                  </Typography>
                  <Stack spacing={1.8}>
                    {detail.responsibilities.map((item, index) => (
                      <Stack key={`resp-${String(index)}`} direction="row" spacing={2} alignItems="flex-start">
                        <CheckCircleOutlineIcon sx={{ color: NOIR.gold, mt: 0.3, fontSize: "1.2rem", flexShrink: 0 }} />
                        <Typography variant="body1" sx={{ color: "rgba(244, 247, 252, 0.8)", fontSize: "1rem", lineHeight: 1.65 }}>
                          {item}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>

                {/* Requirements */}
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, mb: 2.5, color: NOIR.frost, fontSize: "1.3rem" }}>
                    Required for the Role
                  </Typography>
                  <Stack spacing={1.8}>
                    {detail.requirements.map((item, index) => (
                      <Stack key={`req-${String(index)}`} direction="row" spacing={2} alignItems="flex-start">
                        <CheckCircleOutlineIcon sx={{ color: NOIR.goldDark, mt: 0.3, fontSize: "1.2rem", flexShrink: 0 }} />
                        <Typography variant="body1" sx={{ color: "rgba(244, 247, 252, 0.8)", fontSize: "1rem", lineHeight: 1.65 }}>
                          {item}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>

                {/* Desirable Skills — only rendered when the source data has this list */}
                {detail.desirable && detail.desirable.length > 0 && (
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, mb: 2.5, color: NOIR.frost, fontSize: "1.3rem" }}>
                    Desirable Skills & Experience
                  </Typography>
                  <Stack spacing={1.8}>
                    {detail.desirable.map((item, index) => (
                      <Stack key={`des-${String(index)}`} direction="row" spacing={2} alignItems="flex-start">
                        <StarOutlineIcon sx={{ color: NOIR.gold, mt: 0.3, fontSize: "1.2rem", flexShrink: 0 }} />
                        <Typography variant="body1" sx={{ color: "rgba(244, 247, 252, 0.8)", fontSize: "1rem", lineHeight: 1.65 }}>
                          {item}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
                )}

                {/* Bottom Apply CTA Card */}
                <Box
                  sx={{
                    p: { xs: 4, md: 5 },
                    borderRadius: 4,
                    bgcolor: "rgba(6, 24, 59, 0.8)",
                    border: "1px solid rgba(var(--accent-rgb), 0.25)",
                    boxShadow: "0 12px 32px rgba(0, 0, 0, 0.4)",
                    color: "white",
                    textAlign: "center",
                    mt: 2,
                    mb: 4,
                  }}
                >
                  <Typography variant="h4" sx={{ fontWeight: 800, mb: 1.5, color: NOIR.frost }}>
                    Ready to Join Phitopolis?
                  </Typography>
                  <Typography variant="body1" sx={{ color: "rgba(244, 247, 252, 0.75)", maxWidth: 600, mx: "auto", mb: 3.5, fontSize: "1.02rem" }}>
                    Submit your application to join our dynamic team in Bonifacio Global City (BGC), Manila.
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    href={detail.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    endIcon={<LaunchIcon />}
                    sx={{
                      bgcolor: NOIR.gold,
                      color: NOIR.navyInk,
                      fontFamily: MONO,
                      fontWeight: 800,
                      px: 5,
                      py: 1.5,
                      borderRadius: "100px",
                      boxShadow: "0 6px 20px rgba(var(--accent-rgb), 0.3)",
                      "&:hover": { bgcolor: NOIR.goldLight, boxShadow: "0 8px 25px rgba(var(--accent-rgb), 0.45)" },
                    }}
                  >
                    APPLY NOW FOR {detail.title.toUpperCase()}
                  </Button>
                </Box>

              </Stack>
            </Container>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
}
