// Seat states:
//   reservable   — available to book (green base)
//   default      — no reservable flag (dark base)
//   reserved     — taken (red base, muted cushion, "R" badge)
//   unreservable — cannot be booked (grey base, X mark)
//   selected     — chosen by user (bright green base)
const SeatGraphic = ({ selected, reserved, unreservable, reservable, label, rotation, landscape = false }) => {
  const baseColor = selected
    ? "#27ae60"
    : reserved
    ? "#c0392b"
    : unreservable
    ? "#95a5a6"
    : reservable
    ? "#1e8449"
    : "#2c3e50";

  const cushionColor = reserved
    ? "#e8a09a"
    : unreservable
    ? "#bdc3c7"
    : reservable
    ? "#a9dfbf"
    : "#ecf0f1";

  const backrestColor = reserved
    ? "#c97b76"
    : unreservable
    ? "#aab7b8"
    : reservable
    ? "#76b891"
    : "#bdc3c7";

  return (
    <g>
      {/* Seat base */}
      <rect width="40" height="40" rx="10" fill={baseColor} />

      {/* Cushion */}
      <rect x="6" y="6" width="28" height="18" rx="4" fill={cushionColor} />
      <rect x="6" y="26" width="28" height="8" rx="3" fill={backrestColor} />

      {/* Unreservable cross */}
      {unreservable && (
        <g transform={`rotate(${-rotation}, 20, 20)`}>
          <line x1="10" y1="10" x2="30" y2="30" stroke="#7f8c8d" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="30" y1="10" x2="10" y2="30" stroke="#7f8c8d" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}

      {/* Reserved badge */}
      {reserved && (
        <g transform={`rotate(${-rotation}, 20, 20)`}>
          <rect x="26" y="4" width="10" height="10" rx="2" fill="#922b21" />
          <text
            x="31"
            y="9"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="7"
            fontWeight="bold"
            fill="white"
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            R
          </text>
        </g>
      )}

      {/* Seat number — hidden on unreservable seats */}
      {!unreservable && (
        <g transform={`rotate(${-rotation}, 20, 20)`}>
          <text
            x={landscape ? 14 : 20}
            y="20"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            fill="#000000"
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            {label}
          </text>
        </g>
      )}
    </g>
  );
};

export default SeatGraphic;
