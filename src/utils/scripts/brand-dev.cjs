#!/usr/bin/env node
const { exec } = require("child_process");

const brand = process.argv[2];

if (!brand) {
  console.log("\n❌ Please specify a brand:\n   npm run dev tp\n");
  process.exit(1);
}

const BRAND_PORTS = {
  tp: 1111,
  lit: 2222,
  mat: 3333,
  dra: 4444,
  deb: 5555,
  pol: 6666,
  his: 7777,
  med: 8888,
  lor: 9999,
  sci: 1010,
  yin: 2121,
  eag: 3232,
  wor: 4343,
  rel: 5454,
  man: 6565,
  cod: 7676,
  phi: 8787,
  vis: 9898
};

if (!BRAND_PORTS[brand]) {
  console.log(`\n❌ Unknown brand "${brand}".\nAvailable brands:`);
  console.log(Object.keys(BRAND_PORTS).join(", "));
  process.exit(1);
}

const port = BRAND_PORTS[brand];

console.log(`\n🚀 Launching brand "${brand}" on port ${port}...\n`);

const cmd = `VITE_BRAND=${brand} VITE_PORT=${port} vite --port ${port}`;
const child = exec(cmd, { stdio: "inherit" });

child.stdout?.pipe(process.stdout);
child.stderr?.pipe(process.stderr);
