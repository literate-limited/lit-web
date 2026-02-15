import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { matchPath } from "react-router-dom";
import pagesData from "../data/pages.json";
import api from "../api/client";

const PageRegistryContext = createContext(null);
const GLOBAL_STYLE_KEY = "global";

function normalizePath(pathname) {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function buildDefinitions() {
  const byId = {};
  pagesData.pages.forEach((page) => {
    byId[page.id] = page;
  });
  return {
    list: pagesData.pages,
    byId,
    layouts: pagesData.layouts,
    palette: pagesData.palette,
  };
}

export function PageRegistryProvider({ children }) {
  const [pageStyles, setPageStyles] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { list: definitions, byId: definitionsById, layouts, palette: basePalette } = useMemo(
    () => buildDefinitions(),
    []
  );

  const globalStyle = pageStyles[GLOBAL_STYLE_KEY] || null;
  const globalPalette = useMemo(
    () => ({ ...(basePalette || {}), ...(globalStyle?.palette || {}) }),
    [basePalette, globalStyle]
  );
  const globalTokens = useMemo(
    () => ({
      labels: globalStyle?.tokens?.labels || {},
      colors: globalStyle?.tokens?.colors || {},
      css: globalStyle?.tokens?.css || {},
    }),
    [globalStyle]
  );

  // Push palette + global tokens to CSS variables so components can reuse them without prop drilling
  useEffect(() => {
    const root = document.documentElement;
    const applyVars = (vars) => {
      Object.entries(vars || {}).forEach(([key, value]) => {
        if (value == null) return;
        const name = key.startsWith("--") ? key : `--lit-${key}`;
        root.style.setProperty(name, value);
      });
    };
    applyVars(globalPalette);
    applyVars(globalTokens.colors);
    applyVars(globalTokens.css);
  }, [globalPalette, globalTokens]);

  const fetchPageStyles = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/ui/page-styles");
      const map = {};
      (data?.styles || []).forEach((style) => {
        if (style?.key) {
          map[style.key] = style;
        }
      });
      setPageStyles(map);
      setError(null);
    } catch (err) {
      console.error("Failed to load page styles", err);
      setError(err?.response?.data?.message || err.message || "Unable to load page styles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPageStyles();
  }, [fetchPageStyles]);

  const combinedPages = useMemo(() => {
    return definitions.map((def) => {
      const style = pageStyles[def.id];
      return {
        ...def,
        backgrounds: style?.backgrounds ?? def.backgrounds ?? { desktop: null, mobile: null },
        route: style?.route || def.route,
        layout: style?.layout || def.layout,
        components: style?.components?.length ? style.components : def.components,
        styleMeta: style || null,
        tokens: style?.tokens || { labels: {}, colors: {}, css: {} },
        palette: style?.palette || null,
        customCss: style?.customCss || "",
      };
    });
  }, [definitions, pageStyles]);

  const resolvePageByPath = useCallback(
    (pathname) => {
      const normalized = normalizePath(pathname);
      const sorted = [...combinedPages].sort((a, b) => b.route.length - a.route.length);
      for (const page of sorted) {
        const match = matchPath(
          { path: page.route, end: !page.route.includes("*") },
          normalized
        );
        if (match) return page;
      }
      return null;
    },
    [combinedPages]
  );

  const savePageStyle = useCallback(
    async (pageId, payload) => {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const { data } = await api.put(`/ui/page-styles/${pageId}`, payload, { headers });
      if (data?.pageStyle) {
        setPageStyles((prev) => ({ ...prev, [pageId]: data.pageStyle }));
      }
      return data?.pageStyle;
    },
    []
  );

  const savePageBackground = useCallback(
    (pageId, payload) => savePageStyle(pageId, payload),
    [savePageStyle]
  );

  const value = useMemo(
    () => ({
      pages: combinedPages,
      layouts,
      palette: globalPalette,
      globalStyle,
      globalTokens,
      globalCustomCss: globalStyle?.customCss || "",
      pageStyles,
      definitions: definitionsById,
      loading,
      error,
      refreshPageStyles: fetchPageStyles,
      resolvePageByPath,
      savePageBackground,
      savePageStyle,
    }),
    [
      combinedPages,
      layouts,
      globalPalette,
      globalStyle,
      globalTokens,
      pageStyles,
      definitionsById,
      loading,
      error,
      fetchPageStyles,
      resolvePageByPath,
      savePageBackground,
      savePageStyle,
    ]
  );

  return <PageRegistryContext.Provider value={value}>{children}</PageRegistryContext.Provider>;
}

export function usePageRegistry() {
  const ctx = useContext(PageRegistryContext);
  if (!ctx) throw new Error("usePageRegistry must be used inside PageRegistryProvider");
  return ctx;
}
