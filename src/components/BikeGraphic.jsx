const BikeGraphic = ({ width = 40, height = 40 }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 40 40"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Background tile */}
    <rect width="40" height="40" rx="6" fill="#2c3e50" />

    {/* Bike icon centred at 20,20 — wheels, frame, handlebars */}
    <g transform="translate(20,21)" stroke="#ecf0f1" strokeLinecap="round" strokeLinejoin="round" fill="none">
      {/* Left wheel */}
      <circle cx="-9" cy="4" r="6" strokeWidth="1.8" />
      {/* Right wheel */}
      <circle cx="9" cy="4" r="6" strokeWidth="1.8" />
      {/* Frame: bottom bracket → rear axle */}
      <line x1="0" y1="4" x2="-9" y2="4" strokeWidth="1.5" />
      {/* Frame: bottom bracket → front axle */}
      <line x1="0" y1="4" x2="9" y2="4" strokeWidth="1.5" />
      {/* Seat tube */}
      <line x1="0" y1="4" x2="-2" y2="-4" strokeWidth="1.5" />
      {/* Top tube + down tube meeting at head tube */}
      <line x1="-2" y1="-4" x2="6" y2="-4" strokeWidth="1.5" />
      <line x1="6" y1="-4" x2="9" y2="4" strokeWidth="1.5" />
      {/* Saddle */}
      <line x1="-4" y1="-4" x2="0" y2="-4" strokeWidth="2" />
      {/* Handlebars */}
      <line x1="5" y1="-7" x2="7" y2="-7" strokeWidth="2" />
      <line x1="6" y1="-7" x2="6" y2="-4" strokeWidth="1.5" />
    </g>

    {/* Seat number placeholder — not shown for bike spaces */}
  </svg>
);

export default BikeGraphic;
