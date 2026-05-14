const ToiletGraphic = ({ width, height, accessible }) => (
  <g>
    <rect width={width} height={height} rx="6" fill="#95a5a6" />
    <text
      x={width / 2}
      y={accessible ? height / 2 - 8 : height / 2}
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize="12"
      fill="white"
      style={{ userSelect: "none" }}
    >
      WC
    </text>
    {accessible && (
      <text
        x={width / 2}
        y={height / 2 + 10}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="14"
        fill="white"
        style={{ userSelect: "none" }}
      >
        ♿
      </text>
    )}
  </g>
);

export default ToiletGraphic;
