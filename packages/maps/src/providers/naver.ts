/**
 * Naver Maps provider (Naver Cloud Platform Maps).
 *
 * Consumer supplies the NCP key id. The SDK loads on demand via `<script>`.
 *
 * @example
 * ```ts
 * import { NaverMaps } from "@ymjin/maps/providers";
 * const naver = NaverMaps({ ncpKeyId: import.meta.env.VITE_NAVER_MAP_KEY });
 * ```
 *
 * Note: Naver renamed the script auth param from `ncpClientId` to `ncpKeyId`
 * in its 2025 NCP migration. This defaults to `ncpKeyId`; override `scriptParam`
 * if your console still issues a legacy client id.
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

export interface NaverMapsOptions {
  /** NCP key id (a.k.a. client id) for the Maps sub-product. */
  ncpKeyId: string;
  /** Query-param name for the key. Default: `"ncpKeyId"`. */
  scriptParam?: string;
  /** Extra submodules, e.g. `["geocoder"]`. */
  submodules?: string[];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function nmaps(): any {
  const n = (globalThis as any).naver;
  if (!n?.maps) throw new Error("[@ymjin/maps] Naver Maps SDK not loaded. Call provider.load() first.");
  return n.maps;
}

export function NaverMaps(options: NaverMapsOptions): MapProvider {
  const { ncpKeyId, scriptParam = "ncpKeyId", submodules = [] } = options;

  return {
    id: "naver",

    load() {
      const params = new URLSearchParams({ [scriptParam]: ncpKeyId });
      if (submodules.length) params.set("submodules", submodules.join(","));
      return loadScript(`https://oapi.map.naver.com/openapi/v3/maps.js?${params.toString()}`, {
        isReady: () => !!(globalThis as any).naver?.maps,
      });
    },

    createMap(container: HTMLElement, mapOptions: MapOptions): MapController {
      const maps = nmaps();
      const toNaver = (ll: LatLng) => new maps.LatLng(ll.lat, ll.lng);
      const fromNaver = (ll: any): LatLng => ({ lat: ll.lat(), lng: ll.lng() });

      const map = new maps.Map(container, {
        center: toNaver(mapOptions.center),
        zoom: mapOptions.zoom,
        minZoom: mapOptions.minZoom,
        maxZoom: mapOptions.maxZoom,
      });

      return {
        native: map,
        setCenter: (c) => map.setCenter(toNaver(c)),
        getCenter: () => fromNaver(map.getCenter()),
        setZoom: (z) => map.setZoom(z),
        getZoom: () => map.getZoom(),
        fitBounds: (b: LatLngBounds) =>
          map.fitBounds(new maps.LatLngBounds(toNaver(b.sw), toNaver(b.ne))),

        addMarker(opts: MarkerOptions): MarkerHandle {
          const marker = new maps.Marker({
            position: toNaver(opts.position),
            map,
            title: opts.title,
            draggable: opts.draggable,
            ...(opts.iconUrl ? { icon: opts.iconUrl } : {}),
          });
          if (opts.onClick) maps.Event.addListener(marker, "click", opts.onClick);
          return {
            native: marker,
            setPosition: (p) => marker.setPosition(toNaver(p)),
            remove: () => marker.setMap(null),
          };
        },

        addPolygon(opts: PolygonOptions): OverlayHandle {
          const polygon = new maps.Polygon({
            map,
            paths: [opts.paths.map(toNaver)],
            strokeColor: opts.strokeColor,
            strokeWeight: opts.strokeWeight,
            strokeOpacity: opts.strokeOpacity,
            fillColor: opts.fillColor,
            fillOpacity: opts.fillOpacity,
          });
          if (opts.onClick) {
            maps.Event.addListener(polygon, "click", (e: any) =>
              opts.onClick?.(fromNaver(e.coord)),
            );
          }
          return { native: polygon, remove: () => polygon.setMap(null) };
        },

        addPolyline(opts: PolylineOptions): OverlayHandle {
          const line = new maps.Polyline({
            map,
            path: opts.path.map(toNaver),
            strokeColor: opts.strokeColor,
            strokeWeight: opts.strokeWeight,
            strokeOpacity: opts.strokeOpacity,
          });
          if (opts.onClick) {
            maps.Event.addListener(line, "click", (e: any) => opts.onClick?.(fromNaver(e.coord)));
          }
          return { native: line, remove: () => line.setMap(null) };
        },

        on<E extends MapEvent>(event: E, handler: (p: MapEventMap[E]) => void): () => void {
          const maps2 = nmaps();
          let listener: any;
          if (event === "click") {
            listener = maps2.Event.addListener(map, "click", (e: any) =>
              (handler as (p: LatLng) => void)(fromNaver(e.coord)),
            );
          } else if (event === "zoom") {
            listener = maps2.Event.addListener(map, "zoom_changed", () =>
              (handler as (p: number) => void)(map.getZoom()),
            );
          } else {
            listener = maps2.Event.addListener(map, "center_changed", () =>
              (handler as (p: LatLng) => void)(fromNaver(map.getCenter())),
            );
          }
          return () => maps2.Event.removeListener(listener);
        },

        destroy() {
          map.destroy?.();
          container.replaceChildren();
        },
      };
    },
  };
}
