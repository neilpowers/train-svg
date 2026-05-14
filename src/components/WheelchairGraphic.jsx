// Wheelchair / disabled space spanning two column widths with aisle gap removed.
// width = the full pixel span of the two columns (no aisle between them within a side).
const WheelchairGraphic = ({ width }) => (
  <g>
    {/* Space outline */}
    <rect
      width={width}
      height="40"
      rx="6"
      fill="#2980b9"
      opacity="0.85"
    />
    {/* Wheelchair symbol */}
    <text
      x={width / 2}
      y="24"
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize="20"
      fill="white"
      style={{ pointerEvents: "none", userSelect: "none" }}
    >
      ♿
    </text>
  </g>
);

export default WheelchairGraphic;
