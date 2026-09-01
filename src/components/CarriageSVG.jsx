import SeatGraphic from "./SeatGraphic";
import DoorGraphic from "./DoorGraphic";
import ToiletGraphic from "./ToiletGraphic";
import LuggageGraphic from "./LuggageGraphic";
import VestibuleGraphic from "./VestibuleGraphic";
import TableGraphic from "./TableGraphic";
import WheelchairGraphic from "./WheelchairGraphic";
import FireExtinguisherGraphic from "./FireExtinguisherGraphic";
import BikeGraphic from "./BikeGraphic";

const SEAT_HEIGHT = 40;

const getSeatRotation = (seatFacing, travelDirection) => {
  if (seatFacing === "forward") return travelDirection === "forward" ? 0 : 180;
  if (seatFacing === "backward") return travelDirection === "forward" ? 180 : 0;
  return 0;
};

const CarriageSVG = ({ data, landscape = false }) => {
  const { layout, seats, elements, tables = [], render, bikeSpaces = [], floorplanDimensions, seatXPosRange } = data;

  const config = {
    seatWidth: render.seatWidth,
    seatPitch: render.seatPitch,
    rowGap: render.rowGap ?? 8,
    aisleWidth: render.aisleWidth,
  };

  // Content width: 2 cols + aisle + 2 cols
  const contentWidth = layout.seatColumns.length * config.seatWidth + config.aisleWidth;

  // viewboxWidth drives the cross-section dimension (height in portrait, height in landscape).
  // Derive it from actual content + padding rather than hardcoding 300.
  const crossSectionPadding = 20;
  const viewboxWidth = contentWidth + crossSectionPadding * 2;

  // Build rowY: accumulated Y position per row.
  // Rows that are the backwardRow of a bay table get seatPitch spacing (wider gap for table).
  // All other rows get SEAT_HEIGHT + rowGap spacing.
  const tableGapRows = new Set(tables.map((t) => t.backwardRow));

  // Which columns participate in bay tables (use wide-gap rowY)?
  const tableColumns = new Set(tables.flatMap((t) => t.columns));

  const rowY = {};      // used by columns that have bay tables
  const slotY = {};     // used by columns that never have bay tables (uniform spacing)
  let accGapped = 0;
  let accSlot = 0;
  for (let row = 1; row <= layout.rows; row++) {
    rowY[row] = accGapped;
    slotY[row] = accSlot;
    accGapped += tableGapRows.has(row) ? config.seatPitch : SEAT_HEIGHT + config.rowGap;
    accSlot += SEAT_HEIGHT + config.rowGap;
  }
  const totalLength = accGapped; // total length driven by the gapped side

  // Enforce a minimum carriage length so all coaches render at the same scale.
  // 800px accommodates a typical Pendolino coach with ~13 rows at standard pitch.
  const MIN_LENGTH = 800;
  const MIN_WIDTH  = viewboxWidth;
  const renderLength = Math.max(totalLength, MIN_LENGTH);
  const renderWidth  = Math.max(viewboxWidth, MIN_WIDTH);

  // Get the correct Y for a given row and column.
  // If the column participates in a bay table, use gapped rowY; otherwise uniform slotY.
  const getRowY = (row, col) =>
    tableColumns.has(col) ? rowY[row] : slotY[row];

  // In portrait:  row axis = Y (top→bottom), col axis = X (left→right)
  // In landscape (90° anti-clockwise from portrait):
  //   row axis = X (left→right, row 1 on the left)
  //   col axis = Y (bottom→top, col A at the bottom)
  const centreOffset = (viewboxWidth - contentWidth) / 2;

  // colHeight = the pixel height of the element along the column axis
  const pos = (rowVal, colVal, rowSpan = SEAT_HEIGHT, colHeight = SEAT_HEIGHT) =>
    landscape
      ? { x: rowVal, y: viewboxWidth - colVal - colHeight - centreOffset }
      : { x: colVal + centreOffset, y: rowVal };

  // Column pixel offset within the content block (unchanged in both orientations).
  const getColOffset = (colIndex) =>
    colIndex < 2
      ? colIndex * config.seatWidth
      : colIndex * config.seatWidth + config.aisleWidth;

  // Convert rowRange to { start, length } along the row axis (always uses gapped rowY).
  const rowRangeToSpan = (rowRange) => {
    const start = rowY[rowRange[0]];
    const end = rowY[rowRange[1]] + SEAT_HEIGHT;
    return { start, length: end - start };
  };

  // ViewBox: portrait = width × length, landscape = length × width
  // Uses renderLength/renderWidth so the canvas is always at least MIN size.
  const viewBox = landscape
    ? `0 0 ${renderLength} ${renderWidth}`
    : `0 0 ${renderWidth} ${renderLength}`;

  // Element dimensions: in portrait width=colSpan, height=rowSpan; landscape swaps them.
  const dims = (colSpan, rowSpan) =>
    landscape
      ? { width: rowSpan, height: colSpan }
      : { width: colSpan, height: rowSpan };

  const isFlipped = data.direction.orientation === "right-to-left";

  // Flip the column offset mathematically so no SVG scale transform is needed.
  // This keeps text readable without any counter-transforms in child components.
  const flipCol = (colOffset, colSpan) =>
    isFlipped ? contentWidth - colOffset - colSpan : colOffset;

  // pos() with built-in flip: colVal is always the pre-flip offset, colHeight is its span.
  const flippedPos = (rowVal, colVal, rowSpan = SEAT_HEIGHT, colHeight = SEAT_HEIGHT) => {
    const fc = flipCol(colVal, colHeight);
    return pos(rowVal, fc, rowSpan, colHeight);
  };

  return (
    <svg
      viewBox={viewBox}
      style={
        landscape
          ? {
              height: `${renderWidth}px`,
              width: `${renderLength}px`,
              display: "block",
            }
          : {
              width: "100%",
              display: "block",
            }
      }
    >
      <rect width="100%" height="100%" fill="#ecf0f1" />

      <g>

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
              const { x, y } = flippedPos(rowOffset, colOffset, tableRowSpan, tableColSpan);
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
          const { x, y } = flippedPos(rowOffset, colOffset, tableRowSpan, tableColSpan);
          const { width, height } = dims(tableColSpan, tableRowSpan);

          return (
            <g key={table.id} transform={`translate(${x}, ${y})`}>
              <TableGraphic width={width} height={height} />
            </g>
          );
        })}

        {/* Seats */}
        {seats.map((seat) => {
          // Determine which column(s) this entry uses for Y lookup.
          const primaryCol = seat.column ?? (seat.columns?.[0]);
          const rowOffset = getRowY(seat.row, primaryCol);

          // "table" type: a table occupying a single column slot within a row.
          // Sits at the same row height as adjacent seats — no inter-row gap needed.
          // size: "small" reduces the graphic to 60% width and height, centred in the slot.
          if (seat.type === "table" || seat.type === "inlineTable") {
            const colIndex = layout.seatColumns.indexOf(seat.column);
            const colOffset = getColOffset(colIndex);
            const isSmall = seat.size === "small";
            const scale = isSmall ? 0.6 : 1;
            const margin = isSmall
              ? Math.round((config.seatWidth * (1 - scale)) / 2)
              : 4;
            const tableColSpan = Math.round(config.seatWidth * scale) - (isSmall ? 0 : margin * 2);
            const tableRowSpan = Math.round(SEAT_HEIGHT * scale) - (isSmall ? 0 : margin * 2);
            const vOffset = isSmall ? Math.round((SEAT_HEIGHT - tableRowSpan) / 2) : margin;
            const { x, y } = flippedPos(rowOffset, colOffset + margin, SEAT_HEIGHT, tableColSpan);
            const { width, height } = dims(tableColSpan, tableRowSpan);
            return (
              <g key={seat.id} transform={`translate(${x}, ${y + (landscape ? 0 : vOffset)})`}>
                <TableGraphic width={width} height={height} />
              </g>
            );
          }

          if (seat.type === "fireExtinguisher") {
            const colIndex = layout.seatColumns.indexOf(seat.column);
            const colOffset = getColOffset(colIndex);
            const { x, y } = flippedPos(rowOffset, colOffset, SEAT_HEIGHT, SEAT_HEIGHT);
            const { width, height } = dims(SEAT_HEIGHT, SEAT_HEIGHT);
            return (
              <g key={seat.id} transform={`translate(${x}, ${y})`}>
                <FireExtinguisherGraphic width={width} height={height} />
              </g>
            );
          }

          // Inline luggage rack occupying a single column slot within a row.
          if (seat.type === "luggage") {
            const colIndex = layout.seatColumns.indexOf(seat.column);
            const colOffset = getColOffset(colIndex);
            const { x, y } = flippedPos(rowOffset, colOffset, SEAT_HEIGHT, SEAT_HEIGHT);
            const { width, height } = dims(SEAT_HEIGHT, SEAT_HEIGHT);
            return (
              <g key={seat.id} transform={`translate(${x}, ${y})`}>
                <LuggageGraphic width={width} height={height} />
              </g>
            );
          }

          if (seat.type === "wheelchair") {
            const colIndices = seat.columns.map((col) => layout.seatColumns.indexOf(col));
            const colOffset = getColOffset(Math.min(...colIndices));
            const colSpan = config.seatWidth * seat.columns.length;
            const { x, y } = flippedPos(rowOffset, colOffset, SEAT_HEIGHT, colSpan);
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
          const { x, y } = flippedPos(rowOffset, colOffset, SEAT_HEIGHT, SEAT_HEIGHT);

          // Anti-clockwise 90° from portrait: seats need -90° orientation rotation.
          const seatCx = SEAT_HEIGHT / 2;
          const seatCy = SEAT_HEIGHT / 2;
          const orientationRotation = landscape ? -90 : 0;
          const totalRotation = rotation + orientationRotation;

          return (
            <g key={seat.id} transform={`translate(${x}, ${y}) rotate(${totalRotation}, ${seatCx}, ${seatCy})`}>
              <SeatGraphic label={seat.id} rotation={totalRotation} reserved={seat.reserved} unreservable={seat.unreservable} reservable={seat.reservable} landscape={landscape} />
            </g>
          );
        })}

        {/* Elements */}
        {elements.map((el) => {
          if (el.type === "vestibule") {
            const { start, length: rowSpan } = rowRangeToSpan(el.rowRange);
            const { x, y } = flippedPos(start, 0, rowSpan, contentWidth);
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
            const { x, y } = flippedPos(start, colOffset, rowSpan, colSpan);
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
            const { x, y } = flippedPos(start, colOffset, rowSpan, colSpan);
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
        {/* Bike spaces — positioned by mapping s3 pixel coords to SVG space.
            xPos aligns with the row axis; yPos aligns with the cross-section axis.
            We use the regular seat xPos range so bikes sit correctly relative
            to the rendered seat grid. */}
        {bikeSpaces.length > 0 && floorplanDimensions && seatXPosRange && (() => {
          console.log('[CarriageSVG] rendering bikes:', bikeSpaces, 'seatXPosRange:', seatXPosRange, 'totalLength:', totalLength, 'floorplanDimensions:', floorplanDimensions);
          const xRange = seatXPosRange.max - seatXPosRange.min || 1;
          const bikeSize = SEAT_HEIGHT;

          return bikeSpaces.map(bike => {
            // Map xPos to the row axis using the same scale as the seat grid
            const normX = (bike.xPos - seatXPosRange.min) / xRange;
            const rowAxisPos = normX * totalLength;

            // yPos: s3 image has high yPos at bottom → column A (left in portrait).
            // Invert so bottom-of-image maps to low colOffset (left side).
            const normY = bike.yPos / floorplanDimensions.height;
            const colAxisPos = (1 - normY) * contentWidth + centreOffset;

            const { x, y } = landscape
              ? { x: rowAxisPos, y: viewboxWidth - colAxisPos - bikeSize }
              : { x: colAxisPos, y: rowAxisPos };

            return (
              <g key={bike.id} transform={`translate(${x}, ${y})`}>
                <BikeGraphic width={bikeSize} height={bikeSize} />
              </g>
            );
          });
        })()}

      </g>
    </svg>
  );
};

export default CarriageSVG;
