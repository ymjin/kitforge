/**
 * Provider-agnostic map types. One interface over Google Maps and Naver Maps
 * (and any future SDK). Concepts shared by both are unified here; provider-only
 * features are reached via each handle's `native` escape hatch.
 */

/** A geographic point. */
export interface LatLng {
  lat: number;
  lng: number;
}

/** A rectangular geographic area. */
export interface LatLngBounds {
  /** South-west (min lat, min lng) corner. */
  sw: LatLng;
  /** North-east (max lat, max lng) corner. */
  ne: LatLng;
}

/** Options for creating a map. */
export interface MapOptions {
  center: LatLng;
  zoom: number;
  minZoom?: number;
  maxZoom?: number;
}

/** Options for a marker. */
export interface MarkerOptions {
  position: LatLng;
  /** Tooltip / accessible title. */
  title?: string;
  /** Image URL for a custom marker icon. */
  iconUrl?: string;
  /** Whether the marker can be dragged. */
  draggable?: boolean;
  /** Fired when the marker is clicked. */
  onClick?: () => void;
}

/** Shared stroke/fill styling for shapes. */
export interface ShapeStyle {
  strokeColor?: string;
  strokeWeight?: number;
  /** 0–1. */
  strokeOpacity?: number;
  fillColor?: string;
  /** 0–1. */
  fillOpacity?: number;
}

export interface PolygonOptions extends ShapeStyle {
  /** Ordered vertices of the polygon's outer ring. */
  paths: LatLng[];
  onClick?: (point: LatLng) => void;
}

export interface PolylineOptions extends ShapeStyle {
  /** Ordered points of the line. */
  path: LatLng[];
  onClick?: (point: LatLng) => void;
}

/** Events a map can emit, with their payload types. */
export interface MapEventMap {
  click: LatLng;
  zoom: number;
  center: LatLng;
}

export type MapEvent = keyof MapEventMap;

/** A live marker you can update or remove. */
export interface MarkerHandle {
  setPosition(position: LatLng): void;
  remove(): void;
  /** The underlying SDK marker (e.g. `google.maps.Marker`). */
  readonly native: unknown;
}

/** A live polygon/polyline you can remove. */
export interface OverlayHandle {
  remove(): void;
  /** The underlying SDK overlay. */
  readonly native: unknown;
}

/** Controls a created map instance. Returned by {@link MapProvider.createMap}. */
export interface MapController {
  setCenter(center: LatLng): void;
  getCenter(): LatLng;
  setZoom(zoom: number): void;
  getZoom(): number;
  /** Pan + zoom to fit the given bounds. */
  fitBounds(bounds: LatLngBounds): void;

  addMarker(options: MarkerOptions): MarkerHandle;
  addPolygon(options: PolygonOptions): OverlayHandle;
  addPolyline(options: PolylineOptions): OverlayHandle;

  /** Subscribe to a map event. Returns an unsubscribe function. */
  on<E extends MapEvent>(event: E, handler: (payload: MapEventMap[E]) => void): () => void;

  /** Tear down the map and release listeners. */
  destroy(): void;

  /** The underlying SDK map object (e.g. `google.maps.Map`). */
  readonly native: unknown;
}

/**
 * A map backend. Built by a factory like `GoogleMaps({ apiKey })` so the
 * consumer supplies the key (public, domain-restricted) — never the library.
 */
export interface MapProvider {
  /** `"google"` | `"naver"`. */
  readonly id: string;
  /** Load the SDK (idempotent; safe to call repeatedly). */
  load(): Promise<void>;
  /** Create a map inside `container`. The SDK must be loaded first. */
  createMap(container: HTMLElement, options: MapOptions): MapController;
}
