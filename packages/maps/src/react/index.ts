/**
 * @kitforge/maps/react — React bindings.
 *
 * ```tsx
 * import { GoogleMaps } from "@kitforge/maps/providers";
 * import { Map, Marker, Polygon, Polyline, useCurrentPosition } from "@kitforge/maps/react";
 * ```
 */

export { Map, useMapController } from "./Map.js";
export type { MapProps } from "./Map.js";

export { Marker, Polygon, Polyline } from "./overlays.js";
export type { MarkerProps, PolygonProps, PolylineProps } from "./overlays.js";

export { useCurrentPosition } from "./useCurrentPosition.js";
export type { UseCurrentPositionOptions, CurrentPositionState } from "./useCurrentPosition.js";
