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

const CarriageSVG = ({ data }) => {
  const { layout, seats, elements, tables = [], render } = data;

  const config = {
    seatWidth: render.seatWidth,
    seatPitch: render.seatPitch,   // gap used between rows that have a table
    rowGap: render.rowGap ?? 8,    // gap used between rows without a table
    aisleWidth: render.aisleWidth,
    width: 300,
  };

  // Actual pixel width of the seat content (2 cols + aisle + 2 cols).
  const contentWidth = layout.seatColumns.length * config.seatWidth + config.aisleWidth;

  // Build a set of row numbers that have a table gap after them.
  // A table sits between backwardRow and forwardRow, so the gap after backwardRow is a table gap.
  const tableGapRows = new Set(tables.map((t) => t.backwardRow));

  // Build rowY: pixel Y position for each row 1..N, accumulated based on gap type.
  const rowY = {};
  let y = 0;
  for (let row = 1; row <= layout.rows; row++) {
    rowY[row] = y;
    // Advance Y by the appropriate gap before the next row.
    const gapAfterThisRow = tableGapRows.has(row) ? config.seatPitch : SEAT_HEIGHT + config.rowGap;
    y += gapAfterThisRow;
  }
  const totalHeight = y;

  const getX = (colIndex) =>
    colIndex < 2
      ? colIndex * config.seatWidth
      : colIndex * config.seatWidth + config.aisleWidth;

  // Convert a rowRange [startRow, endRow] to pixel Y coordinates using rowY map.
  const rowRangeToY = (rowRange) => {
    const top = rowY[rowRange[0]];
    const bottom = rowY[rowRange[1]] + SEAT_HEIGHT;
    return { y: top, h: bottom - top };
  };

  const isFlipped = data.direction.orientation === "right-to-left";

  return (
    <svg viewBox={`0 0 ${config.width} ${totalHeight}`} style={{ width: "100%" }}>
      <rect width="100%" height="100%" fill="#ecf0f1" />

      {/* Centre content horizontally within the viewBox */}
      <g transform={`translate(${(config.width - contentWidth) / 2}, 0)`}>
      <g transform={isFlipped ? `scale(-1,1) translate(-${contentWidth},0)` : ""}>

        {/* Tables — rendered in the gap between facing seat rows, no overlap */}
        {tables.map((table) => {
          const gapTop = rowY[table.backwardRow] + SEAT_HEIGHT;
          const gapBottom = rowY[table.forwardRow];
          const gapHeight = gapBottom - gapTop;
          const vMargin = 4;
          const tableHeight = gapHeight - vMargin * 2;
          const isSmall = table.size === "small";
          const tableY = gapTop + vMargin;

          if (isSmall) {
            // One small table per column, each centred within its seatWidth.
            const tableWidth = Math.round(config.seatWidth * 0.6);
            return table.columns.map((col) => {
              const colIndex = layout.seatColumns.indexOf(col);
              const colX = getX(colIndex);
              const x = colX + (config.seatWidth - tableWidth) / 2;
              return (
                <g key={`${table.id}_${col}`} transform={`translate(${x}, ${tableY})`}>
                  <TableGraphic width={tableWidth} height={tableHeight} />
                </g>
              );
            });
          }

          // Full bay table: spans its two columns, 70% wide, centred.
          const colSpanPx = config.seatWidth * table.columns.length;
          const tableWidth = Math.round(colSpanPx * 0.7);
          const colIndices = table.columns.map((col) => layout.seatColumns.indexOf(col));
          const colStartX = getX(Math.min(...colIndices));
          const x = colStartX + (colSpanPx - tableWidth) / 2;

          return (
            <g key={table.id} transform={`translate(${x}, ${tableY})`}>
              <TableGraphic width={tableWidth} height={tableHeight} />
            </g>
          );
        })}

        {/* Seats */}
        {seats.map((seat) => {
          const y = rowY[seat.row];

          // Wheelchair spaces span two columns on one side of the aisle.
          if (seat.type === "wheelchair") {
            const colIndices = seat.columns.map((col) => layout.seatColumns.indexOf(col));
            const x = getX(Math.min(...colIndices));
            const width = config.seatWidth * seat.columns.length;
            return (
              <g key={seat.id} transform={`translate(${x}, ${y})`}>
                <WheelchairGraphic width={width} />
              </g>
            );
          }

          const colIndex = layout.seatColumns.indexOf(seat.column);
          const x = getX(colIndex);
          const rotation = getSeatRotation(seat.facing, data.direction.travel);
          return (
            <g
              key={seat.id}
              transform={`translate(${x}, ${y}) rotate(${rotation}, 20, 20)`}
            >
              <SeatGraphic label={seat.id} rotation={rotation} />
            </g>
          );
        })}

        {/* Elements */}
        {elements.map((el) => {
          if (el.type === "door") {
            return (
              <g key={el.id} transform={`translate(${el.position.x}, ${el.position.y})`}>
                <DoorGraphic />
              </g>
            );
          }

          if (el.type === "vestibule") {
            const { y, h } = rowRangeToY(el.rowRange);
            return (
              <g key={el.id} transform={`translate(0, ${y})`}>
                <VestibuleGraphic width={contentWidth} height={h} />
              </g>
            );
          }

          if (el.type === "toilet") {
            const { y, h } = rowRangeToY(el.rowRange);
            const colIndices = el.columns.map((col) => layout.seatColumns.indexOf(col));
            const x = getX(Math.min(...colIndices));
            const width = config.seatWidth * el.columns.length;
            return (
              <g key={el.id} transform={`translate(${x}, ${y})`}>
                <ToiletGraphic width={width} height={h} accessible={el.accessible} />
              </g>
            );
          }

          if (el.type === "luggage") {
            const { y, h } = rowRangeToY(el.rowRange);
            const colIndices = el.columns.map((col) => layout.seatColumns.indexOf(col));
            const x = getX(Math.min(...colIndices));
            const width = config.seatWidth * el.columns.length;
            return (
              <g key={el.id} transform={`translate(${x}, ${y})`}>
                <LuggageGraphic width={width} height={h} />
              </g>
            );
          }

          return null;
        })}
      </g>
      </g>
    </svg>
  );
};

export default CarriageSVG;
