import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { usePageRegistry } from "../context/PageRegistryContext";

export default function PageBackground({ children }) {
  const { pathname } = useLocation();
  const { resolvePageByPath, palette, globalTokens, globalCustomCss } = usePageRegistry();
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const page = resolvePageByPath(pathname);
  const backgrounds = page?.backgrounds || {};
  const pagePalette = page?.palette ? { ...palette, ...page.palette } : palette;
  const pageTokens = page?.tokens || { labels: {}, colors: {}, css: {} };

  const backgroundUrl = isMobile
    ? backgrounds?.mobile?.url || backgrounds?.desktop?.url
    : backgrounds?.desktop?.url || backgrounds?.mobile?.url;

  const style = useMemo(() => {
    const vars = {
      "--lit-bg-image": backgroundUrl ? `url(${backgroundUrl})` : "none",
      "--lit-surface": pagePalette?.surface || "#f3e7c3",
      "--lit-surfaceMuted": pagePalette?.surfaceMuted || "#e6d3a3",
      "--lit-surfaceSoft": pagePalette?.surfaceSoft || "#f7efd8",
      "--lit-ink": pagePalette?.ink || "#2a1c0f",
      "--lit-accent": pagePalette?.accent || "#ffc878",
      "--lit-glow": pagePalette?.glow || "rgba(255,200,120,0.4)",
      "--lit-background": pagePalette?.background || "#0b0703",
      "--lit-backgroundDeep": pagePalette?.backgroundDeep || "#090502",
    };

    const applyTokenVars = (tokens) => {
      Object.entries(tokens || {}).forEach(([key, value]) => {
        if (value == null) return;
        const name = key.startsWith("--") ? key : `--lit-${key}`;
        vars[name] = value;
      });
    };

    applyTokenVars(globalTokens?.colors);
    applyTokenVars(globalTokens?.css);
    applyTokenVars(pageTokens?.colors);
    applyTokenVars(pageTokens?.css);

    return vars;
  }, [backgroundUrl, pagePalette, globalTokens, pageTokens]);

  const customCss = useMemo(() => {
    const parts = [globalCustomCss, page?.customCss].filter(Boolean);
    return parts.join("\n");
  }, [globalCustomCss, page?.customCss]);

  return (
    <div className="lit-app-shell" style={style} data-page-id={page?.id || "unknown"}>
      {customCss && <style>{customCss}</style>}
      <div className={`lit-bg-layer ${backgroundUrl ? "has-image" : "no-image"}`} />
      <div className="lit-bg-overlay" />
      <div className="lit-content">{children}</div>
    </div>
  );
}
