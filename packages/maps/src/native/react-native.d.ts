/**
 * Minimal ambient declarations for `react-native` and `react-native-maps`,
 * just the surface this package uses. The consumer's real packages provide the
 * runtime; these only exist so `@ymjin/maps/native` type-checks and emits
 * declarations without taking a hard dependency on the (native) RN toolchain.
 */

declare module "react-native" {
  import type { ReactNode } from "react";
  export type ViewStyle = Record<string, unknown>;
  export type StyleProp<T> = T | T[] | null | undefined | false;
  export const Platform: { OS: "ios" | "android" | "windows" | "macos" | "web" };
}

declare module "react-native-maps" {
  import type { ComponentType, ReactNode } from "react";
  import type { StyleProp, ViewStyle } from "react-native";

  export interface LatLng {
    latitude: number;
    longitude: number;
  }
  export interface Region extends LatLng {
    latitudeDelta: number;
    longitudeDelta: number;
  }
  export interface MapPressEvent {
    nativeEvent: { coordinate: LatLng };
  }

  export interface MapViewProps {
    provider?: string;
    style?: StyleProp<ViewStyle>;
    initialRegion?: Region;
    region?: Region;
    showsUserLocation?: boolean;
    onPress?: (event: MapPressEvent) => void;
    onRegionChangeComplete?: (region: Region) => void;
    children?: ReactNode;
  }
  const MapView: ComponentType<MapViewProps>;
  export default MapView;

  export const PROVIDER_GOOGLE: string;
  export const PROVIDER_DEFAULT: string;

  export interface MarkerProps {
    coordinate: LatLng;
    title?: string;
    description?: string;
    draggable?: boolean;
    image?: unknown;
    onPress?: () => void;
    children?: ReactNode;
  }
  export const Marker: ComponentType<MarkerProps>;

  export interface MapPolygonProps {
    coordinates: LatLng[];
    strokeColor?: string;
    strokeWidth?: number;
    fillColor?: string;
    tappable?: boolean;
    onPress?: () => void;
  }
  export const Polygon: ComponentType<MapPolygonProps>;

  export interface MapPolylineProps {
    coordinates: LatLng[];
    strokeColor?: string;
    strokeWidth?: number;
    tappable?: boolean;
    onPress?: () => void;
  }
  export const Polyline: ComponentType<MapPolylineProps>;
}
