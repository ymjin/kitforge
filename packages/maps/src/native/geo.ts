/**
 * Conversions between the web concept of an integer `zoom` level and
 * react-native-maps' `Region` deltas. Pure functions so they're easy to test.
 */

/** Web zoom level → region delta (degrees spanned). */
export function zoomToDelta(zoom: number): number {
  return 360 / Math.pow(2, zoom);
}

/** Region delta (degrees spanned) → approximate web zoom level. */
export function deltaToZoom(delta: number): number {
  if (delta <= 0) return 0;
  return Math.log2(360 / delta);
}
