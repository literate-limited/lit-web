/**
 * useViewport — Reactive breakpoint detection hook
 * Returns current viewport size category and dimension data
 */

import { useState, useEffect } from "react";

// Breakpoint thresholds (must match ui-tokens.css)
const BREAKPOINTS = {
  mobile: 640,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
  ultra: 1536,
};

/**
 * Determine viewport category from window width
 */
function getViewportCategory(width) {
  if (width < BREAKPOINTS.mobile) return "mobile";
  if (width < BREAKPOINTS.desktop) return "tablet";
  if (width < BREAKPOINTS.wide) return "desktop";
  if (width < BREAKPOINTS.ultra) return "wide";
  return "ultra";
}

/**
 * React hook for responsive viewport detection
 * @returns {{
 *   width: number,
 *   height: number,
 *   category: 'mobile' | 'tablet' | 'desktop' | 'wide' | 'ultra',
 *   isMobile: boolean,
 *   isTablet: boolean,
 *   isDesktop: boolean,
 *   isWide: boolean,
 *   isUltra: boolean
 * }}
 */
export function useViewport() {
  const [viewport, setViewport] = useState(() => {
    // SSR/initial render fallback
    if (typeof window === "undefined") {
      return {
        width: BREAKPOINTS.desktop,
        height: 800,
        category: "desktop",
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isWide: false,
        isUltra: false,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const category = getViewportCategory(width);

    return {
      width,
      height,
      category,
      isMobile: category === "mobile",
      isTablet: category === "tablet",
      isDesktop: category === "desktop" || category === "wide" || category === "ultra",
      isWide: category === "wide" || category === "ultra",
      isUltra: category === "ultra",
    };
  });

  useEffect(() => {
    let timeoutId = null;

    function handleResize() {
      // Debounce resize events (only update after 150ms of no resize)
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const category = getViewportCategory(width);

        setViewport({
          width,
          height,
          category,
          isMobile: category === "mobile",
          isTablet: category === "tablet",
          isDesktop: category === "desktop" || category === "wide" || category === "ultra",
          isWide: category === "wide" || category === "ultra",
          isUltra: category === "ultra",
        });
      }, 150);
    }

    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return viewport;
}

/**
 * useReducedMotion — Detect user motion preferences
 * @returns {boolean} true if user prefers reduced motion
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return prefersReducedMotion;
}
