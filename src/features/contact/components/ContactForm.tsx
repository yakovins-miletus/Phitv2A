import { NOIR } from "@/shared/theme/palette";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import { SpecularButton as Button } from "@/shared/components/ui/specular";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import type { FormEvent } from "react";

import { messageFromError } from "@/shared/api/errors";

import { useSubmitContactMessage } from "../api";

const lightTextFieldSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "rgba(10, 42, 102, 0.03)",
    color: "text.primary",
    borderRadius: "12px",
    "& fieldset": { borderColor: "rgba(10, 42, 102, 0.18)" },
    "&:hover fieldset": { borderColor: "primary.main" },
    "&.Mui-focused fieldset": { borderColor: "primary.main", borderWidth: 1 },
  },
  "& .MuiInputLabel-root": {
    color: "text.secondary",
    "&.Mui-focused": { color: "primary.main" },
  },
};

/** Mirrors the server's ContactMessageIn constraints exactly. */
const RULES = {
  name: { min: 2, max: 100, label: "Name" },
  subject: { min: 3, max: 150, label: "Subject" },
  message: { min: 10, max: 4000, label: "Message" },
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormValues {
  name: string;
  email: string;
  subject: string;
  message: string;
  company_website: string;
}

const EMPTY_FORM: FormValues = {
  name: "",
  email: "",
  subject: "",
  message: "",
  company_website: "",
};

type FieldName = keyof FormValues;
type FieldErrors = Partial<Record<FieldName, string>>;

function validate(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};
  for (const field of ["name", "subject", "message"] as const) {
    const { min, max, label } = RULES[field];
    const length = values[field].trim().length;
    if (length < min) {
      errors[field] = `${label} must be at least ${String(min)} characters.`;
    } else if (length > max) {
      errors[field] = `${label} must be at most ${String(max)} characters.`;
    }
  }
  if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  return errors;
}

export function ContactForm() {
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const mutation = useSubmitContactMessage();

  const setField = (field: FieldName) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    mutation.mutate({
      name: values.name.trim(),
      email: values.email.trim(),
      subject: values.subject.trim(),
      message: values.message.trim(),
      company_website: values.company_website,
    });
  };

  if (mutation.isSuccess) {
    return (
      <Stack spacing={2} alignItems="flex-start">
        <CheckCircleOutlineIcon color="primary" fontSize="large" />
        <Typography variant="h3" component="p">
          Message received.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Thank you. Our partnerships team reads every inquiry and will reply within two
          business days.
        </Typography>
        <Button
          variant="outlined"
          onClick={() => {
            mutation.reset();
            setValues(EMPTY_FORM);
            setErrors({});
          }}
        >
          Send another message
        </Button>
      </Stack>
    );
  }

  return (
    <Box
      sx={{
        height: "100%",
        borderRadius: "24px",
        overflow: "hidden",
        border: "1px solid rgba(10, 42, 102, 0.12)",
        bgcolor: "background.paper",
        boxShadow: "0 20px 50px rgba(10, 42, 102, 0.06)",
        p: { xs: 3.5, md: 4.5 },
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <Stack component="form" spacing={2.5} onSubmit={handleSubmit} noValidate sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <Box>
          {mutation.isError ? (
            <Alert severity="error" sx={{ mb: 2 }}>{messageFromError(mutation.error)}</Alert>
          ) : null}
          <Stack spacing={2.5}>
            <TextField
              label="Name"
              value={values.name}
              onChange={setField("name")}
              error={errors.name !== undefined}
              helperText={errors.name ?? " "}
              required
              fullWidth
              sx={lightTextFieldSx}
            />
            <TextField
              label="Email"
              type="email"
              value={values.email}
              onChange={setField("email")}
              error={errors.email !== undefined}
              helperText={errors.email ?? " "}
              required
              fullWidth
              sx={lightTextFieldSx}
            />
            <TextField
              label="Subject"
              value={values.subject}
              onChange={setField("subject")}
              error={errors.subject !== undefined}
              helperText={errors.subject ?? " "}
              required
              fullWidth
              sx={lightTextFieldSx}
            />
            <TextField
              label="Message"
              value={values.message}
              onChange={setField("message")}
              error={errors.message !== undefined}
              helperText={errors.message ?? " "}
              multiline
              minRows={6}
              required
              fullWidth
              sx={lightTextFieldSx}
            />
          </Stack>
        </Box>

        {/* Honeypot */}
        <Box
          aria-hidden
          sx={{ position: "absolute", left: "-10000px", width: "1px", overflow: "hidden" }}
        >
          <TextField
            label="Company website"
            value={values.company_website}
            onChange={setField("company_website")}
            tabIndex={-1}
            autoComplete="off"
          />
        </Box>

        <Box sx={{ pt: 1 }}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={mutation.isPending}
            startIcon={mutation.isPending ? <CircularProgress size={18} color="inherit" /> : null}
            fullWidth
            sx={{
              borderRadius: "12px",
              py: 1.6,
              fontSize: "1rem",
              textTransform: "none",
              fontWeight: 800,
              bgcolor: "#0A2A66",
              color: "#FFFFFF",
              "&:hover": {
                bgcolor: NOIR.navyDeep,
              },
            }}
          >
            {mutation.isPending ? "Sending Inquiry..." : "Send Message"}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
