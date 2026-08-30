import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";

import { Reveal } from "@/shared/components/Reveal";
import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";

const SERVICE_CATEGORIES = [
  { id: "all", label: "All Teams" },
  { id: "development", label: "Software Dev" },
  { id: "quant-research", label: "Quant Research" },
  { id: "data-science", label: "Data Science" },
  { id: "support", label: "Ops Support" },
] as const;

interface ServicesCategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

/** Light-ground category filter for the /services list — moved out of the
 *  (now dark, cinematic) hero so the filter sits with the content it filters. */
export function ServicesCategoryFilter({ selectedCategory, onSelectCategory }: ServicesCategoryFilterProps) {
  return (
    <Reveal>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ pb: { xs: 3, md: 4 } }}>
        {SERVICE_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <Chip
              key={cat.id}
              label={cat.label}
              onClick={() => onSelectCategory(cat.id)}
              size="small"
              sx={{
                fontFamily: MONO,
                fontSize: "0.76rem",
                fontWeight: isActive ? 800 : 600,
                letterSpacing: "0.04em",
                color: isActive ? NOIR.white : NOIR.navyField,
                bgcolor: isActive ? NOIR.navyField : "transparent",
                border: `1px solid ${isActive ? NOIR.navyField : NOIR.hairline}`,
                borderRadius: "6px",
                px: 0.8,
                py: 0.4,
                cursor: "pointer",
                boxShadow: "none",
                "&:hover": { bgcolor: isActive ? NOIR.navyField : "rgba(10,42,102,0.06)" },
              }}
            />
          );
        })}
      </Stack>
    </Reveal>
  );
}
