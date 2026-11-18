// Coordinates are geocoded from a student's home address, so they must never
// leave the server at full precision. Snapping to one decimal place puts each
// person on a ~11 km grid cell: enough to show "which city", not "which street".
const SNAP_DECIMALS = 1;

const toFiniteNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
};

const snapCoord = (value, decimals = SNAP_DECIMALS) => {
  const num = toFiniteNumber(value);
  if (num === null) return null;
  const factor = 10 ** decimals;
  return Math.round(num * factor) / factor;
};

const isValidLatLng = (lat, lng) =>
  lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

module.exports = {
  SNAP_DECIMALS,
  snapCoord,
  isValidLatLng,
};
