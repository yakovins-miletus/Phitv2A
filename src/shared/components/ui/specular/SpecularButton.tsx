/**
 * A drop-in replacement for MUI's `Button` that carries the specular rim.
 *
 * `import Button from "@mui/material/Button"` becomes
 * `import { SpecularButton as Button } from "@/shared/components/ui/specular"`
 * and nothing else at the call site changes: this forwards every Button prop,
 * so `component={Link}`, `type="submit"`, `startIcon`, `fullWidth`, `variant`
 * and per-page `sx` all behave exactly as before. That mattered — the call sites
 * include router links, a form submit and several drawer actions, and a bare
 * `<button>` would have silently dropped their behaviour.
 *
 * The rim's default colour is the brand gold rather than upstream's white. On
 * this ground a white highlight reads as a generic glass control; the gold is
 * the site's one accent (see NOIR.gold in src/shared/theme/palette.ts) and is
 * already the hover colour for every button variant, so the rim lights up in
 * the colour the button was going to turn anyway.
 */

import Button, { type ButtonProps, type ButtonTypeMap } from "@mui/material/Button";
import type { ExtendButtonBase } from "@mui/material/ButtonBase";

import { NOIR } from "@/shared/theme/palette";
import SpecularFx, { type SpecularFxProps } from "./SpecularFx";
import "./specular.css";

/** The one prop this adds on top of MUI's. */
export interface SpecularOwnProps {
  /** Tuning for the rim. Omit for the site default. */
  specular?: SpecularFxProps;
}

export type SpecularButtonProps<
  RootComponent extends React.ElementType = ButtonTypeMap["defaultComponent"],
> = ButtonProps<RootComponent, SpecularOwnProps>;

function SpecularButtonInner({
  specular,
  children,
  sx,
  ...rest
}: ButtonProps & SpecularOwnProps) {
  // A gold highlight on the gold `contained` fill is a highlight you cannot
  // see. Those buttons get the white one instead — which is also the physically
  // truthful reading, since a specular is the light source, not the surface.
  const lineColor = rest.variant === "contained" ? NOIR.white : NOIR.gold;

  return (
    <Button
      {...rest}
      sx={[
        // `position: relative` is already MUI's default for Button, but the rim
        // is absolutely positioned against it and a call-site `sx` that changes
        // position would detach it. Stating it here keeps the anchor explicit.
        { position: "relative" },
        ...(Array.isArray(sx) ? sx : [sx ?? false]),
      ]}
    >
      <SpecularFx lineColor={lineColor} baseOpacity={0} {...specular} />
      {children}
    </Button>
  );
}

/**
 * Re-typed as MUI types its own Button.
 *
 * `ButtonProps` alone is the *non-polymorphic* face of the component. MUI
 * declares `Button` as `ExtendButtonBase<ButtonTypeMap>`, which is that type
 * plus an overload accepting anchor props when `href` is present — which is how
 * `<Button href=… target="_blank">` and `<Button component="a" download=…>`
 * type-check across this codebase. Annotating the wrapper with `ButtonProps`
 * dropped that overload and broke six call sites; this restores it.
 *
 * The assertion is the standard MUI wrapper idiom: the implementation genuinely
 * accepts these props (it spreads them straight through), but a plain function
 * declaration cannot express the overload set on its own.
 */
export const SpecularButton = SpecularButtonInner as ExtendButtonBase<
  ButtonTypeMap<SpecularOwnProps>
>;

export default SpecularButton;
