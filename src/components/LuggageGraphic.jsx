const LuggageGraphic = ({ width, height }) => (
  <g>
    {/* Rack body */}
    <rect width={width} height={height} fill="#7f8c8d" rx="4" />
    {/* Inner shelf line */}
    <rect x="6" y="6" width={width - 12} height={height - 12} rx="3" fill="#95a5a6" />
    {/* Label */}
    <text
      x={width / 2}
      y={height / 2}
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize="9"
      fill="white"
      style={{ userSelect: "none" }}
    >
      Luggage
    </text>
  </g>
);

export default LuggageGraphic;
