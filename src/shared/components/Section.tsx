import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import type { ReactNode, Ref } from "react";

interface SectionProps {
  children: ReactNode;
  /** Paper band with hairline borders — used to alternate page rhythm. */
  muted?: boolean;
  /** React 19 accepts `ref` as a plain prop on function components — no
   *  `forwardRef` needed. Forwarded to the root `<section>` so callers (e.g.
   *  a `useNavbarAnchor` anchor ref) can observe this section's DOM node
   *  directly instead of needing an extra wrapper `Box` inside every caller. */
  ref?: Ref<HTMLElement>;
}

export function Section({ children, muted = false, ref }: SectionProps) {
  return (
    <Box
      ref={ref}
      component="section"
      sx={{
        py: { xs: 6, md: 10 },
        bgcolor: muted ? "background.paper" : "transparent",
        borderTop: muted ? 1 : 0,
        borderBottom: muted ? 1 : 0,
        borderColor: "divider",
      }}
    >
      <Container maxWidth="2xl">{children}</Container>
    </Box>
  );
}
