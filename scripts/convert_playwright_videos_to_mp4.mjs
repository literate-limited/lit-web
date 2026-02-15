import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function walk(dir, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walk(p, out);
    } else {
      out.push(p);
    }
  }
}

function which(cmd) {
  const res = spawnSync("bash", ["-lc", `command -v ${cmd}`], {
    encoding: "utf8",
  });
  if (res.status !== 0) return null;
  return (res.stdout || "").trim() || null;
}

const ffmpeg = which("ffmpeg");
if (!ffmpeg) {
  console.error("ffmpeg not found; skipping video conversion.");
  process.exit(0);
}

// Playwright runs fast, so the resulting videos can be hard to follow.
// Default: export at 1.5x slower (i.e., 1 second of real time becomes 1.5s).
const SLOWDOWN = (() => {
  const raw = process.env.PW_VIDEO_SLOWDOWN ?? "1.5";
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) && n >= 1 ? n : 1.5;
})();

const roots = [];
// Playwright outputDir is configured to land in repo-level output/ by default.
roots.push(path.resolve(process.cwd(), "../output/playwright/test-results"));
// Some setups may still use the default test-results/ folder under web/.
roots.push(path.resolve(process.cwd(), "./test-results"));

const allFiles = [];
for (const r of roots) walk(r, allFiles);
const webms = allFiles.filter((p) => p.endsWith(`${path.sep}video.webm`));

let converted = 0;
for (const src of webms) {
  const dst = src.replace(/video\.webm$/, "video.mp4");

  fs.mkdirSync(path.dirname(dst), { recursive: true });

  // H.264 + AAC in an .mp4 container. Using +faststart helps streaming/preview.
  // We intentionally drop audio to avoid A/V sync complications when slowing down.
  const args = [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-i",
    src,
    "-vf",
    `setpts=${SLOWDOWN}*PTS`,
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "23",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-an",
    dst,
  ];

  const res = spawnSync(ffmpeg, args, { stdio: "inherit" });
  if (res.status === 0) converted += 1;
}

if (converted > 0) {
  console.log(`Converted ${converted} Playwright video(s) to .mp4.`);
}
