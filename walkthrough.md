# Animation Refactor Walkthrough

## TransitionCurtain.tsx (Nav Page Transition)
The transition effect has been thoroughly overhauled to match the new strict requirements.
- **Timing Sequence:** Implemented a single, cohesive GSAP timeline conforming to the `1-second` standard (`0.00-1.00s`).
- **In (0.00-0.28s):** A gold aperture begins as a line and expands into a full-width mask utilizing `expo.in` easing.
- **Settle (0.28-0.58s):** The screen reveals a dark navy background with a contained gold field. The React route changes during this quiet period, and ScrollTriggers are refreshed.
- **Out (0.58-1.00s):** The gold and navy sheets cleanly exit out of view towards the top using `power3.out`.

## Preloader.tsx (Web Intro)
- **Timing Sequence:** Adheres precisely to the same `1-second` 3-beat structure.
- **Visual implementation:** Utilizes GSAP for an abstract particle field (using 40 gold particles) that converge into the center while the Phitopolis logo fades in.
- **In (0.00-0.28s):** Particles fly inward rapidly (`expo.in`), forming into the logo space.
- **Settle (0.28-0.58s):** The logo holds center stage cleanly.
- **Out (0.58-1.00s):** The particles shatter outwards, the logo scales up and fades, and the container gracefully exits, revealing the web experience behind it (`power3.out`).
