/**
 * React Native target of `@ymjin/maps/ui`. Metro resolves `./ui` here via the
 * `"react-native"` export condition. Same component + provider names as the web
 * target, so `import { Map, Marker, GoogleMaps } from "@ymjin/maps/ui"` works
 * unchanged across platforms.
 */

export * from "./native/index.js";
