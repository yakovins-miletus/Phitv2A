import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";

interface ElementIdItem {
  id: string;
  top: number;
  left: number;
  tagName: string;
  type: "section" | "heading" | "text" | "interactive" | "media" | "container";
}

/**
 * FloatingIdOverlay — Automatically assigns and renders a floating text ID badge
 * for EVERY granular element on the home page (text, headings, grids, buttons,
 * cards, media, and containers).
 */
export function FloatingIdOverlay() {
  const [items, setItems] = useState<ElementIdItem[]>([]);

  useEffect(() => {
    let elementCounters: Record<string, number> = {};

    const getOrAssignId = (el: HTMLElement): string => {
      if (el.id && el.id.trim().length > 0) {
        return el.id;
      }

      const tag = el.tagName.toLowerCase();
      
      // Determine semantic prefix
      let prefix = tag;
      if (/^h[1-6]$/.test(tag)) prefix = "heading";
      else if (tag === "p" || tag === "span" || tag === "label") prefix = "text";
      else if (tag === "button" || tag === "a" || tag === "input") prefix = "action";
      else if (tag === "img" || tag === "svg" || tag === "canvas" || tag === "video") prefix = "media";
      else if (el.classList.contains("MuiCard-root") || el.getAttribute("role") === "gridcell") prefix = "card";
      else prefix = "el";

      // Build descriptive text slug if available
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

      // Assign ID to the DOM element
      el.id = newId;
      return newId;
    };

    const getTypeCategory = (tagName: string, id: string): ElementIdItem["type"] => {
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

    const scanElements = () => {
      const container = document.getElementById("home-main") || document.body;
      elementCounters = {};

      // Target all elements within the home main tree except floating badges themselves
      const allElements = Array.from(
        container.querySelectorAll<HTMLElement>(
          "h1, h2, h3, h4, h5, h6, p, span, button, a, canvas, svg, img, section, header, footer, nav, [data-act], [data-stage-section], div"
        )
      ).filter((el) => {
        // Exclude overlay elements
        if (el.dataset.floatingBadge === "true" || el.closest("[data-floating-overlay='true']")) {
          return false;
        }
        // Exclude inline SVG internal paths or zero-size elements
        if (["path", "g", "defs", "circle", "rect", "line"].includes(el.tagName.toLowerCase())) {
          return false;
        }
        const rect = el.getBoundingClientRect();
        return rect.width > 12 && rect.height > 12;
      });

      const newItems: ElementIdItem[] = [];
      const seenIds = new Set<string>();

      allElements.forEach((el) => {
        const id = getOrAssignId(el);
        if (seenIds.has(id)) return;
        seenIds.add(id);

        const rect = el.getBoundingClientRect();
        const tagName = el.tagName.toLowerCase();

        newItems.push({
          id,
          top: rect.top + window.scrollY,
          left: Math.max(6, rect.left + window.scrollX),
          tagName,
          type: getTypeCategory(tagName, id),
        });
      });

      setItems(newItems);
    };

    // Initial scan
    scanElements();

    // Event listeners
    window.addEventListener("resize", scanElements);
    window.addEventListener("scroll", scanElements, { passive: true });

    const observer = new MutationObserver(scanElements);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    return () => {
      window.removeEventListener("resize", scanElements);
      window.removeEventListener("scroll", scanElements);
      observer.disconnect();
    };
  }, []);

  const getBadgeColors = (type: ElementIdItem["type"]) => {
    switch (type) {
      case "section":
        return { bg: "rgba(6, 18, 38, 0.95)", border: NOIR.gold, text: NOIR.gold, dot: NOIR.gold };
      case "heading":
        return { bg: "rgba(10, 42, 102, 0.92)", border: "#FFD966", text: "#FFD966", dot: "#FFD966" };
      case "interactive":
        return { bg: "rgba(4, 30, 24, 0.92)", border: "#3AA189", text: "#4BB89B", dot: "#3AA189" };
      case "text":
        return { bg: "rgba(15, 23, 42, 0.88)", border: "#509BD9", text: "#698AD5", dot: "#509BD9" };
      case "media":
        return { bg: "rgba(30, 15, 45, 0.92)", border: "#AABD55", text: "#AABD55", dot: "#AABD55" };
      default:
        return { bg: "rgba(10, 18, 32, 0.85)", border: "rgba(255,255,255,0.25)", text: NOIR.frost, dot: "#94A3B8" };
    }
  };

  return (
    <Box
      aria-hidden="true"
      data-floating-overlay="true"
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 99999,
        overflow: "visible",
      }}
    >
      {items.map((item) => {
        const colors = getBadgeColors(item.type);
        return (
          <Box
            key={item.id}
            data-floating-badge="true"
            sx={{
              position: "absolute",
              top: item.top,
              left: item.left,
              transform: "translateY(-50%)",
              display: "inline-flex",
              alignItems: "center",
              gap: "3px",
              px: "6px",
              py: "2px",
              borderRadius: "4px",
              bgcolor: colors.bg,
              backdropFilter: "blur(4px)",
              border: `1px solid ${colors.border}`,
              boxShadow: `0 2px 8px rgba(0,0,0,0.4)`,
              pointerEvents: "none",
              userSelect: "none",
              transition: "top 0.1s ease-out, left 0.1s ease-out",
            }}
          >
            <Box
              sx={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                bgcolor: colors.dot,
                boxShadow: `0 0 4px ${colors.dot}`,
              }}
            />
            <Typography
              component="span"
              sx={{
                fontFamily: MONO,
                fontSize: "0.6rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                color: colors.text,
                lineHeight: 1,
                whiteSpace: "nowrap",
              }}
            >
              #{item.id}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
