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

/**
 * `micro` — one step below `caption`, for the mono meta-rail.
 *
 * The site has a real second register: uppercase, letter-spaced, monospace
 * labels ("SYS.LOC // MANILA", "EXPLORE PHITOPOLIS // DIRECTORY", section
 * kickers). Those were being written as raw `fontSize` values scattered
 * between 0.68rem and 0.7rem — three sizes that are indistinguishable on
 * screen but that made the scale look twice as large as it is. `overline`
 * already covers the 0.75rem tier of that register; this is the tier below it.
 *
 * `caption` is NOT declared here — MUI ships it, it just had no theme entry,
 * so it is configured in theme.ts alongside the rest rather than invented.
 */
declare module "@mui/material/styles" {
  interface TypographyVariants {
    micro: React.CSSProperties;
  }
  interface TypographyVariantsOptions {
    micro?: React.CSSProperties;
  }
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    micro: true;
  }
}

export {};
