import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export function PendingPanel() {
  return (
    <Stack alignItems="center" spacing={2} sx={{ py: 12 }}>
      <CircularProgress size={28} />
      <Typography variant="body2" color="text.secondary">
        Loading…
      </Typography>
    </Stack>
  );
}
