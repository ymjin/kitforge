"use client";
import { useEffect, useState } from "react";
import type { LatLng } from "../core/types.js";

export interface UseCurrentPositionOptions {
  /** Continuously track the position (`watchPosition`) instead of a one-shot read. */
  watch?: boolean;
  /** Request the most accurate position available (uses more battery). */
  enableHighAccuracy?: boolean;
  /** Max age (ms) of a cached position to accept. */
  maximumAge?: number;
  /** Time (ms) to wait for a position before failing. */
  timeout?: number;
}

export interface CurrentPositionState {
  position: LatLng | null;
  /** Accuracy radius in meters, when known. */
  accuracy: number | null;
  error: GeolocationPositionError | Error | null;
  loading: boolean;
}

/**
 * Track the device's current location via the Geolocation API.
 *
 * ```tsx
 * const { position, loading, error } = useCurrentPosition({ watch: true });
 * if (position) <Marker position={position} title="현재 위치" />;
 * ```
 */
export function useCurrentPosition(
  options: UseCurrentPositionOptions = {},
): CurrentPositionState {
  const { watch = false, enableHighAccuracy = true, maximumAge, timeout } = options;
  const [state, setState] = useState<CurrentPositionState>({
    position: null,
    accuracy: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({
        position: null,
        accuracy: null,
        error: new Error("[@ymjin/maps] Geolocation is not available in this environment."),
        loading: false,
      });
      return;
    }

    const onSuccess = (pos: GeolocationPosition) => {
      setState({
        position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        accuracy: pos.coords.accuracy,
        error: null,
        loading: false,
      });
    };
    const onError = (err: GeolocationPositionError) => {
      setState((prev) => ({ ...prev, error: err, loading: false }));
    };
    const geoOptions: PositionOptions = { enableHighAccuracy, maximumAge, timeout };

    if (watch) {
      const id = navigator.geolocation.watchPosition(onSuccess, onError, geoOptions);
      return () => navigator.geolocation.clearWatch(id);
    }
    navigator.geolocation.getCurrentPosition(onSuccess, onError, geoOptions);
    return undefined;
  }, [watch, enableHighAccuracy, maximumAge, timeout]);

  return state;
}
