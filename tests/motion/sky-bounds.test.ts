import { describe, expect, it } from "vitest";

import {
  CAMERA,
  CAMERA_ALTITUDE,
  CAMERAS,
  DECK_FADE_END,
  DECK_HALF,
  skyBounds,
  type CameraRig,
} from "@/features/hero/playground/constants";

/**
 * The sky ramp's bounds are the one piece of this room that has failed silently
 * before, and would again.
 *
 * `SkyDome` normalises `dir.y` into 0..1 across `[low, high]` and runs five
 * stops over the result. If that window sits outside the range the camera
 * actually sees, every pixel clamps to one end and the dome renders as a flat
 * fill — a beautifully authored gradient that looks like a bug in the palette.
 * It happened once with hard-coded bounds, and adding a second rig is exactly
 * the change that would do it again. None of this needs a WebGL context: the
 * derivation is arithmetic on the rig, so it is tested as arithmetic.
 */

const DEG = Math.PI / 180;

/** The `dir.y` a ray through the given fraction of the frame height has
 *  (0 = bottom edge, 1 = top), for a rig looking along the z axis. */
function frameRayY(rig: CameraRig, t: number): number {
  const pitch = Math.atan2(rig.position[1] - rig.target[1], rig.position[2] - rig.target[2]);
  const half = (rig.fov / 2) * DEG;
  // Elevation of the view axis is -pitch; the frame spans ±half around it.
  return Math.sin(-pitch - half + t * 2 * half);
}

describe("sky bounds · the downward rig", () => {
  const bounds = skyBounds(CAMERA);

  /** This camera never sees its horizon — it looks 24° down with a 17.5°
   *  half-fov, so the top of frame is still below horizontal. Both bounds being
   *  negative is the property, not an accident of the numbers. */
  it("paints the strip past the floor's far edge, entirely below horizontal", () => {
    expect(bounds.high).toBeLessThan(0);
    expect(bounds.low).toBeLessThan(bounds.high);
  });

  it("puts the whole ramp inside what the frame can see", () => {
    const top = frameRayY(CAMERA, 1);
    const bottom = frameRayY(CAMERA, 0);
    expect(bounds.high).toBeLessThanOrEqual(top + 0.05);
    expect(bounds.low).toBeGreaterThanOrEqual(bottom - 0.05);
  });

  /** The regression that motivated all of this: a window narrower than a
   *  rounding error resolves five stops to one colour. */
  it("spans a range wide enough for five stops to separate", () => {
    expect(bounds.high - bounds.low).toBeGreaterThan(0.02);
  });
});

describe("sky bounds · the altitude rig", () => {
  const bounds = skyBounds(CAMERA_ALTITUDE);

  /** This one does see its horizon, so the ramp is anchored there rather than
   *  on the floor's far edge — the strip trick would cram five stops into the
   *  top sliver and leave two thirds of the sky flat. */
  it("anchors on the horizon and runs up to the top of frame", () => {
    expect(bounds.low).toBe(0);
    expect(bounds.high).toBeGreaterThan(0.2);
    expect(bounds.high).toBeLessThan(1);
  });

  it("reaches the zenith stop inside the frame rather than only at its edge", () => {
    // A hair of headroom over the top ray, so k = 1 is approached, not missed.
    expect(bounds.high).toBeGreaterThan(frameRayY(CAMERA_ALTITUDE, 1) * 0.99);
  });
});

describe("the altitude rig · the composition it exists for", () => {
  /**
   * The single geometric fact the whole "floating" composition rests on: an
   * infinite horizontal plane's horizon projects to the camera's own level
   * line, whatever height the plane is at. So sky under the mark is bought by
   * lowering the *eye*, never by lowering the deck — and if someone raises this
   * camera above the mark's base to "see more of it", the deck closes behind
   * the mark and it goes back to standing on cloud.
   */
  it("puts the eye below the mark's base", () => {
    const MARK_LIFT = 1.5; // MonolithScene's own, mirrored deliberately (see below)
    expect(CAMERA_ALTITUDE.position[1]).toBeLessThan(MARK_LIFT);
  });

  /** Tilted up, which is what drops the horizon into the lower third. */
  it("looks up rather than down", () => {
    expect(CAMERA_ALTITUDE.target[1]).toBeGreaterThan(CAMERA_ALTITUDE.position[1]);
  });

  /** The deck's aerial fade has to finish inside the frustum, or the plane ends
   *  on a straight line — the one thing no horizon does. */
  it("can see the deck dissolve before the deck runs out", () => {
    expect(DECK_FADE_END).toBeLessThan(CAMERA_ALTITUDE.far);
    expect(DECK_HALF).toBeGreaterThan(DECK_FADE_END);
  });

  it("leaves the shared rig untouched for the other three designs", () => {
    expect(CAMERAS.room).toBe(CAMERA);
    expect(CAMERA.fov).toBe(35);
    expect(CAMERA.position[1]).toBe(5.5);
  });
});
