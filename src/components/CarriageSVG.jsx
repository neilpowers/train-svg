import SeatGraphic from "./SeatGraphic";
import DoorGraphic from "./DoorGraphic";
import ToiletGraphic from "./ToiletGraphic";
import LuggageGraphic from "./LuggageGraphic";
import VestibuleGraphic from "./VestibuleGraphic";
import TableGraphic from "./TableGraphic";
import WheelchairGraphic from "./WheelchairGraphic";

const SEAT_HEIGHT = 40;

const getSeatRotation = (seatFacing, travelDirection) => {
  if (seatFacing === "forward") return travelDirection === "forward" ? 0 : 180;
  if (seatFacing === "backward") return travelDirection === "forward" ? 180 : 0;
  return 0;
};

const CarriageSVG = ({ data, landscape = false }) => {
  const { layout, seats, elements, tables = [], render } = data;

  const config = {
    seatWidth: render.seatWidth,
    seatPitch: render.seatPitch,
    rowGap: render.rowGap ?? 8,
    aisleWidth: render.aisleWidth,
    viewboxWidth: 300,
  };

  // Content width: 2 cols + aisle + 2 cols = 240px
  const contentWidth = layout.seatColumns.length * config.seatWidth + config.aisleWidth;

  // Build rowY: accumulated Y (portrait) or X (landscape) position per row.
  const tableGapRows = new Set(tables.map((t) => t.backwardRow));
  const rowY = {};
  let acc = 0;
  for (let row = 1; row <= layout.rows; row++) {
    rowY[row] = acc;
    acc += tableGapRows.has(row) ? config.seatPitch : SEAT_HEIGHT + config.rowGap;
  }
  const totalLength = acc; // total along the row axis

  // In portrait:  row axis = Y (top→bottom), col axis = X (left→right)
  // In landscape (90° anti-clockwise from portrait):
  //   row axis = X (left→right, row 1 on the left)
  //   col axis = Y (bottom→top, col A at the bottom)
  const centreOffset = (config.viewboxWidth - contentWidth) / 2;

  // colHeight = the pixel height of the element along the column axis
  const pos = (rowVal, colVal, rowSpan = SEAT_HEIGHT, colHeight = SEAT_HEIGHT) =>
    landscape
      ? { x: rowVal, y: config.viewboxWidth - colVal - colHeight - centreOffset }
      : { x: colVal + centreOffset, y: rowVal };

  // Column pixel offset within the content block (unchanged in both orientations).
  const getColOffset = (colIndex) =>
    colIndex < 2
      ? colIndex * config.seatWidth
      : colIndex * config.seatWidth + config.aisleWidth;

  // Convert rowRange to { start, length } along the row axis.
  const rowRangeToSpan = (rowRange) => {
    const start = rowY[rowRange[0]];
    const end = rowY[rowRange[1]] + SEAT_HEIGHT;
    return { start, length: end - start };
  };

  // ViewBox: portrait = width × totalLength, landscape = totalLength × width
  const viewBox = landscape
    ? `0 0 ${totalLength} ${config.viewboxWidth}`
    : `0 0 ${config.viewboxWidth} ${totalLength}`;

  // Element dimensions: in portrait width=colSpan, height=rowSpan; landscape swaps them.
  const dims = (colSpan, rowSpan) =>
    landscape
      ? { width: rowSpan, height: colSpan }
      : { width: colSpan, height: rowSpan };

  const isFlipped = data.direction.orientation === "right-to-left";

  return (
    <svg viewBox={viewBox} style={{ width: "100%" }}>
      <rect width="100%" height="100%" fill="#ecf0f1" />

      <g transform={
        isFlipped
          ? landscape
            ? `scale(1,-1) translate(0,-${config.viewboxWidth})`
            : `scale(-1,1) translate(-${config.viewboxWidth},0)`
          : ""
      }>

        {/* Tables */}
        {tables.map((table) => {
          const gapStart = rowY[table.backwardRow] + SEAT_HEIGHT;
          const gapEnd = rowY[table.forwardRow];
          const gapLength = gapEnd - gapStart;
          const vMargin = 4;
          const tableRowSpan = gapLength - vMargin * 2;
          const isSmall = table.size === "small";

          if (isSmall) {
            const tableColSpan = Math.round(config.seatWidth * 0.6);
            return table.columns.map((col) => {
              const colIndex = layout.seatColumns.indexOf(col);
              const colOffset = getColOffset(colIndex) + (config.seatWidth - tableColSpan) / 2;
              const rowOffset = gapStart + vMargin;
              const { x, y } = pos(rowOffset, colOffset, tableRowSpan, tableColSpan);
              const { width, height } = dims(tableColSpan, tableRowSpan);
              return (
                <g key={`${table.id}_${col}`} transform={`translate(${x}, ${y})`}>
                  <TableGraphic width={width} height={height} />
                </g>
              );
            });
          }

          const colSpanPx = config.seatWidth * table.columns.length;
          const tableColSpan = Math.round(colSpanPx * 0.7);
          const colIndices = table.columns.map((col) => layout.seatColumns.indexOf(col));
          const colOffset = getColOffset(Math.min(...colIndices)) + (colSpanPx - tableColSpan) / 2;
          const rowOffset = gapStart + vMargin;
          const { x, y } = pos(rowOffset, colOffset, tableRowSpan, tableColSpan);
          const { width, height } = dims(tableColSpan, tableRowSpan);

          return (
            <g key={table.id} transform={`translate(${x}, ${y})`}>
              <TableGraphic width={width} height={height} />
            </g>
          );
        })}

        {/* Seats */}
        {seats.map((seat) => {
          const rowOffset = rowY[seat.row];

          if (seat.type === "wheelchair") {
            const colIndices = seat.columns.map((col) => layout.seatColumns.indexOf(col));
            const colOffset = getColOffset(Math.min(...colIndices));
            const colSpan = config.seatWidth * seat.columns.length;
            const { x, y } = pos(rowOffset, colOffset, SEAT_HEIGHT, colSpan);
            const { width, height } = dims(colSpan, SEAT_HEIGHT);
            return (
              <g key={seat.id} transform={`translate(${x}, ${y})`}>
                <WheelchairGraphic width={width} height={height} />
              </g>
            );
          }

          const colIndex = layout.seatColumns.indexOf(seat.column);
          const colOffset = getColOffset(colIndex);
          const rotation = getSeatRotation(seat.facing, data.direction.travel);
          const { x, y } = pos(rowOffset, colOffset, SEAT_HEIGHT, SEAT_HEIGHT);

          // Anti-clockwise 90° from portrait: seats need -90° orientation rotation.
          const seatCx = SEAT_HEIGHT / 2;
          const seatCy = SEAT_HEIGHT / 2;
          const orientationRotation = landscape ? -90 : 0;
          const totalRotation = rotation + orientationRotation;

          return (
            <g key={seat.id} transform={`translate(${x}, ${y}) rotate(${totalRotation}, ${seatCx}, ${seatCy})`}>
              <SeatGraphic label={seat.id} rotation={totalRotation} />
            </g>
          );
        })}

        {/* Elements */}
        {elements.map((el) => {
          if (el.type === "vestibule") {
            const { start, length: rowSpan } = rowRangeToSpan(el.rowRange);
            const { x, y } = pos(start, 0, rowSpan, contentWidth);
            const { width, height } = dims(contentWidth, rowSpan);
            return (
              <g key={el.id} transform={`translate(${x}, ${y})`}>
                <VestibuleGraphic width={width} height={height} />
              </g>
            );
          }

          if (el.type === "toilet") {
            const { start, length: rowSpan } = rowRangeToSpan(el.rowRange);
            const colIndices = el.columns.map((col) => layout.seatColumns.indexOf(col));
            const colOffset = getColOffset(Math.min(...colIndices));
            const colSpan = config.seatWidth * el.columns.length;
            const { x, y } = pos(start, colOffset, rowSpan, colSpan);
            const { width, height } = dims(colSpan, rowSpan);
            return (
              <g key={el.id} transform={`translate(${x}, ${y})`}>
                <ToiletGraphic width={width} height={height} accessible={el.accessible} />
              </g>
            );
          }

          if (el.type === "luggage") {
            const { start, length: rowSpan } = rowRangeToSpan(el.rowRange);
            const colIndices = el.columns.map((col) => layout.seatColumns.indexOf(col));
            const colOffset = getColOffset(Math.min(...colIndices));
            const colSpan = config.seatWidth * el.columns.length;
            const { x, y } = pos(start, colOffset, rowSpan, colSpan);
            const { width, height } = dims(colSpan, rowSpan);
            return (
              <g key={el.id} transform={`translate(${x}, ${y})`}>
                <LuggageGraphic width={width} height={height} />
              </g>
            );
          }

          if (el.type === "door") {
            return (
              <g key={el.id} transform={`translate(${el.position.x}, ${el.position.y})`}>
                <DoorGraphic />
              </g>
            );
          }

          return null;
        })}
      </g>
    </svg>
  );
};

export default CarriageSVG;
