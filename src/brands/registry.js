import tru from "./tru/index.js";
import lit from "./lit/index.js";
import mat from "./mat/index.js";
import deb from "./deb/index.js";
import pol from "./pol/index.js";
import scy from "./scy/index.js";
import ttv from "./ttv/index.js";
import eag from "./eag/index.js";

// If some brands don't have logos yet, keep them out for now.
export const BRANDS = [tru, lit, mat, deb, pol, scy, ttv, eag].filter(
  (b) => b && b.id && b.logo
);

export const BRAND_MAP = BRANDS.reduce((acc, b) => {
  acc[b.id] = b;
  return acc;
}, {});
