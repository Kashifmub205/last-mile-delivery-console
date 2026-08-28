# Last-Mile Delivery Console

Offline-first React Native assessment app for a courier working a route of stops. Three screens: **Route**, **Proof of Delivery**, and **Outbox**.

## Prerequisites

- **Node 20** (recommended). See [Node version](#node-version) below.
- **Yarn**
- **Android Studio** + JDK — [React Native environment setup](https://reactnative.dev/docs/set-up-your-environment)
- Physical Android device or emulator with USB debugging enabled

iOS is not required for this assessment.

## Run on Android

Terminal 1 — Metro:

```bash
yarn install
yarn start
```

Terminal 2 — install debug build on device/emulator:

```bash
yarn android
```

If multiple devices are connected, target one explicitly:

```bash
yarn android --deviceId=<device-id>
```

List devices:

```bash
adb devices
```

### Other scripts

```bash
yarn clean    # clear Android build cache
yarn release  # assemble release APK (android/app/build/outputs/apk/release/)
yarn test     # Jest
yarn lint     # ESLint
```

## Node version

This project targets **React Native 0.82** with **Node 20**.

- `.nvmrc` pins Node 20. If you use nvm: `nvm use` before starting Metro.
- `package.json` engines: `>=20 <22`
- `yarn start` and `yarn android` run through `scripts/with-nvm.sh` to apply `.nvmrc` automatically on macOS/Linux with nvm installed.
- After `yarn install`, a postinstall step patches Metro for **Node 21** compatibility (`scripts/patch-metro-node21.sh`) and fixes the auto-packager launcher (`scripts/setup-packager.sh`).

If Metro fails with a `styleText` / `format` error, switch to Node 20:

```bash
nvm use 20
yarn start
```

Node 22+ is untested.

## Tech stack

| Concern | Choice |
|---------|--------|
| Navigation | React Navigation Native Stack |
| State | Zustand (planned) |
| Persistence | MMKV (`src/storage/`) |
| Connectivity | NetInfo (planned) |
| Location | react-native-geolocation-service (planned) |
| API | Axios + local mock service (planned) |
| Forms | Custom registry-driven renderer (planned) |
| IDs | react-native-uuid (planned) |

No Redux, React Query, Formik, geofencing libraries, maps, or UI kits.

## Architecture

```
src/
├── api/              HTTP client boundary
├── constants/        App, sync, geofence tuning
├── domain/           Pure business logic (geofence, sync, pod rules)
├── features/         Screens: route, pod, outbox, location (dev tools)
├── mock/             Route JSON, POD templates, fake server (planned)
├── navigation/       Typed stack navigator
├── storage/          MMKV wrapper + JSON helpers
├── types/            Route, outbox, zone, POD domain types
└── theme.ts          Assessment palette, spacing, typography
```

**Boundary rule:** screens render state and dispatch intent; domain/services own behavior. Geofence, sync, and form rules must be testable without mounting React.

## Persistence (MMKV)

Route progress, active stop zone state (`AT_STOP` / `DEPARTED_EARLY`), and the full outbox (including retry metadata and stable idempotency keys) will be persisted in MMKV via `src/storage/`.

On startup, persisted state is recovered before it is treated as authoritative. Items left in `SYNCING` after a force-quit are eligible for a safe retry with the same idempotency key.

Storage keys live in `src/storage/keys.ts`.

## Mock API (planned)

No production backend. The app will call a local mock implementing:

| Endpoint | Purpose |
|----------|---------|
| `GET /route` | Route document with stops and drop zones |
| `GET /pod-templates/:id` | Proof-of-delivery template |
| `POST /routes/:id/deliveries` | Submit delivery; honors `Idempotency-Key` (`409` = already accepted) |

Dev controls for latency and forced failures will be documented here once implemented.

## Current status

**Done**

- React Native CLI + TypeScript project
- Navigation shell (Route / POD / Outbox placeholders)
- Domain types in `src/types/`
- MMKV storage wrapper in `src/storage/`
- Theme tokens aligned with the assessment brief
- Android debug build verified

**Not yet implemented**

- Zustand stores wired to persistence
- Offline outbox + sync manager (sequential, backoff, idempotency)
- Geofence state machine + point-in-polygon
- GPS noise filtering + dev location simulator
- Dynamic POD form registry
- Mock API + seed data
- Full screen UI and README sections for sync algorithm, geofence strategy, and trade-offs

These will be added incrementally with matching commits.

## Trade-offs (so far)

- **MMKV over AsyncStorage** — synchronous reads on startup for outbox/zone recovery without async hydration races.
- **Zustand over Redux** — shared state across route/outbox/sync without boilerplate for a small three-screen app.
- **Custom sync engine** — assessment evaluates retry classification, ordering, and idempotency directly.
- **Node 20 pin + Metro patch** — RN 0.82 Metro is unreliable on Node 21; patch keeps reviewers on Node 21 unblocked after `yarn install`.

## With another day

- Domain unit tests for geofence, sync, and form sanitization
- Full README walkthrough of offline scenario and simulated GPS
- Release signing docs for APK distribution
