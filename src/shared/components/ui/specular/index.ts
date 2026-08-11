/**
 * The specular button family — MUI `Button`/`IconButton` with a pointer-aimed
 * WebGL rim highlight, ported from React Bits' SpecularButton.
 *
 * Call sites swap the import and keep every prop:
 *   -import Button from "@mui/material/Button";
 *   +import { SpecularButton as Button } from "@/shared/components/ui/specular";
 */

export { SpecularButton, type SpecularButtonProps } from "./SpecularButton";
export { SpecularIconButton, type SpecularIconButtonProps } from "./SpecularIconButton";
export { default as SpecularFx, type SpecularFxProps } from "./SpecularFx";
