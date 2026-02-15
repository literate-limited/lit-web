// src/hooks/usePagination.js
import { useEffect, useLayoutEffect, useRef, useState } from "react";

export default function usePagination({ text }) {
  const containerRef = useRef(null);
  const contentRef = useRef(null);

  const [pageCount, setPageCount] = useState(1);
  const [pageWidth, setPageWidth] = useState(0);

  const recompute = () => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const styles = getComputedStyle(container);
    const pl = parseFloat(styles.paddingLeft) || 0;
    const pr = parseFloat(styles.paddingRight) || 0;
    const pt = parseFloat(styles.paddingTop) || 0;
    const pb = parseFloat(styles.paddingBottom) || 0;

    const innerW = Math.max(0, container.clientWidth - pl - pr);
    const innerH = Math.max(0, container.clientHeight - pt - pb);

    // Set column layout
    content.style.padding = "0";
    content.style.boxSizing = "content-box";
    content.style.height = `${Math.floor(innerH)}px`;
    content.style.columnWidth = `${innerW}px`;
    content.style.WebkitColumnWidth = `${innerW}px`;
    content.style.columnGap = "0px";
    content.style.WebkitColumnGap = "0px";
    content.style.columnFill = "auto";
    content.style.WebkitColumnFill = "auto";

    // Wait one frame for layout to settle
    requestAnimationFrame(() => {
      const totalWidth = content.scrollWidth;
      const totalCols = Math.max(1, Math.round(totalWidth / innerW));
      setPageCount(totalCols);

      // Compute *actual* per-column width by dividing total scroll width
      const trueColWidth = totalWidth / totalCols;
      setPageWidth(trueColWidth);
    });
  };

  useLayoutEffect(() => { recompute(); }, [text]);
  useEffect(() => {
    const ro = new ResizeObserver(recompute);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  return { containerRef, contentRef, pageCount, pageWidth };
}
