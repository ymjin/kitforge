"use client";
import { useEffect, useRef } from "react";
import { useMapController } from "./Map.js";
import type {
  MarkerHandle,
  MarkerOptions,
  OverlayHandle,
  PolygonOptions,
  PolylineOptions,
} from "../core/types.js";

export interface MarkerProps extends MarkerOptions {}

/**
 * A marker attached to the enclosing `<Map>`. Updates its position when
 * `position` changes; removed on unmount.
 *
 * Note: `onClick` is bound once when the marker is created.
 */
export function Marker(props: MarkerProps) {
  const map = useMapController();
  const handle = useRef<MarkerHandle | null>(null);
  // Latest options without re-creating the marker.
  const optsRef = useRef(props);
  optsRef.current = props;

  useEffect(() => {
    if (!map) return;
    const h = map.addMarker(optsRef.current);
    handle.current = h;
    return () => {
      h.remove();
      handle.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  useEffect(() => {
    handle.current?.setPosition(props.position);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.position.lat, props.position.lng]);

  return null;
}

export interface PolygonProps extends PolygonOptions {}

/** A polygon attached to the enclosing `<Map>`. Re-created when its path changes. */
export function Polygon(props: PolygonProps) {
  const map = useMapController();
  const handle = useRef<OverlayHandle | null>(null);
  const optsRef = useRef(props);
  optsRef.current = props;
  const pathKey = serialize(props.paths);

  useEffect(() => {
    if (!map) return;
    const h = map.addPolygon(optsRef.current);
    handle.current = h;
    return () => {
      h.remove();
      handle.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, pathKey]);

  return null;
}

export interface PolylineProps extends PolylineOptions {}

/** A polyline attached to the enclosing `<Map>`. Re-created when its path changes. */
export function Polyline(props: PolylineProps) {
  const map = useMapController();
  const handle = useRef<OverlayHandle | null>(null);
  const optsRef = useRef(props);
  optsRef.current = props;
  const pathKey = serialize(props.path);

  useEffect(() => {
    if (!map) return;
    const h = map.addPolyline(optsRef.current);
    handle.current = h;
    return () => {
      h.remove();
      handle.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, pathKey]);

  return null;
}

function serialize(points: { lat: number; lng: number }[]): string {
  return points.map((p) => `${p.lat},${p.lng}`).join("|");
}
