import SearchIcon from "@mui/icons-material/Search";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useEffect, useRef, useState } from "react";

import type { BlogSort } from "@/features/blog/api";

const DEBOUNCE_MS = 300;

const SORT_OPTIONS: readonly { value: BlogSort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "title_az", label: "Title A–Z" },
  { value: "title_za", label: "Title Z–A" },
];

interface BlogToolbarProps {
  /** Committed search term from the URL ("" when none). */
  q: string;
  sort: BlogSort;
  /** Fired debounced; null means "clear the search param". */
  onQChange: (q: string | null) => void;
  onSortChange: (sort: BlogSort) => void;
}

/** Search + sort controls for the blog list. Input state is local so typing
    stays instant; the URL (single source of truth) is updated ~300ms behind. */
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
  "& .MuiSvgIcon-root": {
    color: "text.secondary",
  }
};

export function BlogToolbar({ q, sort, onQChange, onSortChange }: BlogToolbarProps) {
  const [value, setValue] = useState(q);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (timerRef.current === undefined) {
      setValue((current) => (current.trim() === q ? current : q));
    }
  }, [q]);

  useEffect(() => {
    return () => {
      window.clearTimeout(timerRef.current);
    };
  }, []);

  const handleChange = (next: string) => {
    setValue(next);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = undefined;
      const trimmed = next.trim();
      onQChange(trimmed === "" ? null : trimmed);
    }, DEBOUNCE_MS);
  };

  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 4 }}>
      <TextField
        value={value}
        onChange={(event) => {
          handleChange(event.target.value);
        }}
        size="small"
        placeholder="Search posts…"
        sx={{ flexGrow: 1, ...lightTextFieldSx }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
          htmlInput: { maxLength: 100, "aria-label": "Search posts" },
        }}
      />
      <TextField
        select
        value={sort}
        onChange={(event) => {
          onSortChange(event.target.value as BlogSort);
        }}
        size="small"
        sx={{ minWidth: 180, ...lightTextFieldSx }}
        slotProps={{ select: { "aria-label": "Sort posts" } }}
      >
        {SORT_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
    </Stack>
  );
}
