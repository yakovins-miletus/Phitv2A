import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { Reveal } from "./Reveal";

interface PageHeaderProps {
  overline: string;
  title: string;
  lead?: string;
}

export function PageHeader({ overline, title, lead }: PageHeaderProps) {
  return (
    <Reveal>
      <Stack spacing={2} sx={{ maxWidth: 720, mb: { xs: 4, md: 6 }, pt: { xs: 2, md: 4 } }}>
        <Typography variant="overline" color="primary">
          {overline}
        </Typography>
        <Typography variant="h2" component="h1">
          {title}
        </Typography>
        {lead === undefined ? null : (
          <Typography variant="subtitle1" color="text.secondary">
            {lead}
          </Typography>
        )}
      </Stack>
    </Reveal>
  );
}
