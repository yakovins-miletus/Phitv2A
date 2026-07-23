export const LIQUID_INSET_X_DEFAULT = 0; // px shaved off each side (horizontal space from the viewport edges)
export const LIQUID_INSET_Y_DEFAULT = 0; // px pushed down from the top edge (vertical space above the bar)

export const LIQUID_INSET_X_MAX = 160;
export const LIQUID_INSET_Y_MAX = 48;

export function clampInsetX(value: number): number {
  return Math.min(LIQUID_INSET_X_MAX, Math.max(0, value));
}

export function clampInsetY(value: number): number {
  return Math.min(LIQUID_INSET_Y_MAX, Math.max(0, value));
}
