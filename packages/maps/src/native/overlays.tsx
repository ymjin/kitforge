import { Marker as RNMarker, Polygon as RNPolygon, Polyline as RNPolyline } from "react-native-maps";
import type { MarkerOptions, PolygonOptions, PolylineOptions } from "../core/types.js";

export interface MarkerProps extends MarkerOptions {}

/** A marker on the enclosing native `<Map>`. */
export function Marker({ position, title, draggable, onClick }: MarkerProps) {
  return (
    <RNMarker
      coordinate={{ latitude: position.lat, longitude: position.lng }}
      title={title}
      draggable={draggable}
      onPress={onClick}
    />
  );
}

export interface PolygonProps extends PolygonOptions {}

/** A polygon on the enclosing native `<Map>`. */
export function Polygon({ paths, strokeColor, strokeWeight, fillColor, onClick }: PolygonProps) {
  const first = paths[0];
  return (
    <RNPolygon
      coordinates={paths.map((p) => ({ latitude: p.lat, longitude: p.lng }))}
      strokeColor={strokeColor}
      strokeWidth={strokeWeight}
      fillColor={fillColor}
      tappable={onClick != null}
      onPress={onClick && first ? () => onClick(first) : undefined}
    />
  );
}

export interface PolylineProps extends PolylineOptions {}

/** A polyline on the enclosing native `<Map>`. */
export function Polyline({ path, strokeColor, strokeWeight, onClick }: PolylineProps) {
  const first = path[0];
  return (
    <RNPolyline
      coordinates={path.map((p) => ({ latitude: p.lat, longitude: p.lng }))}
      strokeColor={strokeColor}
      strokeWidth={strokeWeight}
      tappable={onClick != null}
      onPress={onClick && first ? () => onClick(first) : undefined}
    />
  );
}
