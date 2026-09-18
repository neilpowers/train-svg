import SeatGraphic from "./SeatGraphic";
import BikeGraphic from "./BikeGraphic";

const SEAT_SIZE = 40;

// Minimum canvas dimensions so all coaches appear at the same scale
const MIN_LENGTH = 800;
const MIN_WIDTH  = 280;

const getSeatRotation = (seatFacing, travelDirection) => {
  if (seatFacing === "forward")  return travelDirection === "forward" ? 0   : 180;
  if (seatFacing === "backward") return travelDirection === "forward" ? 180 : 0;
  return 0;
};

const CarriageSVG = ({ data, landscape = false }) => {
  const {
    seats = [],
    seatXPosRange,
    seatYPosRange,
    direction,
  } = data;

  // --- Coordinate scaling ---
  // s3 xPos → row axis (left→right in landscape, top→bottom in portrait)
  // s3 yPos → cross-section axis
  const xMin = seatXPosRange?.min ?? 0;
  const xMax = seatXPosRange?.max ?? 1173;
  const yMin = seatYPosRange?.min ?? 0;
  const yMax = seatYPosRange?.max ?? 306;

  const xRange = (xMax - xMin) || 1;
  const yRange = (yMax - yMin) || 1;

  // Padding around the seat grid in SVG units
  const pad = SEAT_SIZE / 2;

  // Canvas dimensions — enforce minimum so all coaches are the same size
  const renderLength = Math.max(xRange + SEAT_SIZE + pad * 2, MIN_LENGTH);
  const renderWidth  = Math.max(yRange + SEAT_SIZE + pad * 2, MIN_WIDTH);

  // Map an s3 xPos to SVG row-axis coordinate
  const toRowAxis = (xPos) =>
    pad + ((xPos - xMin) / xRange) * (renderLength - SEAT_SIZE - pad * 2);

  // Map an s3 yPos to SVG cross-section coordinate
  const toCrossAxis = (yPos) =>
    pad + ((yPos - yMin) / yRange) * (renderWidth - SEAT_SIZE - pad * 2);

  // In portrait:  x = cross-section, y = row axis (train runs top→bottom)
  // In landscape: x = row axis,      y = cross-section (train runs left→right)
  const toSVG = (xPos, yPos) =>
    landscape
      ? { x: toRowAxis(xPos),   y: toCrossAxis(yPos) }
      : { x: toCrossAxis(yPos), y: toRowAxis(xPos) };

  const viewBox = landscape
    ? `0 0 ${renderLength} ${renderWidth}`
    : `0 0 ${renderWidth} ${renderLength}`;

  return (
    <svg
      viewBox={viewBox}
      style={
        landscape
          ? { height: `${renderWidth}px`, width: `${renderLength}px`, display: "block" }
          : { width: "100%", display: "block" }
      }
    >
      <rect width="100%" height="100%" fill="#ecf0f1" />

      <g>
        {seats.map(seat => {
          const { x, y } = toSVG(seat.xPos, seat.yPos);

          if (seat.type === "bike") {
            return (
              <g key={seat.id} transform={`translate(${x}, ${y})`}>
                <BikeGraphic width={SEAT_SIZE} height={SEAT_SIZE} />
              </g>
            );
          }

          // Regular seat
          const rotation = getSeatRotation(seat.facing, direction?.travel ?? "forward");
          const orientationRotation = landscape ? -90 : 0;
          const totalRotation = rotation + orientationRotation;
          const cx = SEAT_SIZE / 2;
          const cy = SEAT_SIZE / 2;

          return (
            <g
              key={seat.id}
              transform={`translate(${x}, ${y}) rotate(${totalRotation}, ${cx}, ${cy})`}
            >
              <SeatGraphic
                label={seat.id}
                rotation={totalRotation}
                reserved={seat.reserved}
                unreservable={seat.unreservable}
                reservable={seat.reservable}
                landscape={landscape}
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
};

export default CarriageSVG;
