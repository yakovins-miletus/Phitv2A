/**
 * The icon-only counterpart, a drop-in for MUI's `IconButton`.
 *
 * Two things are tuned down from `SpecularButton`, both because the target is a
 * ~34px circle rather than a 150px pill:
 *
 *   - `shineSize`/`shineFade` are widened. Those are *angular* windows, so on a
 *     small circle the upstream 10°/40° streak covers a few pixels of arc and
 *     reads as a dot rather than a highlight.
 *   - `proximity` is halved. The rim lighting up from 250px away is a strong cue
 *     that this is the primary action on screen; a close button and three social
 *     links in the footer should not all claim that. At 120px it lights as the
 *     cursor actually approaches.
 *
 * Anything can still be overridden per call site through `specular`.
 */

import IconButton, {
  type IconButtonProps,
  type IconButtonTypeMap,
} from "@mui/material/IconButton";
import type { ExtendButtonBase } from "@mui/material/ButtonBase";

import { NOIR } from "@/shared/theme/palette";
import SpecularFx from "./SpecularFx";
import type { SpecularOwnProps } from "./SpecularButton";
import "./specular.css";

export type SpecularIconButtonProps<
  RootComponent extends React.ElementType = IconButtonTypeMap["defaultComponent"],
> = IconButtonProps<RootComponent, SpecularOwnProps>;

function SpecularIconButtonInner({
  specular,
  children,
  sx,
  ...rest
}: IconButtonProps & SpecularOwnProps) {
  return (
    <IconButton
      {...rest}
      sx={[{ position: "relative" }, ...(Array.isArray(sx) ? sx : [sx ?? false])]}
    >
      <SpecularFx
        lineColor={NOIR.gold}
        baseOpacity={0}
        shineSize={26}
        shineFade={55}
        proximity={120}
        {...specular}
      />
      {children}
    </IconButton>
  );
}

/** Polymorphic re-type — see the note on SpecularButton for why this is needed
 *  (here it is the footer's `component="a"` social links that depend on it). */
export const SpecularIconButton = SpecularIconButtonInner as ExtendButtonBase<
  IconButtonTypeMap<SpecularOwnProps>
>;

export default SpecularIconButton;
