const TableGraphic = ({ width, height }) => (
  <g>
    <rect width={width} height={height} fill="#fff" rx="3" stroke="#000" strokeWidth="1" />
    <text
      x={width / 2}
      y={height / 2}
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize="11"
      fill="#2c3e50"
      style={{ userSelect: "none" }}
    >
      Table
    </text>
  </g>
);

export default TableGraphic;