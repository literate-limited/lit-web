// src/brands/BrandContext.jsx
import { createContext, useContext, useMemo, useEffect } from "react";

import { applyBrandMeta } from "./applyBrandMeta";

import lit from "./lit";
import tru from "./tru";
import mat from "./mat";
import deb from "./deb";
import pol from "./pol";
import scy from "./scy";
import ttv from "./ttv";
import eag from "./eag";
import cha from "./cha";
import cod from "./cod";
import his from "./his";
import lor from "./lor";
import med from "./med";
import wor from "./wor";
import yin from "./yin";

const BRAND_MAP = {
  lit,
  tru,
  mat,
  deb,
  pol,
  scy,
  ttv,
  eag,
  cha,
  cod,
  his,
  lor,
  med,
  wor,
  yin,
};

const BrandContext = createContext(null);

export function BrandProvider({ children }) {
  // Brand is determined at build-time from VITE_BRAND env var
  const brandId = (import.meta.env.VITE_BRAND || "lit").toLowerCase();

  const brand = useMemo(() => {
    return BRAND_MAP[brandId] || BRAND_MAP.lit;
  }, [brandId]);

  // Keep document head (title/manifest/favicon) in sync with brand
  useEffect(() => {
    applyBrandMeta(brand);
  }, [brand]);

  // ✅ IMPORTANT: value must change when brandId changes
  const value = useMemo(
    () => ({ brandId, brand }),
    [brandId, brand]
  );

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrand() {
  const ctx = useContext(BrandContext);
  if (!ctx) {
    throw new Error("useBrand() must be used inside <BrandProvider>.");
  }
  return ctx;
}
