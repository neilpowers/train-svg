/**
 * Transforms an s3 API coach object into the class800 format consumed by CarriageSVG.
 *
 * Key mappings:
 *   seat.xPos          → physical position along the train → sorted to derive row number
 *   seat.rowPosition   → cross-section column: 5=A, 4=B, (3=aisle gap), 2=C, 1=D
 *   seat.isReversed    → facing: true=backward, false=forward
 *   seat.isBooked      → reserved
 *   seat.isBookable    → reservable (when not booked)
 *   propertyCodes TABL → contributes to tables[] entries
 */

// rowPosition → column letter
// s3 yPos increases downward in the floorplan image.
// In portrait mode the carriage cross-section renders left→right,
// so we map the bottom of the image (rowPosition 5, high yPos) to column A
// so that seat numbering reads naturally left-to-right (1,2 | aisle | 3,4).
const ROW_POSITION_TO_COLUMN = { 5: "A", 4: "B", 2: "C", 1: "D" };

const RENDER_CONFIG = {
  seatWidth: 50,
  seatPitch: 75,
  aisleWidth: 40,
  rowGap: 8,
};

/**
 * Sort unique xPos values → assign sequential row numbers starting at 1.
 */
function buildXPosToRow(seats) {
  const xValues = [...new Set(seats.map(s => s.xPos))].sort((a, b) => a - b);
  const map = {};
  xValues.forEach((x, i) => { map[x] = i + 1; });
  return map;
}

/**
 * Detect table bay pairs from TABL-coded seats using xPos as the physical row marker.
 *
 * A table bay is formed by two adjacent xPos groups on the same column side (AB or CD)
 * where the lower xPos is all backward-facing and the higher xPos is all forward-facing.
 *
 * Algorithm:
 * 1. Filter to TABL seats only.
 * 2. Split by column side (AB / CD).
 * 3. Per side, sort unique xPos values.
 * 4. Walk pairs of consecutive xPos values — if lower=all-backward and upper=all-forward,
 *    emit a table bay and advance past both (i++).
 */
function deriveTables(seats, xPosToRow) {
  const tablSeats = seats.filter(s => s.propertyCodes.includes("TABL"));

  // Pre-sort all xPos values so adjacency check is a simple index diff
  const allX = [...new Set(seats.map(s => s.xPos))].sort((a, b) => a - b);

  const byColumnSide = { AB: [], CD: [] };
  for (const seat of tablSeats) {
    const col = ROW_POSITION_TO_COLUMN[seat.rowPosition];
    if (col === "A" || col === "B") byColumnSide.AB.push(seat);
    if (col === "C" || col === "D") byColumnSide.CD.push(seat);
  }

  const tables = [];
  let tableIdx = 1;

  for (const [side, sideSeats] of Object.entries(byColumnSide)) {
    if (!sideSeats.length) continue;
    const columns = side === "AB" ? ["A", "B"] : ["C", "D"];

    // Unique xPos values that appear on this side, in train order
    const sideX = [...new Set(sideSeats.map(s => s.xPos))].sort((a, b) => a - b);

    for (let i = 0; i < sideX.length - 1; i++) {
      const xBack = sideX[i];
      const xFwd  = sideX[i + 1];

      // Must be adjacent in the full row list — no seat row between them
      if (allX.indexOf(xFwd) - allX.indexOf(xBack) !== 1) continue;

      const backSeats = sideSeats.filter(s => s.xPos === xBack);
      const fwdSeats  = sideSeats.filter(s => s.xPos === xFwd);

      // Backward group: all isReversed=true. Forward group: all isReversed=false.
      if (!backSeats.every(s => s.isReversed) || fwdSeats.some(s => s.isReversed)) continue;

      tables.push({
        id: `table_${side}_${tableIdx++}`,
        columns,
        backwardRow: xPosToRow[xBack],
        forwardRow:  xPosToRow[xFwd],
      });

      i++; // xFwd is consumed — skip it as a potential backward row
    }
  }

  return tables;
}



/**
 * Main transformer: s3 coach object → class800 format.
 */
export function transformS3Coach(coach) {
  const allSeats = coach.seats || [];

  // Regular seats only (exclude bikes / non-seat inventory)
  const regularSeats = allSeats.filter(s => s.inventoryClass !== "9B");

  // Bike spaces — kept separate, positioned using raw s3 pixel coords
  const bikeSeats = allSeats.filter(
    s => s.inventoryClass === "9B" || s.propertyCodes.includes("BIKE")
  );

  console.log(`[transformS3Coach] coach ${coach.id}: ${regularSeats.length} seats, ${bikeSeats.length} bike spaces`, bikeSeats.map(s => ({ id: s.id, xPos: s.xPos, yPos: s.yPos, inventoryClass: s.inventoryClass, propertyCodes: s.propertyCodes })));

  // Build xPos → logical row mapping
  const xPosToRow = buildXPosToRow(regularSeats);
  const sortedRows = Object.values(xPosToRow).sort((a, b) => a - b);
  const maxSeatRow = sortedRows[sortedRows.length - 1];

  // rows span 1..maxSeatRow with no padding needed
  const totalRows = maxSeatRow;

  // Derive tables
  const tables = deriveTables(regularSeats, xPosToRow);

  // Derive elements (vestibules, toilet)
  const elements = [];

  // Build seat entries
  const seats = regularSeats
    .filter(s => ROW_POSITION_TO_COLUMN[s.rowPosition] !== undefined)
    .map(seat => {
      const row    = xPosToRow[seat.xPos];
      const column = ROW_POSITION_TO_COLUMN[seat.rowPosition];
      const facing = seat.isReversed ? "backward" : "forward";

      const entry = { id: seat.id, row, column, facing };

      if (seat.isBooked) {
        entry.reservable = true;
        entry.reserved   = true;
      } else if (seat.isBookable) {
        entry.reservable = true;
      } else {
        entry.unreservable = true;
      }

      // Carry useful property codes as metadata (not used by CarriageSVG but useful later)
      if (seat.propertyCodes.includes("PSEA")) entry.prioritySeat = true;

      return entry;
    });

  // Determine travel direction from coach-level isReversed
  const travelDirection = coach.isReversed ? "backward" : "forward";

  return {
    meta: {
      rollingStock: coach.name || coach.id,
      carriageId: coach.id,
      class: "standard",
    },
    direction: {
      travel: travelDirection,
    },
    layout: {
      rows: totalRows,
      seatColumns: ["A", "B", "C", "D"],
    },
    render: RENDER_CONFIG,
    seats,
    tables,
    elements,
    // Bike spaces use raw s3 pixel coords — scaled at render time using floorplanDimensions
    bikeSpaces: bikeSeats.map(s => ({
      id: s.id,
      xPos: s.xPos,
      yPos: s.yPos,
      isBookable: s.isBookable,
      isBooked: s.isBooked,
    })),
    floorplanDimensions: coach.floorplanDimensions ?? { width: 1173, height: 306 },
    // xPos range of regular seats — used to anchor bike positions to the same grid
    seatXPosRange: {
      min: Math.min(...regularSeats.map(s => s.xPos)),
      max: Math.max(...regularSeats.map(s => s.xPos)),
    },
  };
}
