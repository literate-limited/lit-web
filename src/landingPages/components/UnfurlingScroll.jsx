import { useEffect, useState } from "react";

export default function UnfurlingScroll({ text, onDone }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);

    const hide = setTimeout(() => setVisible(false), 3800);
    const done = setTimeout(() => onDone?.(), 4600);

    return () => {
      clearTimeout(hide);
      clearTimeout(done);
    };
  }, [onDone]);

  return (
    <div
      className={`
        max-w-[560px]
        px-8 py-5
        text-center
        font-serif
        text-lg
        tracking-wide
        text-[#2a1c0f]
        bg-[#f3e7c3]/95
        shadow-2xl
        rounded-sm
        transition-all duration-[1200ms] ease-out
        ${
          visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 blur-sm"
        }
      `}
    >
      {text}
    </div>
  );
}
