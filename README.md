# Last-Mile Delivery Console

Offline-first React Native (CLI, 0.82.x, TypeScript) courier console.

**Route** — ordered stops, geofence-gated Arrive, early-departure banner, offline/unsynced indicators.  
**Proof of Delivery** — registry-driven forms from mock templates; completion is local-first.  
**Outbox** — persisted queue with background sync, retry/backoff, and reviewer mock controls.

No production backend: Axios talks to an in-process mock adapter backed by JSON fixtures.

## Requirements

- **Node 20** preferred (`.nvmrc`); **Node 21** also works (`package.json` engines: `>=20 <22`)
- **Yarn** (`yarn.lock`)
- Android Studio / JDK / emulator or device — [RN environment setup](https://reactnative.dev/docs/set-up-your-environment)

nvm is optional. If installed with Node 20, `yarn start` / `yarn android` switch to it automatically; otherwise they use whatever Node is on your `PATH`.

Platform: Android (required assessment target).

## Installation

```bash
yarn install
```

`postinstall` runs `patch-package`, a Metro Node 21 compatibility patch, and packager setup. Node 22+ is untested.

## Running Android

```bash
yarn start       # Metro (Terminal 1)
yarn android     # debug build (Terminal 2)
```

Target a device with `yarn android --deviceId=<id>` (`adb devices`).

Other scripts: `yarn test`, `yarn lint`, `yarn clean`, `yarn release`.

## Running Tests

```bash
yarn test
npx tsc --noEmit   # no dedicated script; TypeScript is a project dependency
```

Coverage is pure domain / API-boundary Jest suites: point-in-polygon and noise filtering, zone state machine, POD visibility/validation/sanitization, local completion, outbox sync coordinator, and mock API / idempotency behavior.

## Architecture

```
Route / POD UI
    → API layer (src/api)
    → Axios client + in-process mock adapter
    → JSON fixtures (src/mock/data)

POD complete
    → MMKV-backed outbox + route progress
    → route advances immediately
    → sync coordinator (connectivity / foreground / periodic / Sync now)
    → POST mock deliveries
```

| Area            | Role                                                        |
| --------------- | ----------------------------------------------------------- |
| `src/features/` | Screens, stores, location/sync wiring                       |
| `src/domain/`   | Pure geofence, POD, outbox, sync rules                      |
| `src/api/`      | Typed HTTP boundary                                         |
| `src/mock/`     | Fixtures, parse/narrow, Axios adapter, dev failure controls |
| `src/storage/`  | MMKV helpers                                                |
| `src/types/`    | Shared domain types                                         |

Zustand + MMKV persist route progress, active-stop zone state, and the outbox. `AppProviders` bootstraps hydration, device GPS, and `initOutboxSync` so sync does not depend on the Outbox screen being mounted.

Business logic stays outside React so geofence, forms, and sync can be unit-tested without mounting screens.

## Mock API

In-process Axios adapter (`src/mock/server/mockAxiosAdapter.ts`). No real network or backend.

| Endpoint                      | Purpose                                     |
| ----------------------------- | ------------------------------------------- |
| `GET /route`                  | Route + stops + drop-zone polygons          |
| `GET /pod-templates/:id`      | POD template                                |
| `POST /routes/:id/deliveries` | Accept delivery; requires `Idempotency-Key` |

Duplicate accepted key → **409** with original `deliveryId`. Client treats that as successful sync (`duplicate: true`).

**Outbox screen controls** (intentional for reviewers):

| Mode         | Behavior                                                           |
| ------------ | ------------------------------------------------------------------ |
| Normal       | Accept deliveries                                                  |
| Network fail | Transport-style failure                                            |
| 400 fail     | Terminal 4xx                                                       |
| 500 fail     | Retryable 5xx                                                      |
| Fail first 3 | 500 for the first three attempts per idempotency key, then success |

Latency: **0ms / 500ms / 1500ms**. Controls and accepted-delivery memory are process-lifetime (in-memory).

## Geofence and location

Real Android GPS via `react-native-geolocation-service`. No geofencing library.

- Custom point-in-polygon: even-odd ray casting; boundary points count as inside; concave polygons supported
- Fixes **&lt; 10m** from the last accepted fix are ignored
- **Two consecutive** evaluated observations confirm INSIDE or OUTSIDE
- Arrive requires confirmed INSIDE
- After arrival, confirmed OUTSIDE → `DEPARTED_EARLY` (timestamp persisted); confirmed INSIDE return → `AT_STOP` and clear departure
- Zone state persists across restart

### Dev location simulator (Route screen)

Injected coordinates are driver GPS relative to the **active stop** polygon and use the **same** pipeline as real GPS.

| Control                         | Purpose                                       |
| ------------------------------- | --------------------------------------------- |
| Inject inside / outside         | First observation on that side                |
| Inject confirming fix           | Second spaced fix to confirm the pending side |
| Inject jitter (&lt;10m)         | Noise that should be ignored                  |
| Simulate depart / return inside | Outside→confirm or inside→confirm sequences   |

Repeating the same inject without a confirming fix often does nothing: the second fix must be ≥10m from the last accepted fix.

## Dynamic POD forms

Templates from the mock API. Registry maps field type → renderer (`TEXT`, `TEXTAREA`, `DROPDOWN`, `CHECKBOX`, `DATETIME`). Adding a type is a registry entry, not screen branches.

- `visibleWhen` — hidden fields skip validation and payload
- Required validation on visible supported fields only
- Unknown/malformed fields become `UNSUPPORTED` placeholders and are omitted from submit
- `tpl-exception` includes an intentional `SIGNATURE` field for unsupported-type behavior

## Offline-first completion and outbox

Completing POD **does not wait for the server**:

1. Validate visible fields → sanitize answers
2. Stable `clientDeliveryId` (idempotency key)
3. Persist outbox record → advance route locally → tear down stop geofence
4. Return to Route with **“Delivery saved locally”** / **“It will sync automatically when a connection is available.”**

Outbox states: `QUEUED` → `SYNCING` → `RETRYING` | `FAILED` | `SYNCED`.

**Triggers:** connectivity restored, app foreground, periodic (~15s), Outbox **Sync now**. Enqueue alone does **not** start an immediate sync pass; online items usually wait for the next trigger or Sync now.

**Rules:** one pass at a time; oldest eligible first; `FAILED` does not block later items; network/5xx retryable; ordinary 4xx terminal; 409-already-accepted → `SYNCED`; `retryCount` + exponential backoff (1s base); auto-retry stops after **5** failures; manual **Retry** resets the cycle; idempotency key never regenerates; stale `SYNCING` after restart → `QUEUED`.

Persisted across process death: route progress, outbox (including retry metadata), zone state, departure timestamp. Startup rehydrates stores, recovers stale `SYNCING`, and reconciles progress with the outbox.

## Reviewer scenarios

1. **Arrive** — Inject inside → Inject confirming fix → Arrive
2. **Early departure** — Arrive → Simulate depart → `DEPARTED_EARLY` banner/timer → Simulate return inside
3. **Offline** — Airplane mode / disable network → complete POD → stop advances, unsynced count rises
4. **Retry** — Outbox: 500 or Fail first 3 → Sync now → `RETRYING` / retry count / backoff
5. **Terminal then recover** — stay on 500 until retry 5 → `FAILED` → Normal → Retry → `SYNCED`

## Engineering choices

- Local-first so the driver workflow never blocks on network
- Custom geofence (assessment forbids a geofence library)
- MMKV for synchronous recovery; Zustand for small shared state
- Axios + mock adapter to keep a production-like API boundary without a backend
- Dev mock/GPS controls exposed on purpose for deterministic review

## Known limitations

- No map (out of assessment scope)
- Mock server is in-process; accepted deliveries and failure controls reset when the JS process dies
- Sync after local completion waits for a trigger (periodic / connectivity / foreground / Sync now), not an immediate enqueue-time request

## With another day

- Device/E2E automation for geofence + offline paths
- Broader outbox/retry integration tests
- Real API base URL / environment wiring
- Accessibility and polish pass
