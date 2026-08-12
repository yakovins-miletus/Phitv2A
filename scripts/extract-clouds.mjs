#!/usr/bin/env node
/**
 * One-shot: pull cloud plates out of `public/_source/monolith.mp4`.
 *
 * Dev-only, not part of the app bundle — nothing in `src/` imports this file.
 * Run with `node scripts/extract-clouds.mjs`.
 *
 * The source is a screen capture of the Monolith hero mock, not a clean
 * background plate: the nav bar, headline, and CTA pill are baked into the
 * pixels across most of the frame. The only region that stays UI-free across
 * the whole clip is the bottom cloud band, so every plate is cropped from
 * there before anything else happens.
 *
 * Alpha comes from luminance (`lumakey`), which is a legitimate free alpha
 * channel exactly because clouds are the brightest thing in a dark night sky
 * — but this source is a *night* scene, so the cloud body itself is muted
 * navy/grey rather than a bright daytime white. `lumakey`'s soft threshold
 * keys out the near-black sky cleanly; the cloud body's own dim value survives
 * as partial alpha rather than a hard cutout, which is the correct behaviour
 * for a wisp but does mean these plates read as night/dusk vapour, not the
 * bright daytime cumulus the reference image shows. See the README note this
 * script prints at the end.
 *
 * No new npm dependency: `sharp` is not in package.json. ffmpeg (already
 * confirmed on PATH) does frame extraction, the luma key, the crop and the
 * resize in one filter graph per plate; ffmpeg's own build on this machine
 * has no libwebp *encoder* (`ffmpeg -encoders` has no `webp` line), but the
 * standalone `cwebp` binary from the `webp` Homebrew formula is also on PATH
 * and does the PNG->WebP step as a second pass. Two processes instead of one
 * `-c:v libwebp` ffmpeg call, flagged here rather than silently switched to
 * PNG output.
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync, statSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const FFMPEG = "/opt/homebrew/bin/ffmpeg";
const FFPROBE = "/opt/homebrew/bin/ffprobe";
const CWEBP = "/opt/homebrew/bin/cwebp";
const SOURCE = path.join(ROOT, "public/_source/monolith.mp4");
const OUT_DIR = path.join(ROOT, "public/images/clouds");
const TMP_DIR = path.join(ROOT, ".tmp-cloud-extract");

/**
 * Six candidate timestamps across the 8s clip (avoids the very first/last
 * frames, which are closest to a hard cut) and the bottom-left-band crop
 * each one shares: `y=560` to the bottom of the 720-tall source, `x=0..750`.
 *
 * Full-width (`0..1280`) was the first attempt and it was wrong: the
 * Monolith's own stone base stands in the bottom band on the right side of
 * frame at several of these timestamps (confirmed by inspecting the raw crop
 * before the luma key ran) — a dark column with one lit amber face, close
 * enough in luma to the cloud body that lumakey does not fully remove it, so
 * it survives into the plate as a hard-edged rectangular smudge. `x=0..750`
 * stays clear of it at every sampled timestamp.
 */
const PLATES = [
  { id: "cloud-01", t: 0.6 },
  { id: "cloud-02", t: 1.9 },
  { id: "cloud-03", t: 3.3 },
  { id: "cloud-04", t: 4.7 },
  { id: "cloud-05", t: 6.0 },
  { id: "cloud-06", t: 7.2 },
];

const CROP = "crop=750:160:0:560";
const WIDTHS = [640, 1280];

/** Luma key: below ~0.16 goes fully transparent, softened over 0.12 so the
 *  edge is a gradient rather than a cutout. Tuned against this clip's sky,
 *  which sits around luma 0.05-0.12 with stars spiking well above that — the
 *  softness band absorbs the star points instead of leaving keyed pinholes. */
const LUMAKEY = "lumakey=threshold=0.16:tolerance=0.10:softness=0.12";

function run(cmd, args) {
  execFileSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
}

function main() {
  rmSync(TMP_DIR, { recursive: true, force: true });
  mkdirSync(TMP_DIR, { recursive: true });
  mkdirSync(OUT_DIR, { recursive: true });

  try {
    run(FFPROBE, ["-version"]);
    run(CWEBP, ["-version"]);
  } catch {
    console.error("ffprobe or cwebp not found - aborting.");
    process.exit(1);
  }

  console.log(`Extracting ${PLATES.length} cloud plates from ${path.relative(ROOT, SOURCE)}...`);

  // Lossy WebP, alpha kept losslessly: `-q` governs the RGB channel (a soft
  // cloud plate tolerates real compression there), `-alpha_q 100` keeps the
  // keyed edge itself clean so the luma-key softness isn't re-quantised on
  // top of itself. Budget is 400KB across 6 plates x 2 widths (12 files); q45
  // landed at ~84KB total, so quality was raised to 78 for cleaner edges
  // while still leaving comfortable headroom under the budget.
  const WEBP_QUALITY = "78";

  for (const plate of PLATES) {
    for (const width of WIDTHS) {
      const tmpPng = path.join(TMP_DIR, `${plate.id}-${width}w.png`);
      const outFile = path.join(OUT_DIR, `${plate.id}-${width}w.webp`);
      const filter = `${CROP},${LUMAKEY},scale=${width}:-1:flags=lanczos`;
      run(FFMPEG, [
        "-y",
        "-ss",
        String(plate.t),
        "-i",
        SOURCE,
        "-frames:v",
        "1",
        "-vf",
        filter,
        "-loglevel",
        "error",
        tmpPng,
      ]);
      run(CWEBP, [
        "-q",
        WEBP_QUALITY,
        "-alpha_q",
        "100",
        "-m",
        "6",
        tmpPng,
        "-o",
        outFile,
        "-quiet",
      ]);
      unlinkSync(tmpPng);
      console.log(`  wrote ${path.relative(ROOT, outFile)}`);
    }
  }

  rmSync(TMP_DIR, { recursive: true, force: true });

  const files = readdirSync(OUT_DIR).filter((f) => f.endsWith(".webp"));
  const totalBytes = files.reduce((sum, f) => sum + statSync(path.join(OUT_DIR, f)).size, 0);
  console.log(
    `\nDone: ${files.length} files, ${(totalBytes / 1024).toFixed(1)} KB total in ${path.relative(ROOT, OUT_DIR)}`,
  );
  if (totalBytes > 400 * 1024) {
    console.warn("WARNING: over the 400KB budget - lower WEBP_QUALITY or drop a plate.");
  }
  console.log(
    "NOTE: source is a night scene, so plates read as dusk/night vapour, not bright daytime cumulus.",
  );
}

main();
