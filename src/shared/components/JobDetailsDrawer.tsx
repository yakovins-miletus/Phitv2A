import Modal from "@mui/material/Modal";
import Fade from "@mui/material/Fade";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
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

const MODAL_TRANSITION_MS = Math.round(SCROLL_SPEED * 1000);

export interface JobDetail {
  id: string;
  title: string;
  role: string;
  overview: string;
  stack: string[];
  location: string;
  type: string;
  applyUrl: string;
  responsibilities: string[];
  requirements: string[];
  desirable: string[];
}

export const JOB_DETAILS: Record<string, JobDetail> = {
  "Quantitative Researcher": {
    id: "quant-researcher",
    title: "Quantitative Researcher",
    role: "Hunt for signal in petabytes of market noise with advanced machine learning and statistics",
    overview:
      "In this role, you will apply mathematical and statistical techniques and engineering software to develop, analyze, and implement models to produce financial trading signals. The team is mainly focused on Data Science projects, analyzing large datasets from diverse sources of data.",
    stack: ["Python", "Deep Learning", "Statistics", "Big Data", "Machine Learning", "Git"],
    location: "BGC Office (Hybrid Schedule)",
    type: "Full-time",
    applyUrl: "https://forms.gle/niyMK6Wkc4v5yfLm7",
    responsibilities: [
      "Analyze and implement academic research and practitioner literature to create and refine investment strategies",
      "Explore datasets and implement Machine Learning algorithms to produce signals for profitable trading opportunities",
      "Work closely with our hedge fund partner, Quantbot Technologies, to conduct modeling experiments on complex datasets",
      "Develop internal quantitative tools used for research and signal backtesting",
      "Work independently and autonomously to drive high-level investment research",
    ],
    requirements: [
      "Strong quantitative abilities — must possess a degree in a quantitative field (Math, Physics, CS, Engineering, Stats)",
      "Ability to complete high-level, investment-related research",
      "Understanding of and ability to implement Machine Learning algorithms (supervised & unsupervised)",
      "Proficiency in developing data-related software in Python",
      "Willingness to work in the BGC office as per schedule",
    ],
    desirable: [
      "Experience with Deep Learning algorithms and neural network architectures",
      "Familiarity with investment products (equities & derivatives) and portfolio construction analytics",
      "Proficiency in source control tools and collaborative development (Git)",
      "Knowledge of Python software engineering tools (unit testing, documentation frameworks)",
      "Capability to design and implement research software from scratch",
    ],
  },
  "Software Engineer": {
    id: "software-engineer",
    title: "Software Engineer",
    role: "Build the ultra-low latency backbone of global trading systems, where microseconds decide outcomes",
    overview:
      "You will engage in the development of infrastructure that makes modern data-driven applications in financial services possible. You will enable ingestion, processing, storage, and analytics of virtually unlimited amounts of financial data, harnessing cloud supercomputing for algorithmic trading.",
    stack: ["C++", "Rust", "Go", "Python", "Linux", "Performance", "FPGA"],
    location: "BGC Office (Hybrid Schedule)",
    type: "Full-time",
    applyUrl: "https://forms.gle/niyMK6Wkc4v5yfLm7",
    responsibilities: [
      "Implement core system functionality according to agreed high-performance software architecture",
      "Write production quality code: correct, ultra-performant, maintainable, with high unit test coverage",
      "Participate in rigorous peer code reviews and architectural discussions",
      "Support and optimize deployed high-frequency systems and market data pipelines",
    ],
    requirements: [
      "Experience in writing and debugging high performance systems applications",
      "Experience writing production code in systems development languages (C++, Java, Python, Rust, Go)",
      "Knowledgeable in measuring code performance, latency profiling, and memory management",
      "Must be comfortable working in a Linux terminal environment",
      "Good verbal and written communication skills and commitment to deadlines",
      "Willingness to work in the BGC office as per schedule",
    ],
    desirable: [
      "Prior experience writing production code in C++, Rust, or Go",
      "Experience programming hardware accelerators or FPGAs",
      "Works effectively with a team, speaks mind, and contributes to design choices",
      "Enjoys creating ultra-low latency engineering products",
      "Experience acting on client feedback to continuously refine software",
    ],
  },
  "Full Stack Developer": {
    id: "full-stack-developer",
    title: "Full Stack Developer",
    role: "Architect our SaaS platforms and the interfaces that sit on top of them",
    overview:
      "The primary responsibility of this role is to build and maintain production-level software applications, including responsive user interfaces, reliable backend API services, and high-performance database architectures.",
    stack: ["TypeScript", "React", "GraphQL", "NestJS", "PostgreSQL", "MongoDB", "CI/CD"],
    location: "BGC Office (Hybrid Schedule)",
    type: "Full-time",
    applyUrl: "https://forms.gle/niyMK6Wkc4v5yfLm7",
    responsibilities: [
      "Understand business needs and translate them into technical specifications",
      "Build and maintain web applications across the front end and the back end",
      "Make key architectural decisions on project tech stacks and design patterns",
      "Design user interfaces that hold to established UX principles",
      "Configure CI/CD automation pipelines for continuous production delivery",
      "Collaborate with cross-functional agile teams",
    ],
    requirements: [
      "Ability to design software with production-ready software engineering standards",
      "Proficiency in JavaScript and TypeScript",
      "Strong skills in JS frameworks, specifically ReactJS, ExpressJS, Apollo, and NestJS",
      "Knowledge of standard API methodologies such as REST and GraphQL",
      "Working knowledge with PostgreSQL and MongoDB databases",
      "Ability to navigate in a Linux environment and familiarity with CI/CD",
      "Willingness to work in the BGC office as per schedule",
    ],
    desirable: [
      "Proficiency in Python and Docker containerization",
      "Hands-on experience working with event-driven architectures",
      "Ability to navigate the AWS cloud ecosystem",
      "Ability to architect full-stack greenfield projects from scratch",
      "Knowledge of mitigating cloud security vulnerabilities",
    ],
  },
  "Data Scientist": {
    id: "data-scientist",
    title: "Data Scientist",
    role: "Design the ETL pipelines and data lakes that become new products for researchers and traders",
    overview:
      "In this role, you will use problem-solving skills and software engineering practices to design, develop, and deploy data pipelines and data products for researchers and quantitative traders. You will gain exposure to global market data and automated exchange trading.",
    stack: ["Python", "ETL", "AWS", "Docker", "SQL / NoSQL", "Linux", "Data Integrity"],
    location: "BGC Office (Hybrid Schedule)",
    type: "Full-time",
    applyUrl: "https://forms.gle/niyMK6Wkc4v5yfLm7",
    responsibilities: [
      "Build and optimize ETL environments supporting quantitative research and automated trading",
      "Implement automated data quality and validation checks for data integrity",
      "Collaborate with the research team to formulate and deliver valuable financial datasets",
      "Handle application deployment, data extraction pipelines, and operational support",
    ],
    requirements: [
      "Prior experience in designing, building, and deploying software solutions",
      "Proficiency in developing data-related software in Python",
      "Keen eye for data quality to ensure correct dataset delivery",
      "Knowledge of Linux, AWS, relational & NoSQL databases, and Docker",
      "Willingness to learn new technologies and financial market domains",
      "Willingness to work in the BGC office as per schedule",
    ],
    desirable: [
      "Strong knowledge in object-oriented concepts, data structures, and algorithms",
      "Hands-on experience building complex data pipelines and ETL solutions",
      "Existing experience working in high-performing team environments",
    ],
  },
  "DevOps Engineer": {
    id: "devops-engineer",
    title: "DevOps Engineer",
    role: "Keep high-frequency systems and cloud platforms alive around the clock, across every market session",
    overview:
      "You will have opportunities in coding, building, testing, releasing, configuring, administering, and monitoring cloud and on-premise infrastructure. You will utilize automation, CI/CD pipelines, and Prometheus/Grafana monitoring to ensure global financial stability.",
    stack: ["Kubernetes", "CI/CD", "Prometheus", "Grafana", "AWS / GCP / Azure", "Linux"],
    location: "BGC Office (24x7 Shift Environment)",
    type: "Full-time",
    applyUrl: "https://forms.gle/niyMK6Wkc4v5yfLm7",
    responsibilities: [
      "Operations and support for High-Frequency Trading systems and Financial Market Data Pipelines across AWS/GCP/Azure",
      "Work with the Development, Data, and Research teams to improve IT operations",
      "Maintain application services using automation tools and CI/CD pipelines",
      "Ensure stability and support for all in-scope applications, executing BAU requests and runbook procedures",
      "Maintain monitoring dashboards using Prometheus, Grafana, and cloud native tools",
      "Handle incidents affecting application services up to problem management resolution",
    ],
    requirements: [
      "1-2 years experience supporting Linux environments with strong command line skills",
      "Fundamental UNIX/Linux knowledge and detail-oriented personality",
      "Positive attitude and strong willingness to learn complex global systems",
      "Good verbal and written communication skills",
      "Willingness to work in the BGC office in a 24x7 shift environment",
    ],
    desirable: [
      "Work experience in a global financial institution or tech start-up",
      "Work experience using cloud providers, preferably AWS",
      "Experience in Shell scripting and Python programming",
      "Root cause analysis skills and ability to suggest software improvements",
    ],
  },
  "R&D Internship Program": {
    id: "rd-internship-program",
    title: "R&D Internship Program",
    role: "Immersive paid engineering internship for top undergraduate students, working directly on production systems with senior mentorship",
    overview:
      "Our R&D Internship Program gives high-achieving undergraduate students early exposure to enterprise software development. Interns do not work on mock exercises — every intern is integrated into live engineering squads building real financial tools, web applications, and data pipelines.",
    stack: ["React", "TypeScript", "Node.js", "Python", "Git"],
    location: "BGC Office (Hybrid Schedule)",
    type: "Paid Internship",
    applyUrl: "https://forms.gle/niyMK6Wkc4v5yfLm7",
    responsibilities: [
      "Build production features for web portals, analytics dashboards, and automated test suites",
      "Write clean, well-tested code in React, Node.js, Python, or Go under senior guidance",
      "Present technical findings and completed project deliverables to engineering leadership",
      "Participate in hackathons, team tech talks, and engineering workshops",
    ],
    requirements: [
      "Currently enrolled undergraduate student in Computer Science, IT, Engineering, or relevant technical discipline",
      "Demonstrated programming capability through coursework, personal projects, or open-source contributions",
      "Curious mindset, strong communication skills, and willingness to learn complex technical concepts",
      "Available for a 3 to 6-month internship period (full-time or part-time hybrid)",
    ],
    desirable: [
      "Familiarity with containerization tools (Docker) and basic Linux command line",
      "Experience with relational databases (SQL) and Git version control",
      "Existing open-source project contributions or participation in programming competitions",
    ],
  },
};

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

export function JobDetailsDrawer({ open, jobTitle, onClose }: JobDetailsDrawerProps) {
  const detail = jobTitle ? (JOB_DETAILS[jobTitle] ?? JOB_DETAILS["Full Stack Developer"]) : null;

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

                {/* Desirable Skills */}
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
