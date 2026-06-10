/**
 * Native map providers (React Native).
 *
 * Unlike the web providers, these don't load a script or hold a key — on native
 * the SDK is linked at build time and keys live in `app.json` / `Info.plist` /
 * `AndroidManifest.xml`. The factory just selects which underlying map to use,
 * so the SAME consumer code (`<Map provider={GoogleMaps(...)} />`) works on both
 * platforms.
 */

export interface NativeMapProvider {
  readonly id: "google" | "apple";
}

export interface GoogleMapsNativeOptions {
  /**
   * Accepted for API parity with the web provider, but ignored: on native the
   * Google Maps key is configured in your app's native config, not at runtime.
   */
  apiKey?: string;
}

/** Use Google Maps (Android default; iOS requires the Google Maps native setup). */
export function GoogleMaps(_options?: GoogleMapsNativeOptions): NativeMapProvider {
  return { id: "google" };
}

/** Use the platform-default map — Apple Maps on iOS. */
export function AppleMaps(): NativeMapProvider {
  return { id: "apple" };
}

/**
 * Naver Maps is not yet supported on native (react-native-maps covers Google /
 * Apple only; Naver needs a separate RN module). Use the web build for Naver,
 * or follow the native-Naver roadmap.
 */
export function NaverMaps(_options?: unknown): never {
  throw new Error(
    "[@kitforge/maps] Naver Maps is not supported on native yet. " +
      "Use @kitforge/maps/react (web) for Naver, or GoogleMaps()/AppleMaps() on native.",
  );
}
