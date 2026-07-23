import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import type { ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
  /** Paper band with hairline borders — used to alternate page rhythm. */
  muted?: boolean;
}

export function Section({ children, muted = false }: SectionProps) {
  return (
    <Box
      component="section"
      sx={{
        py: { xs: 6, md: 10 },
        bgcolor: muted ? "background.paper" : "transparent",
        borderTop: muted ? 1 : 0,
        borderBottom: muted ? 1 : 0,
        borderColor: "divider",
      }}
    >
      <Container maxWidth="lg">{children}</Container>
    </Box>
  );
}
