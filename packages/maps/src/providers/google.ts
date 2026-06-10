/**
 * Google Maps provider.
 *
 * Consumer supplies a (public, domain-restricted) Maps JavaScript API key.
 * The SDK is loaded on demand via a `<script>` tag — never bundled.
 *
 * @example
 * ```ts
 * import { GoogleMaps } from "@kitforge/maps/providers";
 * const google = GoogleMaps({ apiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY });
 * ```
 */

import { loadScript } from "../core/loader.js";
import type {
  LatLng,
  LatLngBounds,
  MapController,
  MapEvent,
  MapEventMap,
  MapOptions,
  MapProvider,
  MarkerHandle,
  MarkerOptions,
  OverlayHandle,
  PolygonOptions,
  PolylineOptions,
} from "../core/types.js";

export interface GoogleMapsOptions {
  apiKey: string;
  /** Extra libraries to load, e.g. `["places", "marker"]`. */
  libraries?: string[];
  /** API version. Default: `"weekly"`. */
  version?: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function gmaps(): any {
  const g = (globalThis as any).google;
  if (!g?.maps) throw new Error("[@kitforge/maps] Google Maps SDK not loaded. Call provider.load() first.");
  return g.maps;
}

export function GoogleMaps(options: GoogleMapsOptions): MapProvider {
  const { apiKey, libraries = [], version = "weekly" } = options;

  return {
    id: "google",

    load() {
      const params = new URLSearchParams({ key: apiKey, v: version, loading: "async" });
      if (libraries.length) params.set("libraries", libraries.join(","));
      return loadScript(`https://maps.googleapis.com/maps/api/js?${params.toString()}`, {
        callbackParam: "callback",
      });
    },

    createMap(container: HTMLElement, mapOptions: MapOptions): MapController {
      const maps = gmaps();
      const map = new maps.Map(container, {
        center: mapOptions.center,
        zoom: mapOptions.zoom,
        minZoom: mapOptions.minZoom,
        maxZoom: mapOptions.maxZoom,
      });

      const toLatLng = (ll: any): LatLng => ({ lat: ll.lat(), lng: ll.lng() });

      return {
        native: map,
        setCenter: (c) => map.setCenter(c),
        getCenter: () => toLatLng(map.getCenter()),
        setZoom: (z) => map.setZoom(z),
        getZoom: () => map.getZoom(),
        fitBounds: (b: LatLngBounds) =>
          map.fitBounds(new maps.LatLngBounds(b.sw, b.ne)),

        addMarker(opts: MarkerOptions): MarkerHandle {
          const marker = new maps.Marker({
            position: opts.position,
            map,
            title: opts.title,
            draggable: opts.draggable,
            icon: opts.iconUrl,
          });
          if (opts.onClick) marker.addListener("click", opts.onClick);
          return {
            native: marker,
            setPosition: (p) => marker.setPosition(p),
            remove: () => marker.setMap(null),
          };
        },

        addPolygon(opts: PolygonOptions): OverlayHandle {
          const polygon = new maps.Polygon({
            paths: opts.paths,
            map,
            strokeColor: opts.strokeColor,
            strokeWeight: opts.strokeWeight,
            strokeOpacity: opts.strokeOpacity,
            fillColor: opts.fillColor,
            fillOpacity: opts.fillOpacity,
          });
          if (opts.onClick) {
            polygon.addListener("click", (e: any) =>
              opts.onClick?.({ lat: e.latLng.lat(), lng: e.latLng.lng() }),
            );
          }
          return { native: polygon, remove: () => polygon.setMap(null) };
        },

        addPolyline(opts: PolylineOptions): OverlayHandle {
          const line = new maps.Polyline({
            path: opts.path,
            map,
            strokeColor: opts.strokeColor,
            strokeWeight: opts.strokeWeight,
            strokeOpacity: opts.strokeOpacity,
          });
          if (opts.onClick) {
            line.addListener("click", (e: any) =>
              opts.onClick?.({ lat: e.latLng.lat(), lng: e.latLng.lng() }),
            );
          }
          return { native: line, remove: () => line.setMap(null) };
        },

        on<E extends MapEvent>(event: E, handler: (p: MapEventMap[E]) => void): () => void {
          const maps2 = gmaps();
          let listener: any;
          if (event === "click") {
            listener = map.addListener("click", (e: any) =>
              (handler as (p: LatLng) => void)({ lat: e.latLng.lat(), lng: e.latLng.lng() }),
            );
          } else if (event === "zoom") {
            listener = map.addListener("zoom_changed", () =>
              (handler as (p: number) => void)(map.getZoom()),
            );
          } else {
            listener = map.addListener("center_changed", () =>
              (handler as (p: LatLng) => void)(toLatLng(map.getCenter())),
            );
          }
          return () => maps2.event.removeListener(listener);
        },

        destroy() {
          gmaps().event.clearInstanceListeners(map);
          container.replaceChildren();
        },
      };
    },
  };
}
