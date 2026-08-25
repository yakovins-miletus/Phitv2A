import { NOIR } from "@/shared/theme/palette";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import { SpecularButton as Button } from "@/shared/components/ui/specular";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useId, useRef, useState } from "react";
import type { FormEvent } from "react";

import { messageFromError } from "@/shared/api/errors";

import { useSubmitContactMessage } from "../api";

/**
 * Underline-at-rest, accent-on-focus. Fields recede until the reader
 * actually engages one — no filled background, no border box, no radius.
 * The `Mui-focused` outline (not just the underline colour) is what makes
 * focus visible without relying on colour alone.
 */
const lightTextFieldSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "transparent",
    color: "text.primary",
    borderRadius: "4px",
    "& fieldset": {
      borderRadius: "4px",
      borderWidth: "0 0 1px 0",
      borderColor: "rgba(10, 42, 102, 0.3)",
    },
    "&:hover fieldset": { borderColor: "primary.main" },
    "&.Mui-focused fieldset": { borderWidth: "0 0 2px 0", borderColor: "primary.main" },
    "&.Mui-focused": {
      outline: "2px solid var(--accent, #0A2A66)",
      outlineOffset: "2px",
    },
    "&.Mui-error fieldset": { borderWidth: "0 0 2px 0" },
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

/** Visual + focus order of the validated fields (excludes the honeypot). */
const FIELD_ORDER = ["name", "email", "subject", "message"] as const;
type ValidatedField = (typeof FIELD_ORDER)[number];

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

  // Stable id prefix (survives remounts, unique per instance) so each
  // field's helper text can be wired to it via aria-describedby — MUI only
  // generates that link when the field has an `id`.
  const formId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLInputElement>(null);
  const fieldRefs: Record<ValidatedField, React.RefObject<HTMLInputElement | null>> = {
    name: nameRef,
    email: emailRef,
    subject: subjectRef,
    message: messageRef,
  };
  const errorSummary = FIELD_ORDER.map((field) => errors[field]).filter(
    (message): message is string => Boolean(message),
  );

  const setField = (field: FieldName) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      // This form is `noValidate`, so the browser's own "focus the first
      // invalid field" behaviour never fires — reproduce it here so a
      // failed submit both announces (the alert below) and lands focus
      // on something a keyboard/screen-reader user can act on.
      const firstInvalidField = FIELD_ORDER.find((field) => nextErrors[field]);
      if (firstInvalidField) {
        fieldRefs[firstInvalidField].current?.focus();
      }
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
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Stack component="form" spacing={2.5} onSubmit={handleSubmit} noValidate sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <Box>
          {/* Client-side validation summary — a role="alert" region (MUI's
              Alert default) so a failed submit is announced even though
              nothing here uses native HTML5 validation (`noValidate` above). */}
          {errorSummary.length > 0 ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorSummary.join(" ")}
            </Alert>
          ) : null}
          {mutation.isError ? (
            <Alert severity="error" sx={{ mb: 2 }}>{messageFromError(mutation.error)}</Alert>
          ) : null}
          <Stack spacing={2.5}>
            <TextField
              id={`${formId}-name`}
              label="Name"
              value={values.name}
              onChange={setField("name")}
              error={errors.name !== undefined}
              helperText={errors.name ?? " "}
              required
              fullWidth
              inputRef={nameRef}
              sx={lightTextFieldSx}
            />
            <TextField
              id={`${formId}-email`}
              label="Email"
              type="email"
              value={values.email}
              onChange={setField("email")}
              error={errors.email !== undefined}
              helperText={errors.email ?? " "}
              required
              fullWidth
              inputRef={emailRef}
              sx={lightTextFieldSx}
            />
            <TextField
              id={`${formId}-subject`}
              label="Subject"
              value={values.subject}
              onChange={setField("subject")}
              error={errors.subject !== undefined}
              helperText={errors.subject ?? " "}
              required
              fullWidth
              inputRef={subjectRef}
              sx={lightTextFieldSx}
            />
            <TextField
              id={`${formId}-message`}
              label="Message"
              value={values.message}
              onChange={setField("message")}
              error={errors.message !== undefined}
              helperText={errors.message ?? " "}
              multiline
              minRows={6}
              required
              fullWidth
              inputRef={messageRef}
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
            autoComplete="off"
            // `tabIndex` as a top-level TextField prop lands on the
            // MuiFormControl-root wrapper div, not the actual <input> — which
            // stays in the normal tab order. Routing it through
            // slotProps.htmlInput is what actually keeps a keyboard user from
            // tabbing into this invisible field.
            slotProps={{ htmlInput: { tabIndex: -1 } }}
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
