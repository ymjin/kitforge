/**
 * Browser script-loading helpers shared by every provider.
 *
 * Each external map SDK is a `<script>` that defines a global. These helpers
 * inject the tag once (deduped by URL), then resolve when the global is ready —
 * either via a JSONP-style callback or by polling.
 */

/** In-flight / completed loads, keyed by URL, so each SDK loads once. */
const inflight = new Map<string, Promise<void>>();

export interface LoadScriptOptions {
  /**
   * If set, a global function with this name is created and appended to the URL
   * as `&callback=<name>`; the load resolves when the SDK calls it. Use for
   * Google Maps (`loading=async`).
   */
  callbackParam?: string;
  /**
   * If set, the load resolves once this returns true (polled). Use for SDKs
   * that just define a global on script load (Naver).
   */
  isReady?: () => boolean;
  /** Poll interval + timeout for `isReady`, in ms. */
  pollIntervalMs?: number;
  timeoutMs?: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __kitforgeMapCallbacks: Record<string, () => void> | undefined;
}

/**
 * Inject a script once and resolve when its SDK is usable.
 * Concurrent calls for the same URL share one promise.
 */
export function loadScript(url: string, options: LoadScriptOptions = {}): Promise<void> {
  if (typeof document === "undefined") {
    return Promise.reject(new Error("[@kitforge/maps] loadScript requires a browser environment."));
  }

  const existing = inflight.get(url);
  if (existing) return existing;

  const { callbackParam, isReady, pollIntervalMs = 50, timeoutMs = 15000 } = options;

  const promise = new Promise<void>((resolve, reject) => {
    let finalUrl = url;
    let cleanupCallback: (() => void) | undefined;

    if (callbackParam) {
      const cbName = `__kf_map_cb_${inflight.size}_${callbackParam}`;
      globalThis.__kitforgeMapCallbacks ??= {};
      globalThis.__kitforgeMapCallbacks[cbName] = () => resolve();
      // Expose at the exact global path the SDK will call.
      (globalThis as Record<string, unknown>)[cbName] = () => resolve();
      cleanupCallback = () => {
        delete (globalThis as Record<string, unknown>)[cbName];
        delete globalThis.__kitforgeMapCallbacks?.[cbName];
      };
      finalUrl += (url.includes("?") ? "&" : "?") + `callback=${cbName}`;
    }

    const script = document.createElement("script");
    script.src = finalUrl;
    script.async = true;
    script.defer = true;

    script.onerror = () => {
      cleanupCallback?.();
      inflight.delete(url);
      reject(new Error(`[@kitforge/maps] Failed to load SDK script: ${url}`));
    };

    if (!callbackParam) {
      script.onload = () => {
        if (!isReady) return resolve();
        const started = Date.now();
        const tick = () => {
          if (isReady()) return resolve();
          if (Date.now() - started > timeoutMs) {
            inflight.delete(url);
            return reject(new Error(`[@kitforge/maps] SDK global not ready after load: ${url}`));
          }
          setTimeout(tick, pollIntervalMs);
        };
        tick();
      };
    }

    document.head.appendChild(script);
  });

  inflight.set(url, promise);
  return promise;
}

/** Test-only: reset the dedupe cache. */
export function __resetLoaderCache(): void {
  inflight.clear();
}
