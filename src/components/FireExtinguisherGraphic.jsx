const FireExtinguisherGraphic = ({ width = 40, height = 40 }) => {
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) * 0.32;

  return (
    <g>
      {/* Background circle */}
      <circle cx={cx} cy={cy} r={r + 4} fill="#c0392b" />
      {/* Extinguisher body */}
      <rect
        x={cx - r * 0.35}
        y={cy - r * 0.7}
        width={r * 0.7}
        height={r * 1.1}
        rx={r * 0.2}
        fill="white"
      />
      {/* Cylinder bottom */}
      <ellipse cx={cx} cy={cy + r * 0.4} rx={r * 0.35} ry={r * 0.15} fill="#bdc3c7" />
      {/* Handle */}
      <rect x={cx - r * 0.55} y={cy - r * 0.75} width={r * 1.1} height={r * 0.18} rx={r * 0.08} fill="white" />
      {/* Nozzle */}
      <line
        x1={cx + r * 0.35}
        y1={cy - r * 0.55}
        x2={cx + r * 0.7}
        y2={cy - r * 0.8}
        stroke="white"
        strokeWidth={r * 0.15}
        strokeLinecap="round"
      />
    </g>
  );
};

export default FireExtinguisherGraphic;
