import { observersFor, triggerIntersect } from "../setup.motion";

// A guard on the guard. The whole reason the scroll/motion layer went untested
// is that tests/setup.ts forces prefers-reduced-motion: reduce at module scope,
// so SmoothScroll, AppShell's pressure machine and every GSAP scrub
// early-return before doing anything. If someone later "tidies up" the setup
// files or the vitest projects, the motion suite would keep passing while
// silently testing nothing again. These assertions fail loudly instead.

test("this project runs with reduced motion OFF", () => {
  expect(matchMedia("(prefers-reduced-motion: reduce)").matches).toBe(false);
  expect(matchMedia("(prefers-reduced-motion: no-preference)").matches).toBe(true);
});

test("the reduce query and the no-preference query never agree", () => {
  // setup.ts's stub has to special-case "no-preference" first, because that
  // query string also contains the substring "reduce". Regressing that check
  // would make both queries return true and every reduced-motion branch
  // unreachable in both projects.
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const noPref = matchMedia("(prefers-reduced-motion: no-preference)").matches;
  expect(reduce).not.toBe(noPref);
});

test("IntersectionObserver is the controllable fake, not the no-op stub", () => {
  const el = document.createElement("div");
  document.body.append(el);

  const seen: boolean[] = [];
  const observer = new IntersectionObserver((entries) => {
    for (const e of entries) seen.push(e.isIntersecting);
  }, { rootMargin: "300px" });

  expect(observersFor(el)).toBe(0);
  observer.observe(el);
  expect(observersFor(el)).toBe(1);

  expect(triggerIntersect(el, true)).toBe(1);
  expect(triggerIntersect(el, false)).toBe(1);
  expect(seen).toEqual([true, false]);

  observer.disconnect();
  expect(observersFor(el)).toBe(0);
  // Firing at nobody is a no-op that reports zero, so a test asserting it drove
  // something can tell the difference between "ran" and "silently did nothing".
  expect(triggerIntersect(el, true)).toBe(0);

  el.remove();
});

test("observer options survive the fake", () => {
  const el = document.createElement("div");
  const observer = new IntersectionObserver(() => {}, {
    rootMargin: "300px",
    threshold: [0, 0.05, 1],
  });
  observer.observe(el);
  expect(observer.rootMargin).toBe("300px");
  expect(observer.thresholds).toEqual([0, 0.05, 1]);
  observer.disconnect();
});
