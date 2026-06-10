/**
 * @kitforge/maps/native — React Native bindings (react-native-maps).
 *
 * Mirrors `@kitforge/maps/react` so the same `<Map>`/`<Marker>`/`<Polygon>`/
 * `<Polyline>` code runs on web and native. Providers: `GoogleMaps()` (Android
 * default; iOS via Google native setup) and `AppleMaps()` (iOS default).
 *
 * Requires `react-native` + `react-native-maps` (peer deps) and a dev/EAS build
 * — not Expo Go. Naver is web-only for now (`NaverMaps()` throws on native).
 *
 * ```tsx
 * import { Map, Marker, Polygon, GoogleMaps, useCurrentPosition } from "@kitforge/maps/native";
 * ```
 */

export { Map } from "./Map.js";
export type { MapProps } from "./Map.js";

export { Marker, Polygon, Polyline } from "./overlays.js";
export type { MarkerProps, PolygonProps, PolylineProps } from "./overlays.js";

export { GoogleMaps, AppleMaps, NaverMaps } from "./providers.js";
export type { NativeMapProvider, GoogleMapsNativeOptions } from "./providers.js";

export { zoomToDelta, deltaToZoom } from "./geo.js";

// Geolocation hook is platform-neutral (navigator.geolocation) — shared with web.
export { useCurrentPosition } from "../react/useCurrentPosition.js";
export type { UseCurrentPositionOptions, CurrentPositionState } from "../react/useCurrentPosition.js";

// Re-export the shared core types for convenience.
export type {
  LatLng,
  LatLngBounds,
  MarkerOptions,
  PolygonOptions,
  PolylineOptions,
} from "../core/types.js";
