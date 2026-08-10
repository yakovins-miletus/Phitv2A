import { useState, useMemo } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import { Plus, Minus, MagnifyingGlass } from "@phosphor-icons/react";
import Link from "@mui/material/Link";
import { Link as RouterLink } from "@tanstack/react-router";

import { MONO } from "@/shared/theme/theme";
import { CONTENT } from "@/shared/content";

export interface FAQItem {
  id: string;
  num: string;
  category: "General" | "Careers & Grad" | "Office & Work" | "Research & Lab";
  question: string;
  answer: React.ReactNode;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: "faq-1",
    num: "01",
    category: "General",
    question: "How fast can I expect a response to a partnership or technical inquiry?",
    answer: (
      <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7, fontSize: "0.98rem" }}>
        All messages submitted through our contact form are routed directly to our engineering leadership and partnerships team in Bonifacio Global City. You will receive a direct human response within <strong>1 to 2 business days</strong>.
      </Typography>
    ),
  },
  {
    id: "faq-2",
    num: "02",
    category: "Careers & Grad",
    question: "How do I apply for the Graduate Fellowship or R&D Internships?",
    answer: (
      <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7, fontSize: "0.98rem" }}>
        You can explore open positions and submit your application directly via our dedicated{" "}
        <Link component={RouterLink} to="/careers" underline="hover" color="primary" sx={{ fontWeight: 700 }}>
          Careers Page
        </Link>
        . Alternatively, email your CV, GitHub portfolio, and code samples directly to{" "}
        <Link href={`mailto:${CONTENT.contact.careersEmail}`} underline="hover" color="primary" sx={{ fontWeight: 700 }}>
          {CONTENT.contact.careersEmail}
        </Link>
        .
      </Typography>
    ),
  },
  {
    id: "faq-3",
    num: "03",
    category: "Office & Work",
    question: "Where is the Phitopolis main engineering office located?",
    answer: (
      <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7, fontSize: "0.98rem" }}>
        Our headquarters is located at <strong>27/F Ecotower Building, 32nd Street corner 9th Avenue, Bonifacio Global City (BGC), Taguig City, Metro Manila, Philippines 1634</strong>.
      </Typography>
    ),
  },
  {
    id: "faq-4",
    num: "04",
    category: "Office & Work",
    question: "Does Phitopolis support flexible hybrid or remote working?",
    answer: (
      <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7, fontSize: "0.98rem" }}>
        Yes! We operate a flexible hybrid model that combines collaborative in-person whiteboarding, system architecture reviews, and team sessions at our BGC office with quiet focus days working remotely.
      </Typography>
    ),
  },
  {
    id: "faq-5",
    num: "05",
    category: "Research & Lab",
    question: "Can external researchers or universities collaborate on R&D projects?",
    answer: (
      <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7, fontSize: "0.98rem" }}>
        We actively welcome research partnerships! We frequently collaborate with academic institutions, independent researchers, and open-source contributors through our{" "}
        <Link component={RouterLink} to="/innovation-hub" underline="hover" color="primary" sx={{ fontWeight: 700 }}>
          Innovation Lab
        </Link>{" "}
        initiatives.
      </Typography>
    ),
  },
  {
    id: "faq-6",
    num: "06",
    category: "General",
    question: "What technical domains does Phitopolis specialize in?",
    answer: (
      <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7, fontSize: "0.98rem" }}>
        Our core engineering focus spans <strong>Quantitative Research &amp; Financial Engineering</strong>, <strong>High-Performance Distributed C++ / Rust Systems</strong>, <strong>Data Science &amp; AI Signal Mining</strong>, and <strong>Cloud Infrastructure Engineering</strong>.
      </Typography>
    ),
  },
];

const CATEGORIES = ["ALL", "General", "Careers & Grad", "Office & Work", "Research & Lab"] as const;

export function ContactFAQ() {
  const [expanded, setExpanded] = useState<string | false>("faq-1");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const handleChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const filteredItems = useMemo(() => {
    return FAQ_ITEMS.filter((item) => {
      const matchesCategory = activeCategory === "ALL" || item.category === activeCategory;
      const matchesQuery =
        searchQuery.trim() === "" ||
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, searchQuery]);

  return (
    <Box sx={{ width: "100%", pt: 6, pb: 4 }}>
      <Stack spacing={4}>
        {/* Header Block */}
        <Stack direction={{ xs: "column", md: "row" }} spacing={3} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "flex-end" }}>
          <Box>
            <Typography variant="h2" sx={{ fontWeight: 900, fontSize: { xs: "1.8rem", md: "2.4rem" }, color: "text.primary", letterSpacing: "-0.02em" }}>
              Frequently Asked Questions
            </Typography>
          </Box>

          {/* Minimalist Search Input */}
          <TextField
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Box component={MagnifyingGlass} sx={{ color: "text.secondary", fontSize: "1.1rem" }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              width: { xs: "100%", sm: 260 },
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                bgcolor: "background.paper",
                fontFamily: MONO,
                fontSize: "0.82rem",
                border: "1px solid rgba(10, 42, 102, 0.12)",
                "&:hover": { borderColor: "#FFC72C" },
                "&.Mui-focused": { borderColor: "#FFC72C", boxShadow: "0 0 0 2px rgba(255, 199, 44, 0.2)" },
              },
            }}
          />
        </Stack>

        {/* Minimalist Filter Category Pills */}
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <Chip
                key={cat}
                label={cat}
                size="small"
                onClick={() => setActiveCategory(cat)}
                sx={{
                  fontFamily: MONO,
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  py: 1.8,
                  px: 1,
                  borderRadius: "8px",
                  cursor: "pointer",
                  bgcolor: isActive ? "#0A2A66" : "rgba(10, 42, 102, 0.04)",
                  color: isActive ? "#FFC72C" : "text.secondary",
                  border: "1px solid",
                  borderColor: isActive ? "#0A2A66" : "rgba(10, 42, 102, 0.1)",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: isActive ? "#0A2A66" : "rgba(10, 42, 102, 0.08)",
                  },
                }}
              />
            );
          })}
          <Typography sx={{ fontFamily: MONO, fontSize: "0.72rem", color: "text.secondary", alignSelf: "center", ml: "auto", display: { xs: "none", sm: "block" } }}>
            [ SHOWING {filteredItems.length} OF {FAQ_ITEMS.length} ]
          </Typography>
        </Stack>

        {/* Minimalist Accordion List */}
        <Stack spacing={0} sx={{ borderTop: "1px solid rgba(10, 42, 102, 0.12)" }}>
          {filteredItems.map((item) => {
            const isOpen = expanded === item.id;
            return (
              <Accordion
                key={item.id}
                expanded={isOpen}
                onChange={handleChange(item.id)}
                disableGutters
                elevation={0}
                sx={{
                  bgcolor: "transparent",
                  borderRadius: "0px !important",
                  borderBottom: "1px solid rgba(10, 42, 102, 0.08)",
                  borderLeft: isOpen ? "3px solid #FFC72C" : "3px solid transparent",
                  transition: "all 0.25s ease",
                  pl: { xs: 1, md: 2 },
                  "&:before": { display: "none" },
                  "&:hover": {
                    bgcolor: "rgba(10, 42, 102, 0.02)",
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={
                    isOpen ? (
                      <Box component={Minus} sx={{ color: "#FFC72C", fontSize: "1.2rem" }} />
                    ) : (
                      <Box component={Plus} sx={{ color: "text.secondary", fontSize: "1.2rem" }} />
                    )
                  }
                  sx={{
                    px: { xs: 1, md: 2 },
                    py: 2,
                    "& .MuiAccordionSummary-content": { my: 0 },
                  }}
                >
                  <Stack direction="row" spacing={2.5} alignItems="center" sx={{ width: "100%" }}>
                    <Typography
                      sx={{
                        fontFamily: MONO,
                        fontSize: "0.82rem",
                        color: isOpen ? "#FFC72C" : "text.secondary",
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {item.num}
                    </Typography>
                    <Typography
                      variant="h4"
                      component="span"
                      sx={{
                        fontWeight: isOpen ? 800 : 700,
                        fontSize: { xs: "1.05rem", md: "1.2rem" },
                        color: isOpen ? "primary.main" : "text.primary",
                        lineHeight: 1.3,
                      }}
                    >
                      {item.question}
                    </Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails
                  sx={{
                    px: { xs: 1, md: 2 },
                    pb: 3,
                    pt: 0,
                    pl: { xs: 5, md: 6 },
                  }}
                >
                  {item.answer}
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Stack>
      </Stack>
    </Box>
  );
}
