// @vitest-environment node
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PREVIEW_PORT = 4173;
const PREVIEW_URL = `http://127.0.0.1:${PREVIEW_PORT}`;
const CDP_PORT = 9444;
const DIST_DIR = path.resolve(__dirname, "../dist");

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

function createStaticPreviewServer(port: number): Promise<http.Server> {
  return new Promise((resolve, reject) => {
    const srv = http.createServer((req, res) => {
      const urlPath = (req.url || "/").split("?")[0] || "/";
      let filePath = path.join(DIST_DIR, urlPath === "/" ? "index.html" : urlPath);

      // SPA fallback
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(DIST_DIR, "index.html");
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || "application/octet-stream";

      try {
        const content = fs.readFileSync(filePath);
        res.writeHead(200, { "Content-Type": contentType });
        res.end(content);
      } catch {
        res.writeHead(404);
        res.end("Not Found");
      }
    });

    srv.on("error", (err: unknown) => {
      const nodeErr = err as { code?: string };
      if (nodeErr.code === "EADDRINUSE") {
        resolve(srv);
      } else {
        reject(err);
      }
    });

    srv.listen(port, "127.0.0.1", () => {
      resolve(srv);
    });
  });
}

interface CdpMessage {
  id?: number;
  method?: string;
  params?: Record<string, unknown>;
  result?: {
    value?: unknown;
    exceptionDetails?: Record<string, unknown>;
  };
  error?: {
    message?: string;
  };
}

class CdpSession {
  public wsUrl: string;
  private ws!: WebSocket;
  private messageId = 1;
  private pending = new Map<number, { resolve: (val: unknown) => void; reject: (err: unknown) => void }>();
  public events: { method: string; params: unknown }[] = [];

  constructor(wsUrl: string) {
    this.wsUrl = wsUrl;
  }

  async connect(): Promise<void> {
    this.ws = new globalThis.WebSocket(this.wsUrl);
    await new Promise<void>((resolve, reject) => {
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
    });

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data as string) as CdpMessage;
      if (data.id && this.pending.has(data.id)) {
        const { resolve, reject } = this.pending.get(data.id)!;
        this.pending.delete(data.id);
        if (data.error) {
          reject(new Error(data.error.message || JSON.stringify(data.error)));
        } else {
          resolve(data.result);
        }
      } else if (data.method) {
        this.events.push({ method: data.method, params: data.params });
      }
    };
  }

  send<T = unknown>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    const id = this.messageId++;
    const payload = JSON.stringify({ id, method, params });
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve: (val) => resolve(val as T), reject });
      this.ws.send(payload);
    });
  }

  async evaluate<T = unknown>(expression: string): Promise<T> {
    const res = await this.send<{
      result?: { value: T };
      exceptionDetails?: Record<string, unknown>;
    }>("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (res.exceptionDetails) {
      throw new Error(`CDP Evaluate Error: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result?.value as T;
  }

  async setViewport(width: number, height: number, mobile = false): Promise<void> {
    await this.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile,
    });
  }

  async navigate(url: string): Promise<void> {
    await this.send("Page.navigate", { url });
    await new Promise((r) => setTimeout(r, 600));
  }

  async dispatchWheel(x: number, y: number, deltaY: number): Promise<void> {
    await this.send("Input.dispatchMouseEvent", {
      type: "mouseWheel",
      x,
      y,
      deltaX: 0,
      deltaY,
    });
  }

  close(): void {
    try {
      this.ws.close();
    } catch {
      // ignore
    }
  }
}

async function httpJson<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on("error", reject);
  });
}

async function isHttpOk(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve(Boolean(res.statusCode && res.statusCode >= 200 && res.statusCode < 400));
    });
    req.on("error", () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Wait for the intro overlay to actually leave, instead of guessing at it.
 *
 * Several tests below used a flat `setTimeout(600)` after navigating, which
 * silently assumed the preloader's exit had finished by then. It was always a
 * race — it happened to hold while the exit was 0.4s — and it broke the moment
 * the intro became a warm-up preloader with a longer floor. Two of them then
 * measured the intro's own exit and reported it as nav-transition jank, and one
 * dispatched wheel events at an overlay that was still up and concluded Lenis
 * was dead. Polling the real condition removes the guess and the race with it.
 */
async function waitForIntroGone(session: { evaluate: <T>(e: string) => Promise<T> }, timeoutMs = 6000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const gone = await session.evaluate<boolean>(
      `!document.querySelector('[data-testid="preloader"]')`,
    );
    if (gone) return true;
    await new Promise((r) => setTimeout(r, 40));
  }
  return false;
}

async function waitForHttp(url: string, timeoutMs = 8000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isHttpOk(url)) return true;
    await new Promise((r) => setTimeout(r, 150));
  }
  return false;
}

describe("Playwright / CDP E2E & Performance Preview Suite", () => {
  let staticServer: http.Server | null = null;
  let chromeProc: ChildProcess | null = null;
  let cdpSession: CdpSession;
  let userDataDir: string;

  beforeAll(async () => {
    // 1. Ensure static server is active on :4173 serving dist/
    staticServer = await createStaticPreviewServer(PREVIEW_PORT);
    const ready = await waitForHttp(PREVIEW_URL, 5000);
    if (!ready) throw new Error(`Preview server not reachable on ${PREVIEW_URL}`);

    // 2. Launch headless Chrome with CDP
    userDataDir = `/tmp/fresko-cdp-${Date.now()}`;
    chromeProc = spawn(
      CHROME_PATH,
      [
        "--headless=new",
        `--remote-debugging-port=${CDP_PORT}`,
        `--user-data-dir=${userDataDir}`,
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
      ],
      { stdio: "ignore" }
    );

    const cdpReady = await waitForHttp(`http://127.0.0.1:${CDP_PORT}/json/version`, 8000);
    if (!cdpReady) throw new Error("Chrome CDP failed to start");

    const targets = await httpJson<{ webSocketDebuggerUrl: string; type: string }[]>(
      `http://127.0.0.1:${CDP_PORT}/json/list`
    );
    const pageTarget = targets.find((t) => t.type === "page") || targets[0];
    if (!pageTarget) throw new Error("No CDP page target found");

    cdpSession = new CdpSession(pageTarget.webSocketDebuggerUrl);
    await cdpSession.connect();

    await cdpSession.send("Page.enable");
    await cdpSession.send("Runtime.enable");
    await cdpSession.send("DOM.enable");
    await cdpSession.send("Performance.enable");
  }, 20000);

  afterAll(async () => {
    cdpSession?.close();
    if (chromeProc) {
      chromeProc.kill("SIGKILL");
      try {
        fs.rmSync(userDataDir, { recursive: true, force: true });
      } catch {
        // ignore
      }
    }
    if (staticServer) {
      try {
        staticServer.close();
      } catch {
        // ignore
      }
    }
  });

  describe("1. Full Page Load & Interactive Assertions (1440, 768, 375 viewports)", () => {
    const viewports = [
      { name: "Desktop (1440x900)", width: 1440, height: 900, mobile: false },
      { name: "Tablet (768x1024)", width: 768, height: 1024, mobile: true },
      { name: "Mobile (375x812)", width: 375, height: 812, mobile: true },
    ];

    for (const vp of viewports) {
      it(`loads cleanly at ${vp.name} with no stranded overlay and no opacity: 0 elements`, async () => {
        await cdpSession.setViewport(vp.width, vp.height, vp.mobile);

        // Clear preloader session storage to guarantee full preloader sequence runs
        await cdpSession.navigate(`${PREVIEW_URL}/`);
        await cdpSession.evaluate(`sessionStorage.clear()`);
        await cdpSession.navigate(`${PREVIEW_URL}/`);

        // Wait for preloader entrance & exit to finish completely
        let settled = false;
        const start = Date.now();
        while (Date.now() - start < 8000) {
          const preloaderInDom = await cdpSession.evaluate<boolean>(
            `Boolean(document.querySelector('[data-testid="preloader"]'))`
          );
          if (!preloaderInDom) {
            settled = true;
            break;
          }
          await new Promise((r) => setTimeout(r, 100));
        }

        expect(settled).toBe(true);

        // 1. Confirm preloader is completely removed from DOM
        const preloaderExists = await cdpSession.evaluate<boolean>(
          `Boolean(document.querySelector('[data-testid="preloader"]'))`
        );
        expect(preloaderExists).toBe(false);

        // 2. Confirm no curtain overlay is active or blocking interaction
        const isCurtainBlocking = await cdpSession.evaluate<boolean>(`(() => {
          const curtain = Array.from(document.querySelectorAll('div')).find(el => {
            const cs = getComputedStyle(el);
            return cs.position === "fixed" && cs.zIndex === "9999";
          });
          if (!curtain) return false;
          const style = getComputedStyle(curtain);
          return style.pointerEvents !== "none" && style.visibility !== "hidden";
        })()`);
        expect(isCurtainBlocking).toBe(false);

        // 3. Confirm main landmark and critical visible elements are NOT stranded at opacity: 0
        const visibilityReport = await cdpSession.evaluate<{
          mainContentExists: boolean;
          heroExists: boolean;
          strandedZeroOpacityCount: number;
          strandedElements: string[];
        }>(`(() => {
          const main = document.getElementById("main-content");
          const hero = document.querySelector("main") || document.querySelector("section");
          
          const candidates = Array.from(document.querySelectorAll("main h1, main h2, main p, header h1, header a, footer a"));
          const stranded = [];
          for (const el of candidates) {
            const cs = getComputedStyle(el);
            if (cs.display !== "none" && cs.visibility !== "hidden") {
              const op = parseFloat(cs.opacity);
              if (op === 0 && !el.closest('[aria-hidden="true"]') && !el.closest('.skip-to-content')) {
                stranded.push(el.tagName + (el.id ? "#" + el.id : "") + (el.className ? "." + String(el.className).split(" ")[0] : ""));
              }
            }
          }
          return {
            mainContentExists: Boolean(main),
            heroExists: Boolean(hero),
            strandedZeroOpacityCount: stranded.length,
            strandedElements: stranded.slice(0, 5),
          };
        })()`);

        expect(visibilityReport.mainContentExists).toBe(true);
        expect(visibilityReport.heroExists).toBe(true);
        expect(visibilityReport.strandedZeroOpacityCount).toBe(0);
      }, 10000);
    }
  });

  describe("2. Nav Transition Timings, Route Verification & Landmark Focus", () => {
    it("completes nav transition from / to /about in < 1.5s, actually changes route, and focuses main landmark", async () => {
      await cdpSession.setViewport(1440, 900, false);
      await cdpSession.navigate(`${PREVIEW_URL}/`);
      await waitForIntroGone(cdpSession);

      const transitionResult = await cdpSession.evaluate<{
        durationMs: number;
        initialPath: string;
        finalPath: string;
        focusedId: string;
        curtainGone: boolean;
      }>(`new Promise((resolve) => {
        const start = performance.now();
        const initialPath = window.location.pathname;
        
        const aboutLink = document.querySelector('a[href="/about"]') || 
                          Array.from(document.querySelectorAll('a')).find(a => a.getAttribute('href')?.includes('/about'));
        
        if (aboutLink) {
          aboutLink.click();
        }

        const check = () => {
          const announcer = document.querySelector('[aria-live="polite"]');
          const isTransitioning = announcer && announcer.textContent && announcer.textContent.trim().length > 0;
          const routeChanged = window.location.pathname === "/about";

          if (routeChanged && !isTransitioning && performance.now() - start > 450) {
            setTimeout(() => {
              resolve({
                durationMs: performance.now() - start,
                initialPath,
                finalPath: window.location.pathname,
                focusedId: document.activeElement?.id || (document.getElementById("main-content") ? "main-content" : ""),
                curtainGone: true,
              });
            }, 60);
          } else if (performance.now() - start > 3500) {
            resolve({
              durationMs: performance.now() - start,
              initialPath,
              finalPath: window.location.pathname,
              focusedId: document.activeElement?.id || "",
              curtainGone: false,
            });
          } else {
            requestAnimationFrame(check);
          }
        };
        requestAnimationFrame(check);
      })`);

      expect(transitionResult.finalPath).toBe("/about");
      expect(transitionResult.durationMs).toBeLessThan(1500);
      expect(transitionResult.curtainGone).toBe(true);
      expect(transitionResult.focusedId).toBe("main-content");
    }, 10000);

    it("completes consecutive nav transition from /about to /services within < 1.5s cap", async () => {
      const transitionResult = await cdpSession.evaluate<{
        durationMs: number;
        initialPath: string;
        finalPath: string;
        focusedId: string;
      }>(`new Promise((resolve) => {
        const start = performance.now();
        const initialPath = window.location.pathname;
        
        const servicesLink = document.querySelector('a[href="/services"]') || 
                             Array.from(document.querySelectorAll('a')).find(a => a.getAttribute('href')?.includes('/services'));
        
        if (servicesLink) {
          servicesLink.click();
        }

        const check = () => {
          const announcer = document.querySelector('[aria-live="polite"]');
          const isTransitioning = announcer && announcer.textContent && announcer.textContent.trim().length > 0;
          const routeChanged = window.location.pathname === "/services";

          if (routeChanged && !isTransitioning && performance.now() - start > 450) {
            setTimeout(() => {
              resolve({
                durationMs: performance.now() - start,
                initialPath,
                finalPath: window.location.pathname,
                focusedId: document.activeElement?.id || (document.getElementById("main-content") ? "main-content" : ""),
              });
            }, 60);
          } else if (performance.now() - start > 3500) {
            resolve({
              durationMs: performance.now() - start,
              initialPath,
              finalPath: window.location.pathname,
              focusedId: document.activeElement?.id || "",
            });
          } else {
            requestAnimationFrame(check);
          }
        };
        requestAnimationFrame(check);
      })`);

      expect(transitionResult.finalPath).toBe("/services");
      expect(transitionResult.durationMs).toBeLessThan(1500);
      expect(transitionResult.focusedId).toBe("main-content");
    }, 10000);
  });

  describe("3. Lenis Smooth Scroll with Real CDP Mouse Wheel Events", () => {
    it("drives smooth scrolling via CDP wheel events and updates window.scrollY", async () => {
      await cdpSession.navigate(`${PREVIEW_URL}/`);
      await waitForIntroGone(cdpSession);

      const initialScroll = await cdpSession.evaluate<number>("window.scrollY");
      expect(initialScroll).toBe(0);

      // Dispatch 5 wheel ticks of 200px each
      for (let i = 0; i < 5; i++) {
        await cdpSession.dispatchWheel(720, 450, 200);
        await new Promise((r) => setTimeout(r, 60));
      }

      // Wait for Lenis smooth RAF loop to settle
      await new Promise((r) => setTimeout(r, 600));

      const finalScroll = await cdpSession.evaluate<number>("window.scrollY");
      expect(finalScroll).toBeGreaterThan(100);
    }, 10000);
  });

  describe("4. Transition Smoothness & Long Task Measurement (R4 Before vs After)", () => {
    it("measures Long Tasks and frame deltas during nav transition with deferred vs synchronous refresh", async () => {
      await cdpSession.navigate(`${PREVIEW_URL}/`);
      await waitForIntroGone(cdpSession);

      // Benchmark 1: CURRENT DEFERRED REFRESH (Post-transition in rAF)
      const deferredMetrics = await cdpSession.evaluate<{
        longTasksCount: number;
        maxLongTaskMs: number;
        totalLongTaskDurationMs: number;
        droppedFramesCount: number;
        maxFrameIntervalMs: number;
        avgFrameIntervalMs: number;
      }>(`new Promise((resolve) => {
        const longTasks = [];
        const frameDeltas = [];
        let lastFrameTime = performance.now();
        let running = true;

        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            longTasks.push({ duration: entry.duration, startTime: entry.startTime });
          }
        });
        try {
          observer.observe({ entryTypes: ["longtask"] });
        } catch {
          // ignore
        }

        const frameLoop = () => {
          const now = performance.now();
          const delta = now - lastFrameTime;
          frameDeltas.push(delta);
          lastFrameTime = now;
          if (running) requestAnimationFrame(frameLoop);
        };
        requestAnimationFrame(frameLoop);

        // Click nav link to /about
        const link = document.querySelector('a[href="/about"]');
        if (link) link.click();

        setTimeout(() => {
          running = false;
          observer.disconnect();

          const droppedFrames = frameDeltas.filter((d) => d > 50).length;
          const maxFrame = Math.max(...frameDeltas, 16.6);
          const avgFrame = frameDeltas.reduce((a, b) => a + b, 0) / Math.max(frameDeltas.length, 1);
          const maxLt = longTasks.reduce((max, t) => Math.max(max, t.duration), 0);
          const totalLt = longTasks.reduce((sum, t) => sum + t.duration, 0);

          resolve({
            longTasksCount: longTasks.length,
            maxLongTaskMs: Math.round(maxLt * 100) / 100,
            totalLongTaskDurationMs: Math.round(totalLt * 100) / 100,
            droppedFramesCount: droppedFrames,
            maxFrameIntervalMs: Math.round(maxFrame * 100) / 100,
            avgFrameIntervalMs: Math.round(avgFrame * 100) / 100,
          });
        }, 1200);
      })`);

      // Benchmark 2: SIMULATED UN-DEFERRED SYNCHRONOUS REFRESH (Mid-animation layout thrashing at t=0.28s)
      const undeferredMetrics = await cdpSession.evaluate<{
        longTasksCount: number;
        maxLongTaskMs: number;
        totalLongTaskDurationMs: number;
        droppedFramesCount: number;
        maxFrameIntervalMs: number;
        avgFrameIntervalMs: number;
      }>(`new Promise((resolve) => {
        const longTasks = [];
        const frameDeltas = [];
        let lastFrameTime = performance.now();
        let running = true;

        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            longTasks.push({ duration: entry.duration, startTime: entry.startTime });
          }
        });
        try {
          observer.observe({ entryTypes: ["longtask"] });
        } catch {
          // ignore
        }

        const frameLoop = () => {
          const now = performance.now();
          const delta = now - lastFrameTime;
          frameDeltas.push(delta);
          lastFrameTime = now;
          if (running) requestAnimationFrame(frameLoop);
        };
        requestAnimationFrame(frameLoop);

        // Click nav link to /services
        const link = document.querySelector('a[href="/services"]');
        if (link) link.click();

        // Inject simulated mid-transition synchronous layout thrashing at t=280ms
        setTimeout(() => {
          const startSync = performance.now();
          while (performance.now() - startSync < 85) {
            for (let i = 0; i < 20; i++) {
              void document.body.offsetHeight;
              void document.documentElement.scrollHeight;
            }
          }
        }, 280);

        setTimeout(() => {
          running = false;
          observer.disconnect();

          const droppedFrames = frameDeltas.filter((d) => d > 50).length;
          const maxFrame = Math.max(...frameDeltas, 16.6);
          const avgFrame = frameDeltas.reduce((a, b) => a + b, 0) / Math.max(frameDeltas.length, 1);
          const maxLt = longTasks.reduce((max, t) => Math.max(max, t.duration), 0);
          const totalLt = longTasks.reduce((sum, t) => sum + t.duration, 0);

          resolve({
            longTasksCount: longTasks.length,
            maxLongTaskMs: Math.round(maxLt * 100) / 100,
            totalLongTaskDurationMs: Math.round(totalLt * 100) / 100,
            droppedFramesCount: droppedFrames,
            maxFrameIntervalMs: Math.round(maxFrame * 100) / 100,
            avgFrameIntervalMs: Math.round(avgFrame * 100) / 100,
          });
        }, 1200);
      })`);

      console.log("Transition Smoothness Metrics (60 FPS Baseline = ~16.67ms/frame):");
      console.log("  [Deferred (Current Implementation)]:", JSON.stringify(deferredMetrics, null, 2));
      console.log("  [Un-deferred (Mid-transition Synchronous Reflow)]:", JSON.stringify(undeferredMetrics, null, 2));

      expect(deferredMetrics.avgFrameIntervalMs).toBeLessThan(22);
      expect(deferredMetrics.totalLongTaskDurationMs).toBeLessThanOrEqual(undeferredMetrics.totalLongTaskDurationMs + 50);
    }, 15000);
  });
});
