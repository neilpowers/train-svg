/**
 * Transforms an s3 API coach object into the class800 format consumed by CarriageSVG.
 *
 * Key mappings:
 *   seat.xPos          → physical position along the train → sorted to derive row number
 *   seat.rowPosition   → cross-section column: 1=A, 2=B, (3=aisle gap), 4=C, 5=D
 *   seat.isReversed    → facing: true=backward, false=forward
 *   seat.isBooked      → reserved
 *   seat.isBookable    → reservable (when not booked)
 *   propertyCodes TABL → contributes to tables[] entries
 *   inventoryClass 9B  → bike/non-seat, skipped
 */

const ROW_POSITION_TO_COLUMN = { 1: "A", 2: "B", 4: "C", 5: "D" };

const RENDER_CONFIG = {
  seatWidth: 50,
  seatPitch: 75,
  aisleWidth: 40,
  rowGap: 8,
};

/**
 * Sort unique xPos values → assign sequential row numbers starting at 2
 * (row 1 reserved for front vestibule element).
 */
function buildXPosToRow(seats) {
  const xValues = [...new Set(
    seats
      .filter(s => s.inventoryClass !== "9B")
      .map(s => s.xPos)
  )].sort((a, b) => a - b);

  const map = {};
  xValues.forEach((x, i) => { map[x] = i + 2; }); // rows start at 2
  return map;
}

/**
 * Detect table bay pairs from TABL-coded seats.
 *
 * A table bay is a pair of rows (one backward, one forward) on the same column side
 * (A+B or C+D) that are physically adjacent (consecutive sorted xPos values).
 *
 * Strategy:
 * 1. Collect all TABL seats, grouped by column side ("AB" or "CD").
 * 2. For each column side, sort the rows that appear.
 * 3. Consecutive backward→forward row pairs at adjacent xPos values form a bay.
 */
function deriveTables(seats, xPosToRow) {
  const tablSeats = seats.filter(
    s => s.inventoryClass !== "9B" && s.propertyCodes.includes("TABL")
  );

  // Group by column side
  const byColumnSide = { AB: [], CD: [] };
  for (const seat of tablSeats) {
    const col = ROW_POSITION_TO_COLUMN[seat.rowPosition];
    if (col === "A" || col === "B") byColumnSide.AB.push(seat);
    if (col === "C" || col === "D") byColumnSide.CD.push(seat);
  }

  const tables = [];
  let tableIdx = 1;

  for (const [side, sideSeats] of Object.entries(byColumnSide)) {
    const columns = side === "AB" ? ["A", "B"] : ["C", "D"];

    // Get unique xPos values on this side, sorted
    const xValues = [...new Set(sideSeats.map(s => s.xPos))].sort((a, b) => a - b);

    // Pair up adjacent xPos values where one is backward and the other is forward
    for (let i = 0; i < xValues.length - 1; i++) {
      const xA = xValues[i];
      const xB = xValues[i + 1];

      // Check they are genuinely adjacent in the full xPos list (no gap between them)
      const allX = Object.keys(xPosToRow).map(Number).sort((a, b) => a - b);
      const idxA = allX.indexOf(xA);
      const idxB = allX.indexOf(xB);
      if (idxB - idxA !== 1) continue; // not adjacent rows — skip

      // Seats at xA should be backward (isReversed=true), xB forward (isReversed=false)
      const seatsAtA = sideSeats.filter(s => s.xPos === xA);
      const seatsAtB = sideSeats.filter(s => s.xPos === xB);
      if (!seatsAtA.length || !seatsAtB.length) continue;

      const aIsBackward = seatsAtA.every(s => s.isReversed === true);
      const bIsForward  = seatsAtB.every(s => s.isReversed === false);
      if (!aIsBackward || !bIsForward) continue;

      const backwardRow = xPosToRow[xA];
      const forwardRow  = xPosToRow[xB];

      tables.push({
        id: `table_${side}_${tableIdx++}`,
        columns,
        backwardRow,
        forwardRow,
      });

      i++; // skip xB — it's consumed as part of this bay
    }
  }

  return tables;
}

/**
 * Infer vestibule / toilet / luggage elements from the coach name/type.
 * The coach name contains codes like "AH" (accessible toilet), "WC" (toilet), "/W" (wheelchair).
 * We always add front and rear vestibules.
 */
function deriveElements(coach, maxRow) {
  const elements = [];
  const name = (coach.name || coach.coachType || "").toUpperCase();

  // Front vestibule always at row 1
  elements.push({ type: "vestibule", id: "front_vestibule", rowRange: [1, 1] });

  // Rear vestibule always at last row
  elements.push({ type: "vestibule", id: "rear_vestibule", rowRange: [maxRow, maxRow] });

  // Accessible toilet / WC — infer from coach name
  if (name.includes("AH") || name.includes("WC")) {
    elements.push({
      type: "toilet",
      id: "accessible_wc",
      rowRange: [maxRow, maxRow],
      columns: ["A", "B"],
      accessible: name.includes("AH"),
    });
  }

  return elements;
}

/**
 * Main transformer: s3 coach object → class800 format.
 */
export function transformS3Coach(coach) {
  const allSeats = coach.seats || [];

  // Regular seats only (exclude bikes / non-seat inventory)
  const regularSeats = allSeats.filter(s => s.inventoryClass !== "9B");

  // Build xPos → logical row mapping
  const xPosToRow = buildXPosToRow(regularSeats);
  const sortedRows = Object.values(xPosToRow).sort((a, b) => a - b);
  const maxSeatRow = sortedRows[sortedRows.length - 1];

  // Vestibule/element rows sit outside the seat area
  const totalRows = maxSeatRow + 1;

  // Derive tables
  const tables = deriveTables(regularSeats, xPosToRow);

  // Derive elements (vestibules, toilet)
  const elements = deriveElements(coach, totalRows);

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
  };
}
