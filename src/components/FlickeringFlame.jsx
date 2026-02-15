import { useEffect, useState } from 'react';

export default function FlickeringFlame({ images = [], size = 36, interval = 250 }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!images || images.length <= 1) return;
    const t = window.setInterval(() => {
      setIdx((i) => (i + 1) % images.length);
    }, Math.max(50, interval));
    return () => window.clearInterval(t);
  }, [images, interval]);

  const src = images?.[idx] || images?.[0] || null;

  if (!src) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-full bg-gradient-to-br from-amber-400 to-red-600"
      />
    );
  }

  return (
    <img
      src={src}
      alt=""
      style={{ width: size, height: size }}
      className="rounded-full object-cover"
    />
  );
}

