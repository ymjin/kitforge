/**
 * React Native target of `@kitforge/maps/ui`. Metro resolves `./ui` here via the
 * `"react-native"` export condition. Same component + provider names as the web
 * target, so `import { Map, Marker, GoogleMaps } from "@kitforge/maps/ui"` works
 * unchanged across platforms.
 */

export * from "./native/index.js";
