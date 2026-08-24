import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Collapse from "@mui/material/Collapse";
import { SpecularIconButton as IconButton } from "@/shared/components/ui/specular";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import type { BlogPostSummary } from "../api";

interface BlogSidebarProps {
  items: BlogPostSummary[];
}

const MOCK_ARCHIVE = [
  { year: "2025", months: [{ month: "January", count: 2 }, { month: "February", count: 4 }] },
  { year: "2024", months: [{ month: "January", count: 3 }, { month: "May", count: 1 }, { month: "August", count: 5 }, { month: "November", count: 2 }] },
  { year: "2023", months: [{ month: "February", count: 1 }, { month: "March", count: 4 }, { month: "July", count: 2 }, { month: "December", count: 6 }] },
  { year: "2022", months: [{ month: "April", count: 2 }, { month: "June", count: 3 }, { month: "September", count: 1 }] },
  { year: "2021", months: [{ month: "January", count: 5 }, { month: "October", count: 3 }] },
  { year: "2020", months: [{ month: "March", count: 2 }, { month: "August", count: 4 }] },
  { year: "2019", months: [{ month: "May", count: 1 }, { month: "November", count: 2 }] },
];

export function BlogSidebar(_props: BlogSidebarProps) {
  void _props;
  // Start with 2025 and 2024 expanded by default
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({
    "2025": true,
    "2024": true,
  });

  const toggleYear = (year: string) => {
    setExpandedYears(prev => ({
      ...prev,
      [year]: !prev[year]
    }));
  };

  return (
    <Box sx={{ 
      pr: { xs: 0, md: 4 }, 
      pb: { xs: 6, md: 0 },
      position: { md: "sticky" },
      top: { md: 90 },
      maxHeight: { md: "calc(100vh - 100px)" },
      overflowY: { md: "auto" },
      "&::-webkit-scrollbar": {
        width: "4px",
      },
      "&::-webkit-scrollbar-track": {
        background: "transparent",
      },
      "&::-webkit-scrollbar-thumb": {
        background: "rgba(0, 0, 0, 0.1)",
        borderRadius: "4px",
      },
      "&::-webkit-scrollbar-thumb:hover": {
        background: "rgba(0, 0, 0, 0.2)",
      },
    }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 4, color: "text.primary" }}>
        Archive
      </Typography>
      
      <Stack spacing={2}>
        {MOCK_ARCHIVE.map(({ year, months }) => {
          const isExpanded = !!expandedYears[year];
          
          return (
            <Box key={year}>
              <Box 
                onClick={() => toggleYear(year)}
                sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between",
                  cursor: "pointer",
                  p: 1,
                  borderRadius: 1,
                  "&:hover": { bgcolor: "rgba(255, 255, 255, 0.05)" }
                }}
              >
                <Typography variant="h6" fontWeight={600} sx={{ color: "text.primary" }}>
                  {year}
                </Typography>
                <IconButton size="small" sx={{ color: "text.secondary" }}>
                  {isExpanded ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
                </IconButton>
              </Box>
              
              <Collapse in={isExpanded}>
                <Stack spacing={1.5} sx={{ pl: 2, mt: 1, mb: 2, borderLeft: "2px solid", borderColor: "divider", ml: 1 }}>
                  {months.map(({ month, count }) => (
                    <Box key={month} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pl: 1 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: "text.secondary",
                          cursor: "pointer", 
                          // Brand gold is 1.45:1 on this ground — a hover state that
                          // makes the label *less* readable than its rest state.
                          "&:hover": { color: "var(--accent-fg)" } 
                        }}
                      >
                        {month}
                      </Typography>
                      {/* The archive count is information, not a disabled control: `text.disabled`
                          is deliberately sub-AA (2.21:1 here) and must not carry content. */}
                      <Typography variant="caption" sx={{ color: "var(--text-3)", fontWeight: 600 }}>
                        {count}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Collapse>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
