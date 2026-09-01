import { NOIR } from "./palette";

/**
 * Flat, single-indicator text field style for `variant="standard"` fields —
 * a hairline underline at rest, navy on hover/focus. Deliberately not
 * `variant="outlined"`: the outlined variant's notched-label mechanism,
 * combined with the global glass "well" focus treatment (a box-shadow glow
 * ring plus a separately-colored notch border — see MuiOutlinedInput in
 * components.ts, intentional for boxed/glass inputs elsewhere), produced a
 * double ring and a label/border collision when a component tried to flatten
 * it into an underline locally instead. `standard` sidesteps that mechanism
 * entirely rather than fighting it, and gives one clean focus indicator.
 */
export const MINIMAL_FIELD_SX = {
  "& .MuiInput-underline:before": {
    borderBottom: `1px solid ${NOIR.hairline}`,
  },
  "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
    borderBottom: `1px solid ${NOIR.navyField}`,
  },
  "& .MuiInput-underline:after": {
    borderBottom: `2px solid ${NOIR.navyField}`,
  },
  "& .MuiInput-underline.Mui-error:after": {
    borderBottomColor: "var(--danger-border, #C0392B)",
  },
  "& .MuiInputLabel-root": {
    color: "text.secondary",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: NOIR.navyField,
  },
} as const;
