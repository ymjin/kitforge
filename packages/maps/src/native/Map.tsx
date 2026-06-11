import type { ReactNode } from "react";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import type { StyleProp, ViewStyle } from "react-native";
import type { LatLng } from "../core/types.js";
import type { NativeMapProvider } from "./providers.js";
import { deltaToZoom, zoomToDelta } from "./geo.js";

export interface MapProps {
  /** `GoogleMaps()` or `AppleMaps()` from `@ymjin/maps/native`. */
  provider: NativeMapProvider;
  center: LatLng;
  zoom: number;
  /** Show the device location dot (requires native location permission). */
  showsUserLocation?: boolean;
  onClick?: (point: LatLng) => void;
  onCenterChange?: (center: LatLng) => void;
  onZoomChange?: (zoom: number) => void;
  /** `<Marker>`, `<Polygon>`, `<Polyline>` from `@ymjin/maps/native`. */
  children?: ReactNode;
  /** Defaults to `{ flex: 1 }`. */
  style?: StyleProp<ViewStyle>;
}

/**
 * Renders a native map via `react-native-maps`. Mirrors the web `<Map>` API so
 * the same component tree works on web and React Native (the bundler picks the
 * platform build).
 *
 * Requires a dev/EAS build — `react-native-maps` does not run in Expo Go.
 *
 * ```tsx
 * import { Map, Marker, GoogleMaps } from "@ymjin/maps/native";
 *
 * <Map provider={GoogleMaps()} center={{ lat: 37.5665, lng: 126.978 }} zoom={12}>
 *   <Marker position={{ lat: 37.5665, lng: 126.978 }} title="서울시청" />
 * </Map>
 * ```
 */
export function Map({
  provider,
  center,
  zoom,
  showsUserLocation,
  onClick,
  onCenterChange,
  onZoomChange,
  children,
  style,
}: MapProps) {
  const delta = zoomToDelta(zoom);
  return (
    <MapView
      provider={provider.id === "google" ? PROVIDER_GOOGLE : undefined}
      style={style ?? { flex: 1 }}
      showsUserLocation={showsUserLocation}
      initialRegion={{
        latitude: center.lat,
        longitude: center.lng,
        latitudeDelta: delta,
        longitudeDelta: delta,
      }}
      onPress={
        onClick
          ? (e) =>
              onClick({
                lat: e.nativeEvent.coordinate.latitude,
                lng: e.nativeEvent.coordinate.longitude,
              })
          : undefined
      }
      onRegionChangeComplete={
        onCenterChange || onZoomChange
          ? (r) => {
              onCenterChange?.({ lat: r.latitude, lng: r.longitude });
              onZoomChange?.(deltaToZoom(r.longitudeDelta));
            }
          : undefined
      }
    >
      {children}
    </MapView>
  );
}
