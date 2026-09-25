import SeatGraphic from "./SeatGraphic";
import BikeGraphic from "./BikeGraphic";
import TableGraphic from "./TableGraphic";

const SEAT_SIZE = 40;

// Minimum cross-section height so the carriage doesn't render too narrow
const MIN_WIDTH = 280;

const getSeatRotation = (seatFacing, travelDirection) => {
  if (seatFacing === "forward")  return travelDirection === "forward" ? 0   : 180;
  if (seatFacing === "backward") return travelDirection === "forward" ? 180 : 0;
  return 0;
};

const CarriageSVG = ({ data, landscape = false }) => {
  const {
    seats = [],
    floorplanDimensions,
    seatYPosRange,
    direction,
  } = data;

  const fp = floorplanDimensions ?? { width: 1173, height: 306 };

  // --- Coordinate scaling ---
  // s3 xPos → row axis: use full floorplan width so the canvas represents the
  // entire carriage length, not just the seat area.
  // s3 yPos → cross-section axis: still scaled to the actual seat yPos range.
  const xMin = 0;
  const xMax = fp.width;
  const yMin = seatYPosRange?.min ?? 0;
  const yMax = seatYPosRange?.max ?? fp.height;

  const xRange = (xMax - xMin) || 1;
  const yRange = (yMax - yMin) || 1;

  // Padding around the seat grid in SVG units
  const pad = SEAT_SIZE / 2;

  // Canvas dimensions — length driven by floorplan width, cross-section by seat span
  const renderLength = xRange + SEAT_SIZE + pad * 2;
  const renderWidth  = Math.max(yRange + SEAT_SIZE + pad * 2, MIN_WIDTH);

  // Scale factors: s3 pixels → SVG units
  const xScale = (renderLength - SEAT_SIZE - pad * 2) / xRange;
  const yScale = (renderWidth  - SEAT_SIZE - pad * 2) / yRange;

  // Map an s3 xPos to SVG row-axis coordinate
  const toRowAxis = (xPos) => pad + (xPos - xMin) * xScale;

  // Map an s3 yPos to SVG cross-section coordinate
  const toCrossAxis = (yPos) => pad + (yPos - yMin) * yScale;

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

          if (seat.type === "table") {
            // Convert the four s3 pixel edges directly to SVG coordinates.
            // x1/x2 are along the train axis; y1/y2 are across the carriage.
            // The table must not span the aisle — x1/x2 already exclude seat width.
            const svgX1 = toRowAxis(seat.x1);
            const svgX2 = toRowAxis(seat.x2);
            const svgY1 = toCrossAxis(seat.y1);
            const svgY2 = toCrossAxis(seat.y2);

            // In portrait: train axis = SVG Y, cross = SVG X
            // In landscape: train axis = SVG X, cross = SVG Y
            const left   = landscape ? svgX1 : svgY1;
            const top    = landscape ? svgY1 : svgX1;
            const width  = landscape ? svgX2 - svgX1 : svgY2 - svgY1;
            const height = landscape ? svgY2 - svgY1 : svgX2 - svgX1;

            return (
              <g key={seat.id} transform={`translate(${left}, ${top})`}>
                <TableGraphic width={width} height={height} />
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
