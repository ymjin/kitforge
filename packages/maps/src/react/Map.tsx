"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { LatLng, MapController, MapProvider } from "../core/types.js";

const MapContext = createContext<MapController | null>(null);

/** Access the live `MapController` from inside `<Map>`. Null until ready. */
export function useMapController(): MapController | null {
  return useContext(MapContext);
}

export interface MapProps {
  /** A provider instance, e.g. `GoogleMaps({ apiKey })` or `NaverMaps({ ncpKeyId })`. */
  provider: MapProvider;
  center: LatLng;
  zoom: number;
  minZoom?: number;
  maxZoom?: number;
  /** Called once the underlying map is created. */
  onReady?: (controller: MapController) => void;
  onClick?: (point: LatLng) => void;
  onZoomChange?: (zoom: number) => void;
  onCenterChange?: (center: LatLng) => void;
  /** Markers/polygons/polylines. */
  children?: ReactNode;
  className?: string;
  /** Defaults to `{ width: "100%", height: "100%" }`. */
  style?: CSSProperties;
}

/**
 * Renders a map using the given provider. The SDK loads on demand. Place
 * `<Marker>`, `<Polygon>`, `<Polyline>` as children; they attach to this map.
 *
 * ```tsx
 * import { GoogleMaps } from "@ymjin/maps/providers";
 * import { Map, Marker } from "@ymjin/maps/react";
 *
 * const google = GoogleMaps({ apiKey });
 * <Map provider={google} center={{ lat: 37.5665, lng: 126.978 }} zoom={12}>
 *   <Marker position={{ lat: 37.5665, lng: 126.978 }} title="서울시청" />
 * </Map>
 * ```
 */
export function Map({
  provider,
  center,
  zoom,
  minZoom,
  maxZoom,
  onReady,
  onClick,
  onZoomChange,
  onCenterChange,
  children,
  className,
  style,
}: MapProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  const [controller, setController] = useState<MapController | null>(null);

  // Create the map once per provider. The SDK owns `targetRef`'s DOM, so React
  // never renders children into it (markers live in a sibling context node).
  useEffect(() => {
    let active = true;
    let ctrl: MapController | undefined;
    void (async () => {
      await provider.load();
      if (!active || !targetRef.current) return;
      ctrl = provider.createMap(targetRef.current, { center, zoom, minZoom, maxZoom });
      if (!active) {
        ctrl.destroy();
        return;
      }
      setController(ctrl);
      onReady?.(ctrl);
    })();
    return () => {
      active = false;
      ctrl?.destroy();
      setController(null);
    };
    // Intentionally only re-create when the provider changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  // Wire events (re-bind when handlers change).
  useEffect(() => {
    if (!controller) return;
    const unsubs: Array<() => void> = [];
    if (onClick) unsubs.push(controller.on("click", onClick));
    if (onZoomChange) unsubs.push(controller.on("zoom", onZoomChange));
    if (onCenterChange) unsubs.push(controller.on("center", onCenterChange));
    return () => unsubs.forEach((u) => u());
  }, [controller, onClick, onZoomChange, onCenterChange]);

  // Keep center/zoom in sync with props.
  useEffect(() => {
    controller?.setCenter(center);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controller, center.lat, center.lng]);
  useEffect(() => {
    controller?.setZoom(zoom);
  }, [controller, zoom]);

  return (
    <div className={className} style={{ position: "relative", width: "100%", height: "100%", ...style }}>
      <div ref={targetRef} style={{ width: "100%", height: "100%" }} />
      <MapContext.Provider value={controller}>{controller ? children : null}</MapContext.Provider>
    </div>
  );
}
