// src/brands/applyBrandMeta.js
// Keeps document title, theme-color, favicon, and manifest in sync with the active brand.

import { BRAND_MAP } from "./registry";
import { themes as tokenThemes } from "../utils/themes/themes";

const ensureLink = (rel) => {
  if (typeof document === "undefined") return null;
  const existing = document.head.querySelector(`link[rel="${rel}"]`);
  if (existing) return existing;
  const link = document.createElement("link");
  link.rel = rel;
  document.head.appendChild(link);
  return link;
};

const ensureMeta = (name) => {
  if (typeof document === "undefined") return null;
  const existing = document.head.querySelector(`meta[name="${name}"]`);
  if (existing) return existing;
  const meta = document.createElement("meta");
  meta.name = name;
  document.head.appendChild(meta);
  return meta;
};

const ensurePropertyMeta = (property) => {
  if (typeof document === "undefined") return null;
  const existing = document.head.querySelector(`meta[property="${property}"]`);
  if (existing) return existing;
  const meta = document.createElement("meta");
  meta.setAttribute("property", property);
  document.head.appendChild(meta);
  return meta;
};

const setContent = (el, content) => {
  if (el && content) {
    el.setAttribute("content", content);
  }
};

export function applyBrandMeta(brandIdOrConfig) {
  if (typeof document === "undefined") return;

  const brand =
    typeof brandIdOrConfig === "string"
      ? BRAND_MAP[brandIdOrConfig]
      : brandIdOrConfig;

  if (!brand) return;

  const meta = brand.meta || {};
  const theme = tokenThemes[brand.theme || brand.id] || tokenThemes.lit;
  const themeColor =
    meta.themeColor ||
    theme?.surface?.header ||
    theme?.brand?.primary ||
    "#0b0703";

  const title = meta.title || brand.name || "Lit";
  const description = meta.description || `Experience ${title}`;
  const url =
    meta.canonical ||
    meta.url ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const ogImage = meta.ogImage || meta.favicon || brand.logo || "/favicon.ico";
  const ogType = meta.ogType || "website";
  const twitterCard = meta.twitterCard || "summary_large_image";

  document.title = title;

  const manifestLink = ensureLink("manifest");
  if (manifestLink) {
    manifestLink.setAttribute("href", meta.manifest || "/site.webmanifest");
  }

  const favicon = meta.favicon || brand.logoIco || brand.logo || "/favicon.ico";
  const faviconLink = ensureLink("icon");
  if (faviconLink) {
    faviconLink.setAttribute("href", favicon);
    faviconLink.setAttribute(
      "type",
      favicon.endsWith(".svg") ? "image/svg+xml" : "image/x-icon"
    );
  }

  const appleIcon = meta.appleIcon || favicon;
  const appleLink = ensureLink("apple-touch-icon");
  if (appleLink) {
    appleLink.setAttribute("href", appleIcon);
  }

  const themeMeta = ensureMeta("theme-color");
  if (themeMeta) {
    themeMeta.setAttribute("content", themeColor);
  }

  const appNameMeta = ensureMeta("application-name");
  if (appNameMeta) {
    appNameMeta.setAttribute("content", meta.shortName || brand.name || "Lit");
  }

  setContent(ensureMeta("description"), description);
  setContent(ensureMeta("msapplication-TileColor"), themeColor);

  setContent(ensurePropertyMeta("og:title"), title);
  setContent(ensurePropertyMeta("og:description"), description);
  setContent(ensurePropertyMeta("og:type"), ogType);
  setContent(ensurePropertyMeta("og:image"), ogImage);
  if (url) {
    setContent(ensurePropertyMeta("og:url"), url);
  }

  setContent(ensureMeta("twitter:card"), twitterCard);
  setContent(ensureMeta("twitter:title"), title);
  setContent(ensureMeta("twitter:description"), description);
  setContent(ensureMeta("twitter:image"), ogImage);

  const canonicalLink = ensureLink("canonical");
  if (canonicalLink && url) {
    canonicalLink.setAttribute("href", url);
  }

  const ldScript =
    document.head.querySelector("script[data-brand-ld]") ||
    document.createElement("script");
  ldScript.type = "application/ld+json";
  ldScript.setAttribute("data-brand-ld", "true");
  ldScript.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    url: url || undefined,
    name: title,
    logo: favicon,
  });
  if (!ldScript.parentNode) {
    document.head.appendChild(ldScript);
  }
}
