/**
 * Web target of `@ymjin/maps/ui`. Bundlers resolve `./ui` here on the
 * browser; React Native (Metro) resolves to `ui-native` instead. Re-exports the
 * web components and the web providers so one import works cross-platform.
 */

export * from "./react/index.js";
export { GoogleMaps, NaverMaps } from "./providers/index.js";
export type { GoogleMapsOptions, NaverMapsOptions } from "./providers/index.js";
