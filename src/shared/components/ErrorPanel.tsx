import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

import { messageFromError } from "@/shared/api/errors";

interface ErrorPanelProps {
  error?: unknown;
  message?: string;
  onRetry?: () => void;
}

export function ErrorPanel({ error, message, onRetry }: ErrorPanelProps) {
  const text = message ?? messageFromError(error);
  return (
    <Stack alignItems="flex-start" spacing={2} sx={{ py: 8, px: { xs: 2, md: 6 } }}>
      <Alert severity="error" sx={{ width: 1 }}>
        {text}
      </Alert>
      {onRetry === undefined ? null : (
        <Button variant="outlined" onClick={onRetry}>
          Try again
        </Button>
      )}
    </Stack>
  );
}
