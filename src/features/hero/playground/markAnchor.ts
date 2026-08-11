/**
 * The mark's screen box, published from inside the R3F scene that owns it and
 * read from outside the Canvas.
 *
 * `PlaygroundCanvas` is the generic room — it explicitly owns nothing about any
 * one scene's geometry — so this lives in its own module rather than in
 * `PlaygroundCanvas.tsx` importing `MonolithScene.tsx` directly (backwards: the
 * generic room reaching into one specific scene) or in `MonolithScene.tsx`
 * exporting something `PlaygroundCanvas` would have to know the scene's
 * internals to use.
 *
 * Same shape and reasoning as `heroPlaneRenderer.ts`'s `getLogoScreenBox`: a
 * module-scope mutable record, not a returned object, so nothing allocates on
 * the frame path, and `x`/`y`/`w` are fractions of the canvas rather than
 * pixels, so a consumer needs no size lookups of its own to use them.
 *
 * Written from `MonolithScene`'s own `useFrame` — the same callback that sets
 * the mark's group transform, so there is no cross-component frame-ordering to
 * get right. Read by `PlaygroundCanvas` from a plain `requestAnimationFrame`
 * loop outside the R3F render loop entirely, so it keeps working even while
 * the Canvas is parked at `frameloop="demand"` (it just re-reads the same,
 * harmless value until the next scene frame updates it).
 */

export interface MarkAnchorBox {
  /** The mark's centre, as a fraction of the canvas width. */
  x: number;
  /** The mark's ground-contact (visual bottom) point, as a fraction of the
   *  canvas height. */
  y: number;
  /** The mark's width, as a fraction of the canvas width. */
  w: number;
}

const box: MarkAnchorBox & { visible: boolean } = { x: 0.5, y: 0.6, w: 0.22, visible: false };

/** Called once per `MonolithScene` frame. `null` hides the mark (melted away,
 *  or the entrance settle has not started) — the caller should stop publishing
 *  rather than report a stale position under nothing. */
export function setMarkAnchorBox(next: MarkAnchorBox | null): void {
  if (!next) {
    box.visible = false;
    return;
  }
  box.x = next.x;
  box.y = next.y;
  box.w = next.w;
  box.visible = true;
}

/** Read-only view of the mark's current screen box. `null` if nothing has
 *  published one yet, or the mark is not currently visible. */
export function getMarkAnchorBox(): MarkAnchorBox | null {
  return box.visible ? box : null;
}
