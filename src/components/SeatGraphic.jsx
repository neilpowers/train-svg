const SeatGraphic = ({ selected,label,rotation }) => (
  <g>
    {/* Seat base */}
    <rect
      width="40"
      height="40"
      rx="10"
      fill={selected ? "#27ae60" : "#2c3e50"}
    />

    {/* Cushion */}
    <rect x="6" y="6" width="28" height="18" rx="4" fill="#ecf0f1" />
    <rect x="6" y="26" width="28" height="8" rx="3" fill="#bdc3c7" />

    {/* Seat number */}
    <g transform={`rotate(${-rotation}, 20, 20)`}>
    <text
      x="20"
      y="22"
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize="10"
      fill="#2c3e50"
      style={{ pointerEvents: "none", userSelect: "none" }}
    >
      {label}
    </text>
    </g>

  </g>
);

export default SeatGraphic;