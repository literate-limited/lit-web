export function resampleClipUniform(clip, frameCount) {
  const frames = Array.isArray(clip?.frames) ? clip.frames : [];
  if (frames.length === 0 || frameCount <= 0) return { ...clip, frames: [] };
  if (frameCount === 1) return { ...clip, frames: [frames[0]] };

  const lastIdx = frames.length - 1;
  const sampled = [];

  for (let i = 0; i < frameCount; i += 1) {
    const t = i / (frameCount - 1);
    const idx = Math.round(t * lastIdx);
    sampled.push(frames[idx]);
  }

  return { ...clip, frames: sampled };
}
