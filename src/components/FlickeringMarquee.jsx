import { useEffect, useState } from 'react';

export default function FlickeringMarquee({
  orbImage,
  bannerImage,
  orbSize = 34,
  bannerWidth = 120,
  bannerHeight = 36,
  interval = 3600,
}) {
  const [flip, setFlip] = useState(false);

  useEffect(() => {
    if (!orbImage && !bannerImage) return;
    const t = window.setInterval(() => setFlip((v) => !v), Math.max(250, interval));
    return () => window.clearInterval(t);
  }, [orbImage, bannerImage, interval]);

  return (
    <div className="flex items-center gap-2">
      {orbImage ? (
        <img
          src={orbImage}
          alt=""
          style={{ width: orbSize, height: orbSize }}
          className={`rounded-full object-cover transition-opacity ${flip ? 'opacity-90' : 'opacity-100'}`}
        />
      ) : null}
      {bannerImage ? (
        <img
          src={bannerImage}
          alt=""
          style={{ width: bannerWidth, height: bannerHeight }}
          className={`rounded-md object-cover transition-opacity ${flip ? 'opacity-90' : 'opacity-100'}`}
        />
      ) : null}
    </div>
  );
}

