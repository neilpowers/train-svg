/**
 * Transforms an s3 API coach object into the format consumed by CarriageSVG.
 *
 * Seats are positioned directly from their s3 xPos/yPos pixel coordinates.
 *
 * Key mappings:
 *   seat.xPos       → position along the train (row axis)
 *   seat.yPos       → position across the carriage (cross-section axis)
 *   seat.isReversed → facing: true=backward, false=forward
 *   seat.isBooked   → reserved
 *   seat.isBookable → reservable (when not booked)
 */

/**
 * Derive table positions from TABL-coded seats.
 *
 * Rules:
 * - A bay is exactly 4 seats: 2 backward + 2 forward, on the SAME side of the aisle
 * - The aisle splits the carriage cross-section in two — seats group by yPos side
 * - If 4 seats share the same yPos pair and opposing xPos pair, that is one bay table
 * - Tables never span the aisle
 * - Each table occupies the gap between the inner faces of the two rows,
 *   constrained to the yPos span of its two seats only
 */
function deriveTables(tablSeats) {
  if (!tablSeats.length) return [];

  const SEAT_W = 40;

  // Determine the aisle midpoint from all TABL seat yPos values.
  // Seats above the midpoint are one side, below are the other.
  const allY = tablSeats.map(s => s.yPos);
  const yMid = (Math.min(...allY) + Math.max(...allY)) / 2;

  // Split by aisle side — "near" (low yPos) vs "far" (high yPos)
  const nearSeats = tablSeats.filter(s => s.yPos <= yMid);
  const farSeats  = tablSeats.filter(s => s.yPos >  yMid);

  const tables = [];
  let tableIdx = 1;

  for (const sideSeats of [nearSeats, farSeats]) {
    if (!sideSeats.length) continue;

    const backSeats = sideSeats.filter(s => s.isReversed);
    const fwdSeats  = sideSeats.filter(s => !s.isReversed);

    // Unique xPos per direction, sorted along the train
    const backXValues = [...new Set(backSeats.map(s => s.xPos))].sort((a, b) => a - b);
    const fwdXValues  = [...new Set(fwdSeats.map(s => s.xPos))].sort((a, b) => a - b);

    const pairCount = Math.min(backXValues.length, fwdXValues.length);

    for (let i = 0; i < pairCount; i++) {
      const backX = backXValues[i];
      const fwdX  = fwdXValues[i];

      // The two backward seats at backX on this side
      const bayBack = backSeats.filter(s => s.xPos === backX);
      // The two forward seats at fwdX on this side
      const bayFwd  = fwdSeats.filter(s => s.xPos === fwdX);

      // Must have at least one seat each side to form a table
      if (!bayBack.length || !bayFwd.length) continue;

      const baySeats = [...bayBack, ...bayFwd];
      const bayY = baySeats.map(s => s.yPos);
      const minY = Math.min(...bayY);
      const maxY = Math.max(...bayY);

      // Table edges with padding so the table doesn't touch seats or bay edges:
      //   x1/x2 — inset from the inner faces of the rows (gap between seats)
      //   y1/y2 — inset from the top/bottom of the seat bounding boxes
      const PAD_X = 6; // padding between table edge and seat face (along train)
      const PAD_Y = 6; // padding between table edge and top/bottom of bay
      tables.push({
        id:   `table_${tableIdx++}`,
        type: "table",
        x1: backX + SEAT_W + PAD_X,  // inner edge of backward seats + gap
        x2: fwdX           - PAD_X,  // inner edge of forward seats  - gap
        y1: minY            + PAD_Y,  // top of bay + padding
        y2: maxY + SEAT_W  - PAD_Y,  // bottom of bay - padding
      });
    }
  }

  return tables;
}

export function transformS3Coach(coach) {
  const allSeats = coach.seats || [];

  // Seats with empty propertyCodes are placeholders — exclude them from display
  const displayableSeats = allSeats.filter(s => s.propertyCodes?.length > 0);

  // Derive tables from TABL-coded seats before building the seats array
  const tablSeats = displayableSeats.filter(
    s => s.inventoryClass !== "9B" && s.propertyCodes.includes("TABL")
  );
  const tables = deriveTables(tablSeats);

  // Build all seat entries — bikes and regular seats go into the same array,
  // differentiated by type so CarriageSVG can render them appropriately.
  const seats = [
    ...displayableSeats.map(seat => {
      const isBike = seat.inventoryClass === "9B" || seat.propertyCodes.includes("BIKE");

      const entry = {
        id:   seat.id,
        xPos: seat.xPos,
        yPos: seat.yPos,
        type: isBike ? "bike" : "seat",
      };

      if (!isBike) {
        entry.facing = seat.isReversed ? "backward" : "forward";

        if (seat.isBooked) {
          entry.reservable = true;
          entry.reserved   = true;
        } else if (seat.isBookable) {
          entry.reservable = true;
        } else {
          entry.unreservable = true;
        }

        if (seat.propertyCodes.includes("PSEA")) entry.prioritySeat = true;
      } else {
        entry.reservable = seat.isBookable && !seat.isBooked;
        entry.reserved   = seat.isBooked ?? false;
      }

      return entry;
    }),
    // Tables appended last so they render on top of the background
    ...tables,
  ];

  // Bounding box across displayable seats so the canvas scales correctly
  const xValues = displayableSeats.map(s => s.xPos);
  const yValues = displayableSeats.map(s => s.yPos);

  const travelDirection = coach.isReversed ? "backward" : "forward";

  return {
    meta: {
      rollingStock: coach.name || coach.id,
      carriageId:   coach.id,
      class:        "standard",
    },
    direction: {
      travel: travelDirection,
    },
    seats,
    floorplanDimensions: coach.floorplanDimensions ?? { width: 1173, height: 306 },
    seatXPosRange: { min: Math.min(...xValues), max: Math.max(...xValues) },
    seatYPosRange: { min: Math.min(...yValues), max: Math.max(...yValues) },
  };
}
