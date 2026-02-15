function buildPath(data, width, height) {
  if (!data || data.length < 2) return "";
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  return data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

export default function ChartSparkline({ data, width = 280, height = 80, color = "#38bdf8" }) {
  const path = buildPath(data, width, height);
  const gradientId = `hofGrad-${color.replace("#", "")}-${data?.length || 0}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="sparkline">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.5" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {path && (
        <>
          <path d={path} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
          <path
            d={`${path} L ${width} ${height} L 0 ${height} Z`}
            fill={`url(#${gradientId})`}
            opacity="0.25"
          />
        </>
      )}
      {!path && (
        <text x="10" y={height / 2} fill="#6b7280" fontSize="12">
          Waiting for solver...
        </text>
      )}
    </svg>
  );
}
