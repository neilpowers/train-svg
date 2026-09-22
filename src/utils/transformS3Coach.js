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

export function transformS3Coach(coach) {
  const allSeats = coach.seats || [];

  // Seats with empty propertyCodes are placeholders — exclude them from display
  const displayableSeats = allSeats.filter(s => s.propertyCodes?.length > 0);

  // Build all seat entries — bikes and regular seats go into the same array,
  // differentiated by type so CarriageSVG can render them appropriately.
  const seats = displayableSeats.map(seat => {
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
      // Bikes use the same availability flags for potential future use
      entry.reservable  = seat.isBookable && !seat.isBooked;
      entry.reserved    = seat.isBooked ?? false;
    }

    return entry;
  });

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
