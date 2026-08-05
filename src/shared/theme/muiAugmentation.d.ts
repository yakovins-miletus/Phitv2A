/**
 * Paper surface tiers.
 *
 * Paper's built-in variants (`elevation`, `outlined`) carry no meaning in a glass
 * design — elevation here is a translucency tier plus a blur, not a shadow depth —
 * so surfaces declare their tier explicitly instead:
 *
 *   glass        cards, list rows, input containers, muted section bands
 *   glassRaised  modals, drawers, popovers, menus, the mega-drawer
 *
 * Card forwards `variant` to Paper, so `<Card variant="glass">` type-checks off this
 * same declaration with no second augmentation.
 *
 * Only Paper is augmented. Button deliberately re-maps its three *existing* variants
 * onto the design's three tiers (text = hover pill, outlined = neutral glass,
 * contained = accent tint) so that ~60 existing call sites need no prop change.
 */

declare module "@mui/material/Paper" {
  interface PaperPropsVariantOverrides {
    glass: true;
    glassRaised: true;
  }
}

export {};
