// Renders a vestibule/entrance area spanning a given pixel height and the full carriage width.
const VestibuleGraphic = ({ width, height }) => (
  <g>
    <rect width={width} height={height} fill="#bdc3c7" opacity="0.5" rx="4" />
    <text
      x={width / 2}
      y={height / 2}
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize="11"
      fill="#2c3e50"
      style={{ userSelect: "none" }}
    >
      
    </text>
  </g>
);

export default VestibuleGraphic;
