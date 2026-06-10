/**
 * @kitforge/maps — one map interface over Google Maps and Naver Maps.
 *
 * - Core (this entry): provider-agnostic types + the `MapProvider` /
 *   `MapController` contracts, plus the `loadScript` SDK loader.
 * - `@kitforge/maps/providers`: `GoogleMaps`, `NaverMaps` factories.
 * - `@kitforge/maps/react`: `<Map>`, `<Marker>`, `<Polygon>`, `<Polyline>`,
 *   `useCurrentPosition`.
 *
 * Keys (public, domain-restricted) are injected by the consumer; the SDKs load
 * on demand via `<script>` and are never bundled.
 */

export { loadScript } from "./core/loader.js";
export type { LoadScriptOptions } from "./core/loader.js";

export type {
  LatLng,
  LatLngBounds,
  MapOptions,
  MarkerOptions,
  ShapeStyle,
  PolygonOptions,
  PolylineOptions,
  MapEvent,
  MapEventMap,
  MarkerHandle,
  OverlayHandle,
  MapController,
  MapProvider,
} from "./core/types.js";
