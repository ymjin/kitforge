# @ymjin/maps

One React map interface over **Google Maps** and **Naver Maps**. Write your map
once; switch providers by swapping one factory.

| Provider | Factory | Key |
|----------|---------|-----|
| Google Maps | `GoogleMaps({ apiKey })` | Maps JavaScript API key |
| Naver Maps | `NaverMaps({ ncpKeyId })` | NCP Maps key id |

## Web + React Native

The same component code runs on both platforms — the bundler picks the build:

```
@ymjin/maps            ← shared types + MapController contract + loadScript
@ymjin/maps/providers  ← web providers: GoogleMaps, NaverMaps
@ymjin/maps/react      ← web components (JS SDK + DOM)
@ymjin/maps/native     ← React Native components (react-native-maps)
@ymjin/maps/ui         ← platform-resolved: web → /react, RN (Metro) → /native
```

Import from `@ymjin/maps/ui` and write once:

```tsx
import { Map, Marker, GoogleMaps } from "@ymjin/maps/ui";
// web  → Google/Naver JS SDK
// RN   → react-native-maps (Google/Apple)
```

| | Web (`/react`) | Native (`/native`) |
|--|----------------|--------------------|
| Google | ✅ | ✅ |
| Apple | — | ✅ (`AppleMaps()`) |
| Naver | ✅ | ❌ not yet (`NaverMaps()` throws) |

**Native requirements:** `react-native` + `react-native-maps` peers, keys in
native config (`app.json` / `Info.plist` / `AndroidManifest.xml`), and a
**dev/EAS build** — `react-native-maps` does not run in Expo Go.

SDKs load on demand via `<script>` (deduped) and are never bundled. Keys are
public, domain-restricted values that **you** inject — the library never holds
them. Unified concepts (center/zoom, markers, polygons, polylines, click/zoom/
center events, fit-bounds) work identically across providers; provider-only
features are reachable through each handle's `native` escape hatch.

## Usage

```tsx
import { GoogleMaps } from "@ymjin/maps/providers";
import { Map, Marker, Polygon, useCurrentPosition } from "@ymjin/maps/react";

const google = GoogleMaps({ apiKey: import.meta.env.VITE_GMAPS_KEY });

function MyMap() {
  const { position } = useCurrentPosition({ watch: true });
  return (
    <div style={{ width: "100%", height: 480 }}>
      <Map
        provider={google}
        center={{ lat: 37.5665, lng: 126.978 }}
        zoom={12}
        onClick={(p) => console.log("clicked", p)}
      >
        <Marker position={{ lat: 37.5665, lng: 126.978 }} title="서울시청" />
        {position && <Marker position={position} title="현재 위치" />}
        <Polygon
          paths={[
            { lat: 37.57, lng: 126.97 },
            { lat: 37.57, lng: 126.99 },
            { lat: 37.55, lng: 126.99 },
          ]}
          fillColor="#2f66f6"
          fillOpacity={0.2}
        />
      </Map>
    </div>
  );
}
```

Switch to Naver: `const naver = NaverMaps({ ncpKeyId }); <Map provider={naver} … />` —
everything else stays the same.

## Scope

v1 covers basic map, markers, polygons, polylines, map events, and
current-location tracking. Marker clustering and additional SDKs are planned as
follow-ups (add when needed).

> "NAVER WORKS" is groupware, not maps. This uses **Naver Cloud Platform Maps**.
> Naver renamed the script param to `ncpKeyId` in its 2025 migration; override
> `scriptParam` if your console still issues a legacy `ncpClientId`.
