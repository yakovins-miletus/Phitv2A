import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import type { FormEvent } from "react";

import { messageFromError } from "@/shared/api/errors";

import { useSubmitContactMessage } from "../api";

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
          Thank you — our partnerships team reads every inquiry and will reply within two
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
    <Stack component="form" spacing={3} onSubmit={handleSubmit} noValidate>
      {mutation.isError ? (
        <Alert severity="error">{messageFromError(mutation.error)}</Alert>
      ) : null}
      <TextField
        label="Name"
        value={values.name}
        onChange={setField("name")}
        error={errors.name !== undefined}
        helperText={errors.name ?? " "}
        required
      />
      <TextField
        label="Email"
        type="email"
        value={values.email}
        onChange={setField("email")}
        error={errors.email !== undefined}
        helperText={errors.email ?? " "}
        required
      />
      <TextField
        label="Subject"
        value={values.subject}
        onChange={setField("subject")}
        error={errors.subject !== undefined}
        helperText={errors.subject ?? " "}
        required
      />
      <TextField
        label="Message"
        value={values.message}
        onChange={setField("message")}
        error={errors.message !== undefined}
        helperText={errors.message ?? " "}
        multiline
        minRows={5}
        required
      />
      {/* Honeypot: humans never see or fill this; bots that do get a decoy
          success. Off-screen rather than display:none so naive bots still
          treat it as fillable. */}
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
      <Box>
        <Button
          type="submit"
          variant="contained"
          disabled={mutation.isPending}
          startIcon={mutation.isPending ? <CircularProgress size={18} color="inherit" /> : null}
        >
          {mutation.isPending ? "Sending…" : "Send message"}
        </Button>
      </Box>
    </Stack>
  );
}
