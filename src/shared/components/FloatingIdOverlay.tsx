import { useEffect, useRef, useState } from "react";
import { NOIR } from "@/shared/theme/palette";

interface SnapshotItem {
  id: string;
  top: number;
  left: number;
  width: number;
  height: number;
  type: "dialog" | "section" | "heading" | "text" | "interactive" | "media" | "container";
}

const STORAGE_KEY = "phitopolis_id_overlay_enabled";

/**
 * FloatingIdOverlay — High-performance snapshot-based element inspector.
 *
 * Captures a static snapshot of elements visible in the viewport and renders
 * all bounding boxes and text badges onto a single zero-overhead Canvas layer.
 * Eliminates continuous DOM reflows and guarantees silky 60fps scrolling.
 */
export function FloatingIdOverlay() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === null ? false : stored === "true";
    } catch {
      return false;
    }
  });


  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const snapshotTimeoutRef = useRef<number | null>(null);

  const toggleOverlay = () => {
    setEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // Fallback
      }
      return next;
    });
  };

  // Perform a fast single-pass snapshot of visible elements
  const takeSnapshot = () => {
    if (!enabled || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const elementCounters: Record<string, number> = {};

    const getOrAssignId = (el: HTMLElement): string => {
      if (el.id && el.id.trim().length > 0) {
        return el.id;
      }

      const tag = el.tagName.toLowerCase();
      const role = el.getAttribute("role") || "";
      const className = typeof el.className === "string" ? el.className : "";

      let prefix: string;
      if (role === "dialog" || className.includes("MuiDialog") || className.includes("MuiDrawer") || className.includes("MuiPopover")) {
        prefix = "dialog";
      } else if (/^h[1-6]$/.test(tag)) {
        prefix = "heading";
      } else if (tag === "p" || tag === "span" || tag === "label") {
        prefix = "text";
      } else if (tag === "button" || tag === "a" || tag === "input" || tag === "textarea") {
        prefix = "action";
      } else if (tag === "img" || tag === "svg" || tag === "canvas" || tag === "video") {
        prefix = "media";
      } else if (className.includes("MuiCard") || role === "gridcell" || className.includes("card")) {
        prefix = "card";
      } else if (tag === "dialog" || tag === "aside") {
        prefix = "modal";
      } else if (className.includes("MuiGrid") || className.includes("grid") || role === "grid") {
        prefix = "grid";
      } else if (className.includes("MuiStack") || className.includes("stack") || className.includes("flex")) {
        prefix = "flex-row";
      } else if (className.includes("MuiContainer") || className.includes("container") || className.includes("wrapper")) {
        prefix = "wrapper";
      } else {
        prefix = "box";
      }

      const rawText = el.textContent || "";
      const textSlug = rawText
        .trim()
        .slice(0, 12)
        .replace(/[^a-zA-Z0-9]/g, "-")
        .toLowerCase()
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      elementCounters[prefix] = (elementCounters[prefix] || 0) + 1;
      const count = elementCounters[prefix];

      const newId = textSlug && textSlug.length > 2
        ? `${prefix}-${textSlug}-${count}`
        : `${prefix}-${count}`;

      el.id = newId;
      return newId;
    };

    const getTypeCategory = (tagName: string, id: string, className: string, role: string): SnapshotItem["type"] => {
      if (role === "dialog" || className.includes("MuiDialog") || className.includes("MuiDrawer") || className.includes("MuiPopover") || id.startsWith("dialog") || id.startsWith("modal")) {
        return "dialog";
      }
      if (id.includes("-sequence") || id.includes("zone") || tagName === "section" || tagName === "main") {
        return "section";
      }
      if (/^h[1-6]$/.test(tagName) || id.startsWith("heading")) {
        return "heading";
      }
      if (tagName === "button" || tagName === "a" || id.startsWith("action") || id.startsWith("btn")) {
        return "interactive";
      }
      if (tagName === "p" || tagName === "span" || id.startsWith("text")) {
        return "text";
      }
      if (tagName === "img" || tagName === "svg" || tagName === "canvas" || id.startsWith("media")) {
        return "media";
      }
      return "container";
    };

    // Query elements currently visible in the viewport
    const elements = Array.from(
      document.body.querySelectorAll<HTMLElement>(
        "h1, h2, h3, h4, h5, h6, p, span, button, a, canvas, svg, img, section, header, footer, nav, dialog, aside, [role='dialog'], [role='modal'], [data-act], [data-stage-section], div"
      )
    ).filter((el) => {
      if (el.dataset.floatingBadge === "true" || el.closest("[data-floating-control='true']")) {
        return false;
      }
      if (["path", "g", "defs", "circle", "rect", "line"].includes(el.tagName.toLowerCase())) {
        return false;
      }

      const rect = el.getBoundingClientRect();
      // Viewport bounds check: must intersect current viewport
      return (
        rect.width > 14 &&
        rect.height > 14 &&
        rect.bottom >= 0 &&
        rect.right >= 0 &&
        rect.top <= h &&
        rect.left <= w
      );
    });

    const items: SnapshotItem[] = [];
    const seen = new Set<string>();

    elements.forEach((el) => {
      const id = getOrAssignId(el);
      if (seen.has(id)) return;
      seen.add(id);

      const rect = el.getBoundingClientRect();
      const tagName = el.tagName.toLowerCase();
      const className = typeof el.className === "string" ? el.className : "";
      const role = el.getAttribute("role") || "";

      items.push({
        id,
        top: Math.round(rect.top),
        left: Math.round(rect.left),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        type: getTypeCategory(tagName, id, className, role),
      });
    });

    // Color definitions
    const getColors = (type: SnapshotItem["type"]) => {
      switch (type) {
        case "dialog":
          return { bg: "rgba(255, 199, 44, 0.95)", border: "#FFC72C", text: "#06183B" };
        case "section":
          return { bg: "rgba(6, 18, 38, 0.95)", border: NOIR.gold, text: NOIR.gold };
        case "heading":
          return { bg: "rgba(10, 42, 102, 0.95)", border: "#FFD966", text: "#FFD966" };
        case "interactive":
          return { bg: "rgba(4, 30, 24, 0.95)", border: "#3AA189", text: "#4BB89B" };
        case "text":
          return { bg: "rgba(15, 23, 42, 0.90)", border: "#509BD9", text: "#698AD5" };
        case "media":
          return { bg: "rgba(30, 15, 45, 0.95)", border: "#AABD55", text: "#AABD55" };
        default:
          return { bg: "rgba(10, 18, 32, 0.88)", border: "#94A3B8", text: NOIR.frost };
      }
    };

    // Draw all items onto the canvas in a single ultra-fast pass
    ctx.font = "bold 10px 'IBM Plex Mono', SFMono-Regular, Consolas, monospace";

    items.forEach((item) => {
      const colors = getColors(item.type);

      // 1. Draw dashed bounding box
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(item.left + 0.5, item.top + 0.5, item.width, item.height);

      // 2. Draw floating ID text pill
      const text = `#${item.id}`;
      const textMetrics = ctx.measureText(text);
      const paddingX = 6;
      const pillW = textMetrics.width + paddingX * 2 + 8;
      const pillH = 16;
      const badgeX = Math.max(4, item.left);
      const badgeY = Math.max(4, item.top - pillH / 2);

      // Pill background
      ctx.fillStyle = colors.bg;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, pillW, pillH, 4);
      ctx.fill();
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Dot indicator
      ctx.fillStyle = colors.border;
      ctx.beginPath();
      ctx.arc(badgeX + 7, badgeY + pillH / 2, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Text label
      ctx.fillStyle = colors.text;
      ctx.fillText(text, badgeX + 13, badgeY + 11.5);
    });


  };

  useEffect(() => {
    if (!enabled) {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }

      return;
    }

    // Initial snapshot after rendering settles
    const timer = setTimeout(takeSnapshot, 150);

    // Debounced scroll listener (updates snapshot 250ms after scroll settles)
    const handleScroll = () => {
      if (snapshotTimeoutRef.current !== null) {
        window.clearTimeout(snapshotTimeoutRef.current);
      }
      snapshotTimeoutRef.current = window.setTimeout(takeSnapshot, 250);
    };

    const handleResize = () => {
      takeSnapshot();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.altKey && e.key.toLowerCase() === "i") {
        e.preventDefault();
        toggleOverlay();
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      if (snapshotTimeoutRef.current !== null) clearTimeout(snapshotTimeoutRef.current);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled]);

  useEffect(() => {
    const handleToggle = () => {
      toggleOverlay();
    };
    window.addEventListener("phitopolis-toggle-id-overlay", handleToggle);
    return () => {
      window.removeEventListener("phitopolis-toggle-id-overlay", handleToggle);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-floating-control="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 999999,
        display: enabled ? "block" : "none",
      }}
    />
  );
}
