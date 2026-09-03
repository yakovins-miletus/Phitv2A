# Image and Video Generation Brief

This document turns the current Fresko/Phitopolis POC into a practical generation queue. It covers the sections where generated media can either work as **background atmosphere** or carry meaning as **content**.

The direction is institutional fintech R&D, not consumer crypto, sci-fi trading, or generic “AI company” imagery. The visual world should feel engineered, calm, exact, globally credible, and recognizably Phitopolis.

## Recommended generation order

| Priority | Section | Role | Recommendation |
|---|---|---|---|
| P0 | Home — Use Cases | Background + explanatory content | Generate three coordinated isometric stills first, then derive restrained 6–8 second loops. This is the best use of generated media in the POC. |
| P0 | Home — Operating Pillars | Content panels | Upgrade the three current stock-like office scenes into one coherent editorial series. Optional subtle cinemagraph versions can make the horizontal section feel alive. |
| P1 | Services hero | Background video | Replace the repurposed office-culture excerpt with a purpose-built systems-and-markets loop. |
| P1 | Innovation Hub hero | Background video | Give the innovation page its own experimental R&D identity instead of reusing the general daily-life film. |
| P1 | About hero | Background image + optional video | Refine the Manila/BGC dusk setting. Keep the city real and plausible; use generation only for atmosphere, not invented corporate history. |
| P2 | Careers role cards | Content backgrounds | Use restrained technical workspaces or tools, preferably without identifiable generated faces. Real employee photography is still the stronger final choice. |
| P2 | Technical blog thumbnails | Content imagery | Generate only for technical essays, benchmarks, and architecture posts. Keep actual company-event posts on real photography. |

## Sections that should not receive generated backgrounds

- **Global Markets Statement:** the typographic negative space is the point. Extra imagery would turn a sharp thesis into a generic fintech hero.
- **Mission Statement:** the existing wireframe service globe already expresses global reach and the four disciplines.
- **Process:** the diagram communicates ordered, factual growth. A generated background would compete with it; a generated diagram may invent labels or relationships.
- **Reach:** the map and city relationships are factual. Keep them authored and data-led.
- **Closing:** the existing Phitopolis mark and node lattice are a stronger ownable visual than a generated film.
- **Behind the Code / Daily Life, About gallery, testimonials, and event blog posts:** these claim to show real people and real company life. Use authentic footage and photography.
- **Contact:** clarity and trust matter more than atmosphere around the form and map.

## Global visual lock

Use this block at the beginning or end of every prompt where the generator supports a reusable style instruction.

```text
PHITOPOLIS VISUAL SYSTEM — institutional quantitative R&D, disciplined editorial art direction, calm engineered precision, premium but understated, contemporary Manila-based global fintech firm. Core palette only: midnight navy #061226, deep navy #06183B, brand navy #0A2A66, cool frost #F4F7FC, pure white #FFFFFF, restrained Phitopolis gold #FFC72C. Gold is a sparse signal accent, never the dominant field. Clean geometry, high material realism, controlled contrast, generous negative space, no visual clutter. Lighting is cool daylight or deep navy studio light with a narrow warm gold edge. No legible text inside the generated image.
```

### Global negative prompt

```text
No cryptocurrency symbols, coins, candlestick-chart wallpaper, Wall Street clichés, bulls or bears, holographic HUD interfaces, neon cyan or purple, cyberpunk, outer-space fantasy, robots, glowing brains, circuit-board faces, handshakes, suited executives posing at camera, call-center stock photography, fake logos, fake company names, legible UI text, gibberish typography, watermarks, distorted screens, duplicated objects, extra fingers, uncanny faces, extreme depth of field, oversaturated color, plastic toy look unless the prompt explicitly requests a clay/isometric model.
```

## Generation workflow

1. Generate and approve the **still image first**. It becomes both the poster frame and the visual reference for image-to-video.
2. For background loops, animate the approved still with **small internal movement and a locked or nearly locked camera**. Do not ask a video model to redesign the scene.
3. Keep the first and last frames visually compatible. If the provider cannot create a true loop, generate 5–6 seconds of forward motion and build an 8–10 second ping-pong loop in post.
4. Keep important subjects inside the center 70% so a 16:9 desktop frame can safely crop to 4:5 or 9:16 on mobile.
5. Generate without text. All headings, labels, charts, and metrics stay in HTML/SVG for accessibility and accuracy.

## Asset prompt packs

### UC-01 — Algorithmic Signal Generation

**Placement:** Home → Use Cases → Case 01. Sticky full-viewport backdrop behind a left-side copy column.

**Role:** Background and explanatory content. The image must communicate noisy data becoming a durable signal without using literal charts or UI.

**Image prompt**

```text
[PHITOPOLIS VISUAL SYSTEM]

Create a premium 3D editorial still for “Algorithmic Signal Generation.” A large soft-isometric research landscape occupies the RIGHT 58% of the frame, leaving the LEFT 42% quiet, pale, low-detail negative space for website copy. On a cool-frost architectural plinth, dozens of irregular translucent data fragments and low navy blocks enter from the far right and pass through a precise sequence of filtering gates. Most fragments dissipate into soft frost haze; one narrow Phitopolis-gold path survives, becomes cleaner and more stable, and rises gently toward the upper-right. Include restrained navy sampling nodes, subtle uncertainty bands made from translucent material, and a final compact validation chamber. The metaphor is rigorous statistical filtering and out-of-sample validation, not financial speculation. Soft museum-product lighting, orthographic/isometric camera, refined matte ceramic and frosted-glass materials, realistic shadows, high-end editorial visualization, calm and spacious.

Composition: 16:9, 1536×864 minimum, subject weighted right, left text-safe zone, no critical objects within 8% of frame edges.
Palette: #061226, #06183B, #0A2A66, #F4F7FC, #FFFFFF, sparse #FFC72C only.
Negative: [GLOBAL NEGATIVE PROMPT], no readable chart axes, no numbers, no trading terminal, no literal stock-price line.
```

**Video prompt — image-to-video**

```text
Animate the approved Algorithmic Signal Generation still as a seamless 7-second ambient loop. Lock the camera. Small translucent data fragments drift slowly into the filtering gates; noisy fragments fade or settle; the single gold path emits one restrained pulse traveling from input to output; two or three navy sampling nodes brighten softly and return to rest. Preserve the exact composition, materials, colors, empty left text-safe area, and object count. No new objects, no camera orbit, no zoom, no scene transformation, no fast particles, no flicker, no text. First and final frame must match closely enough to loop invisibly. Motion should remain readable beneath a light website scrim.
```

**Output:** AVIF/WebP poster, 1536×864, target ≤180 KB. Optional AV1/WebM + H.264 MP4, 7 seconds, 24 fps, target ≤1.5 MB each, muted, seamless.

---

### UC-02 — Cloud-Native Infrastructure

**Placement:** Home → Use Cases → Case 02. Sticky full-viewport backdrop behind a right-side copy column.

**Role:** Background and explanatory content. It should show resilient multi-region ingestion and distribution without becoming a network-diagram screenshot.

**Image prompt**

```text
[PHITOPOLIS VISUAL SYSTEM]

Create a premium 3D editorial still for “Cloud-Native Infrastructure.” Build a soft-isometric distributed-systems landscape on the LEFT 58% of the frame, leaving the RIGHT 42% as quiet cool-frost negative space for website copy. Three compact navy intake pavilions receive thin streams from different directions. Their paths converge through a precise normalization spine, pass through one fault-tolerant gold switching junction, then fan out to modular service pods and two low floating cloud slabs. Show redundancy through paired paths and calm symmetry, not tangled wires. One route can be temporarily diverted around a closed module to imply resilience and zero-loss processing. Matte ceramic architecture, frosted translucent channels, subtle internal light, orthographic/isometric view, high-end editorial product visualization, spacious composition, physically plausible shadows.

Composition: 16:9, 1536×864 minimum, subject weighted left, right text-safe zone, safe center crop for mobile.
Palette: #061226, #06183B, #0A2A66, #F4F7FC, #FFFFFF, sparse #FFC72C only.
Negative: [GLOBAL NEGATIVE PROMPT], no provider logos, no AWS/Azure/GCP marks, no server-room cliché, no readable dashboards, no impossible cable tangles.
```

**Video prompt — image-to-video**

```text
Animate the approved Cloud-Native Infrastructure still as a seamless 7-second loop with a locked camera. Soft packets of light move slowly through the three intake routes, merge at the normalization spine, and fan out to service pods. Once per loop, one route closes and traffic calmly diverts through the paired path, then the system returns to its initial state. Use navy-white pulses with one brief gold handoff at the switching junction. Preserve the approved composition and the empty right text-safe area. No new buildings, no camera movement, no UI overlays, no fast data storm, no flicker, no text. The motion must feel reliable and continuously operating, not dramatic.
```

**Output:** AVIF/WebP poster, 1536×864, target ≤180 KB. Optional 7-second WebM/MP4 loop, 24 fps, target ≤1.5 MB each.

---

### UC-03 — Global Technical Operations

**Placement:** Home → Use Cases → Case 03. Sticky full-viewport backdrop behind a left-side copy column.

**Role:** Background and explanatory content. Show around-the-clock handoff and recovery without a call-center scene.

**Image prompt**

```text
[PHITOPOLIS VISUAL SYSTEM]

Create a premium 3D editorial still for “Global Technical Operations.” Place the primary scene on the RIGHT 58% of the frame, leaving the LEFT 42% quiet and low-detail for website copy. A refined pale globe sits on a navy-and-frost operations plinth, with accurate but simplified continents and Manila subtly positioned as the operational origin. Three small, unoccupied operations stations sit around the globe like precise instruments rather than office desks. A thin gold daylight arc travels across three time-zone segments while navy monitoring rings remain continuous around the planet. Add one small service module returning from amber alert to steady navy to imply automated recovery. Orthographic/isometric camera, matte ceramic and frosted-glass materials, soft studio light, institutional editorial visualization, calm, globally credible, no people required.

Composition: 16:9, 1536×864 minimum, subject weighted right, left text-safe zone, center-safe mobile crop.
Palette: #061226, #06183B, #0A2A66, #F4F7FC, #FFFFFF, sparse #FFC72C only.
Negative: [GLOBAL NEGATIVE PROMPT], no call-center headsets, no flags, no military command center, no glowing world-map HUD, no false city labels, no text.
```

**Video prompt — image-to-video**

```text
Animate the approved Global Technical Operations still as a seamless 8-second ambient loop. Camera remains locked. The narrow gold daylight arc advances slowly across the globe and returns invisibly to its initial position; monitoring rings make a barely perceptible steady rotation; one small module changes from a soft amber pulse back to navy and remains stable; tiny station indicators breathe gently. Preserve the exact geography, scene layout, materials, palette, and empty left copy area. No camera orbit, no rapid spinning globe, no added labels, no blinking alarm wall, no text, no scene morphing.
```

**Output:** AVIF/WebP poster, 1536×864, target ≤180 KB. Optional 8-second WebM/MP4 loop, 24 fps, target ≤1.5 MB each.

---

### OP-01 — Research Pillar

**Placement:** Home → Operating Pillars → Research. Full-height content panel with right-side text scrim.

**Role:** Primary content image; optional subtle cinemagraph. Unlike the Use Cases, this series should feel photographic and human, but never like stock photography.

**Image prompt**

```text
[PHITOPOLIS VISUAL SYSTEM]

Create a cinematic editorial photograph of a quantitative researcher working in a contemporary Manila R&D studio. The person is seen naturally from behind and slightly to the side, absorbed in work, not posing. Two monitors show abstract, intentionally unreadable statistical structures and code-like blocks with no legible text. A whiteboard carries faint geometric model sketches only, no words. Morning daylight enters through a high-rise window; a narrow Phitopolis-gold reflection touches one desk edge. Frame the active research environment across the LEFT and CENTER, while the RIGHT 35% falls into clean deep-navy shadow for website title and body copy. Realistic Filipino workplace context, premium documentary photography, restrained color grade, authentic proportions and equipment, 35mm lens feel, medium-wide composition.

Composition: 16:9, 1536×864 minimum, text-safe right zone, subject not looking at camera.
Palette grade: cool white, steel, #06183B and #0A2A66 shadows, tiny #FFC72C accent.
Negative: [GLOBAL NEGATIVE PROMPT], no readable Bloomberg screens, no fake equations, no lab coat, no posed smile, no multiple visible faces, no dark hacker basement.
```

**Video prompt — image-to-video**

```text
Turn the approved Research Pillar still into a restrained 6-second cinemagraph. Preserve the person, workspace, framing, and text-safe right shadow exactly. The researcher makes one small natural mouse or keyboard movement; a soft window-light shift crosses the desk; abstract monitor structures update subtly without producing readable text; a distant city reflection moves almost imperceptibly. Locked camera with at most a 1% slow push-in. No head turn toward camera, no new people, no hand deformation, no large gestures, no screen flicker, no scene redesign. End close to the starting frame for a gentle loop.
```

---

### OP-02 — Development Pillar

**Placement:** Home → Operating Pillars → Development.

**Role:** Primary content image; matched to OP-01 and OP-03 as one visual series.

**Image prompt**

```text
[PHITOPOLIS VISUAL SYSTEM]

Create a cinematic editorial photograph of a software engineer building a high-reliability cloud platform in a contemporary Manila engineering studio. Natural three-quarter rear view; the engineer works between a laptop, one large monitor, and a compact glass-front infrastructure rack. Screens contain abstract, unreadable architecture blocks and code texture only. The scene feels orderly and production-focused: cable management, notebook, test device, no gadget clutter. Cool side light and a restrained gold practical light create depth. Keep the RIGHT 35% as a clean deep-navy shadow field for website copy; place the engineer and equipment across the LEFT and CENTER. Premium documentary realism, 35mm lens, subtle film grain, credible modern office, no stock-photo posing.

Composition: 16:9, 1536×864 minimum, consistent camera height and grade with OP-01, text-safe right zone.
Negative: [GLOBAL NEGATIVE PROMPT], no Matrix code, no giant server hall, no RGB gaming lights, no hoodie-hacker cliché, no readable UI, no posed face.
```

**Video prompt — image-to-video**

```text
Animate the approved Development Pillar still as a restrained 6-second cinemagraph. Lock the composition. The engineer makes a small natural keyboard action; one abstract deployment path moves gently across the large monitor; a single rack indicator changes state and settles; gold practical light breathes almost imperceptibly. Preserve the right-side navy text-safe area. No camera orbit, no fast typing, no new UI, no flashing server lights, no new people, no hand or screen distortion. Finish close to the first frame.
```

---

### OP-03 — Support and Delivery Pillar

**Placement:** Home → Operating Pillars → Support & Delivery.

**Role:** Primary content image; matched to the other two pillar panels.

**Image prompt**

```text
[PHITOPOLIS VISUAL SYSTEM]

Create a cinematic editorial photograph of a site-reliability and technical-operations engineer during a calm shift handoff in a contemporary Manila R&D studio. Show one engineer in natural side/rear view at an organized workstation with three restrained monitoring displays; all interfaces are abstract and unreadable. A second colleague may appear only as a soft, partial silhouette at the edge of frame, suggesting communication without turning the image into a call-center scene. World-clock light bands or a physical clock may be present but contain no legible city labels. The atmosphere is attentive, calm, and continuously operational. Place activity across the LEFT and CENTER; reserve the RIGHT 35% as deep-navy negative space for copy. Premium documentary photography, realistic office light, subtle gold edge light, consistent 35mm treatment with OP-01 and OP-02.

Composition: 16:9, 1536×864 minimum, text-safe right zone.
Negative: [GLOBAL NEGATIVE PROMPT], no headset call-center row, no red-alert crisis, no military control room, no readable dashboards, no smiling team pose, no exaggerated screens.
```

**Video prompt — image-to-video**

```text
Animate the approved Support and Delivery still as a restrained 6-second cinemagraph. One monitoring trace makes a slow stable pass, one small status indicator returns from amber to steady navy, and the primary engineer makes a subtle head or hand movement toward the adjacent station. Keep the camera locked, the scene calm, and the right text-safe zone untouched. No alarms, no flashing red, no fast chart motion, no conversation lip-sync, no new people, no screen text, no body deformation. End near the initial frame for looping.
```

**Shared OP output:** AVIF/WebP, 1536×864 or 1920×1080, target ≤220 KB per still. Optional 6-second WebM/MP4, 24 fps, target ≤1.5 MB each. Generate all three with the same seed/style reference where supported.

---

### HERO-SVC — Services Page Systems Loop

**Placement:** `/services` hero, full-bleed background behind bottom-left copy.

**Role:** Background atmosphere. The content must survive heavy navy scrims and should not contain a single focal object directly behind the headline.

**Image / poster prompt**

```text
[PHITOPOLIS VISUAL SYSTEM]

Create a cinematic wide hero poster representing high-performance financial technology without literal trading clichés. A dark, architectural data environment spans the frame: low navy infrastructure planes, precise event streams moving through transparent layers, a distant suggestion of a global network, and one sparse gold routing line connecting research, cloud engineering, data, and operations. It should feel like a physical systems model photographed at monumental scale, not a software dashboard. Reserve the LEFT 55% and especially the lower-left quadrant as low-detail deep-navy negative space for a large white headline. Place richer structures in the upper-right and far background. Deep perspective, restrained volumetric haze, highly controlled highlights, premium institutional film still, no people necessary.

Composition: 16:9, 1920×1080, lower-left text-safe zone, safe 4:5 crop.
Negative: [GLOBAL NEGATIVE PROMPT], no legible charts, no city labels, no crypto, no bright central explosion, no busy foreground under text.
```

**Video prompt**

```text
Create an 8-second seamless cinematic background loop based on the approved Services poster. Camera performs an extremely slow 2% forward drift. Thin event streams move steadily through translucent infrastructure planes; one gold routing pulse travels once from the upper-right network toward the center and fades; distant system nodes breathe at different slow intervals. Preserve the empty lower-left headline area and dark overall exposure. Motion is continuous, reliable, and quiet. No scene cuts, no camera roll, no rapid tunnel flight, no interface text, no flashing charts, no object generation mid-shot. First and final frames must loop cleanly.
```

**Output:** poster AVIF/WebP ≤200 KB; 8-second 1920×1080 master, deliver 1280×720 WebM/MP4 ≤1.5 MB each.

---

### HERO-INNO — Innovation Hub Experimental R&D Loop

**Placement:** `/innovation-hub` hero or future Innovation hero, full-bleed background.

**Role:** Background atmosphere with a more experimental tone than Services, while staying within the same brand world.

**Image / poster prompt**

```text
[PHITOPOLIS VISUAL SYSTEM]

Create a cinematic editorial hero poster for an internal innovation lab opening its tools to the public. Show a dark physical prototyping bench at architectural scale: modular navy compute blocks, a precise mechanical test rig, translucent model layers, a compact inference graph represented as physical connections, and one unfinished gold module being fitted into the system. The scene should suggest C++, Rust, Python, machine learning prototypes, and engineer-initiated experiments without using logos, code text, or a robot. Reserve the LEFT 58% as deep, low-detail navy negative space for the page headline; concentrate the experimental apparatus on the RIGHT. Cool controlled studio lighting, narrow gold task light, refined realistic materials, credible research instrumentation, premium and curious rather than futuristic spectacle.

Composition: 16:9, 1920×1080, left text-safe zone, safe center crop.
Negative: [GLOBAL NEGATIVE PROMPT], no glowing brain, no humanoid robot, no neon laboratory, no chemistry glassware unless incidental, no readable code, no magical energy beam.
```

**Video prompt**

```text
Animate the approved Innovation Hub poster into an 8-second seamless ambient loop. Camera remains locked or drifts less than 2%. A small mechanical test carriage completes one precise cycle; translucent model layers align and separate slowly; a gold task light passes once over the unfinished module; two small compute nodes activate and return to their initial state. Preserve the empty left headline area and the exact apparatus. No sparks, no dramatic robot motion, no added objects, no text, no jump cuts, no rapid blinking, no purple or cyan color shift. The loop should feel like a real experiment running quietly after hours.
```

**Output:** poster AVIF/WebP ≤200 KB; 8-second 1280×720 WebM/MP4 ≤1.5 MB each.

---

### HERO-ABOUT — Manila / BGC Dusk Identity

**Placement:** `/about` sticky hero background behind left-side copy and right-side authentic photo gallery.

**Role:** Background atmosphere only. The skyline must remain plausible and subordinate to the real company photography.

**Image prompt**

```text
[PHITOPOLIS VISUAL SYSTEM]

Create a photorealistic cinematic dusk panorama inspired by Bonifacio Global City, Metro Manila, viewed from a high but plausible urban vantage point. Modern high-rises catch the last warm daylight while lower streets and rooftops recede into cool navy haze. The skyline must feel geographically plausible for BGC and Manila but should not fabricate a recognizable landmark or display any building logo. Reserve the LEFT 48% as darker, lower-detail negative space for white and gold website copy. Keep the RIGHT side clearer and brighter but not so busy that it fights a foreground photo gallery. Natural tropical atmosphere after rain, subtle humidity in the distance, restrained gold sunset, premium corporate documentary grade, realistic architecture and scale.

Composition: ultrawide 16:9, 2560×1440 master, left text-safe zone, horizon near upper third, no critical building at the center crop edge.
Negative: [GLOBAL NEGATIVE PROMPT], no impossible skyline, no cyberpunk city, no aerial traffic, no brand signage, no extreme orange sunset, no fake landmark, no sci-fi towers.
```

**Video prompt — image-to-video**

```text
Animate the approved BGC dusk panorama as a subtle 8-second atmospheric loop. Use a locked camera or a nearly imperceptible 1% push. Clouds move very slowly; a few distant windows brighten gradually; soft traffic bokeh advances along one far street; the warm horizon cools by only a few percent. Preserve every building and the dark left text-safe area. No new buildings, no time-lapse speed, no dramatic day-to-night transition, no flying camera, no lightning, no readable signage, no flicker. End close to the opening exposure for a clean loop.
```

**Output:** hero poster AVIF/WebP 2560×1440 master, responsive derivatives at 1920 and 1280 widths, LCP target ≤200 KB for the served desktop asset. Optional 8-second WebM/MP4 ≤1.8 MB each.

---

### CAREER-ROLE — Technical Role Card System

**Placement:** Careers cards for Quant Research, Software Engineering, Data Science, DevOps, and Graduate Program.

**Role:** Content background. This is a reusable template; replace the bracketed subject per role.

**Image prompt template**

```text
[PHITOPOLIS VISUAL SYSTEM]

Create a cinematic editorial role-card background for [ROLE: quantitative research / software engineering / data science / site reliability / graduate engineering]. Show a credible, carefully arranged technical workspace or instrument-led scene that communicates the role without a posed person: [ROLE-SPECIFIC OBJECTS]. Use one dominant physical focal object, restrained depth, natural Manila office daylight, deep navy shadows, frost surfaces, and one small gold signal accent. Leave the LOWER 45% darker and simpler for a white role title and summary overlay. Consistent photographic treatment across the entire role-card series, realistic materials, no visual clutter, no logos, no text inside screens.

ROLE-SPECIFIC OBJECTS:
- quantitative research: notebook, abstract model printouts with no legible text, dual monitors with blurred statistical forms
- software engineering: laptop, test device, architecture blocks on a blurred display, compact infrastructure rack
- data science: physical data samples, pipeline-like modular objects, one clean analysis workstation
- site reliability: organized monitoring station, compact rack, status-light sequence, handoff notebook
- graduate engineering: open notebook, laptop, small collaborative prototype, two empty chairs implying mentorship

Composition: 3:2 master at 1800×1200, center-safe crop, dark lower overlay zone.
Negative: [GLOBAL NEGATIVE PROMPT], no identifiable generated face, no fake employee portrait, no readable code, no RGB gaming desk, no stock-photo handshake.
```

**Optional video prompt**

```text
Animate the approved role-card still as a 5-second subtle loop. Keep the camera locked. Allow only one or two small movements appropriate to the role: a status light settling, an abstract screen form updating, daylight shifting across the desk, or a mechanical test completing one cycle. Preserve the dark lower text area and every object. No people entering, no readable text, no screen flicker, no dramatic camera move, no object morphing. Finish at the initial state.
```

**Output:** WebP/AVIF 1200×800, target ≤120 KB per card. Video only if the card layout actually supports playback; otherwise stills are the better choice.

---

### BLOG-TECH — Technical Article Thumbnail System

**Placement:** Blog cards and featured article art for architecture, benchmark, model, or postmortem content only.

**Role:** Content image. Do not apply to culture, CSR, onboarding, or company-event stories.

**Image prompt template**

```text
[PHITOPOLIS VISUAL SYSTEM]

Create an editorial cover image for a technical article titled “[ARTICLE TITLE]” about [ONE-SENTENCE TECHNICAL SUBJECT]. Translate the core technical relationship into one physical, architectural metaphor using navy, frost, white, and a single restrained gold signal. Use a strong large-scale composition that remains recognizable at thumbnail size: one primary form, one secondary relationship, generous negative space, no decorative complexity. The image must feel like a serious engineering journal cover, not marketing art. No text, numbers, logos, code, or literal UI in the image. Matte ceramic, machined metal, frosted glass, or precise paper-cut materials; controlled studio light; orthographic or slightly elevated camera.

Composition: 16:10, 1600×1000, focal object inside center 60%, darker lower third for card overlay where needed.
Negative: [GLOBAL NEGATIVE PROMPT], no random circuit boards, no glowing brain, no stock chart, no unrelated laptop, no magazine text.
```

**Optional motion prompt for featured hero card**

```text
Animate the approved technical cover as a 5-second seamless micro-loop. Only the technical relationship should move: one signal travels, one layer aligns, one gate opens and closes, or one module transfers an object. Camera locked; preserve silhouette and thumbnail readability. No new objects, no text, no dramatic light sweep, no zoom, no particles filling the frame. End exactly at the initial configuration.
```

**Output:** AVIF/WebP 1600×1000 master, card derivative around 960×600, target ≤100 KB. Motion is optional and should be reserved for one featured card, not every tile.

## Selection checklist

Reject a generated result if any answer below is “no”:

- Does it still read clearly with the website scrim and real heading placed over it?
- Is the designated copy side genuinely quiet, rather than merely blurred?
- Does it communicate the section’s actual idea without relying on generated text?
- Is the palette limited to navy, frost, white, and sparse gold?
- Does it avoid generic crypto, cyberpunk, robot, and trading-screen shorthand?
- Can the still crop safely to desktop and mobile without losing the subject?
- For people or workplaces, does it look plausible and unposed rather than like stock photography?
- For video, is movement subtle enough that copy remains the primary focus?
- Does the poster match the first video frame closely enough to avoid a visible load jump?
- Is the asset under the stated delivery budget after compression?

## Provenance record template

Keep one record beside every selected asset:

```text
Asset ID:
Placement:
Generator / model:
Generation date:
Prompt version:
Seed / reference image:
Edits made after generation:
Usage terms checked:
Final filenames:
Final dimensions and file sizes:
Human reviewer:
```

Generated people should never be presented as Phitopolis employees. Any asset that appears documentary should either use real, consented company media or be clearly treated as conceptual visualization.
