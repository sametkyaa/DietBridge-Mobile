# DietBridge Mobile UI Refresh Master Plan

## Pinned inputs

- Functional base: `d5c869c183117c3b3bc6944a580f15daa0b26196`
- UI reference: `8b3f1159bf41a0e7b97084da29f7ce58d2373470`
- Working branch: `codex/mobile-ui-refresh`
- Architecture: React Native + Expo, JavaScript, MVVM; Supabase access remains in services.

## Package sequence

| Package | Scope | Depends on | Primary acceptance |
| --- | --- | --- | --- |
| P0 | Bootstrap, state, contract map, baseline | Pinned repositories | Clean base, reference verified, `npm ci`, Expo doctor, Android export |
| P0B | Expo SDK 54 patch remediation | P0 baseline diagnosis | Only six approved Expo packages; doctor and Android/iOS exports pass |
| P1 | Theme tokens and shared UI primitives | P0 | No dependency or production-screen changes; Android export |
| P2 | Bottom-tab navigation shell | P1 | Existing route names and screen bindings preserved |
| P3 | Dashboard | P2 | Real daily-log, plan, completion, signed-photo, connection and retry flows preserved |
| P4 | Meals and meal detail | P3 | Week/status/detail/grocery/request/photo flows preserved |
| P5 | Analysis / progress | P4 | Real analytics data and save callbacks preserved |
| P6 | Profile subpackages | P5 | Existing specialized profile callbacks and avatar flow preserved |
| P7 | Auth visual refresh | P6 | Auth/session lifecycle and routes unchanged |
| P8 | Honest placeholder screens | P7 | No fake chat or unavailable actions |
| P9 | Cross-screen QA and narrow cleanup | P8 | State, accessibility, source-boundary and Android/iOS export checks |
| P10 | Independent final reviews and PR | P9 | No P0/P1 findings; push and ready-for-review PR |

## Baseline package versions

Recorded from `package.json` / `package-lock.json` at the pinned base: Expo `54.0.23`, React Native `0.81.5`, React `19.1.0`, Supabase JS `2.84.0`, React Navigation native `6.1.18`, bottom tabs `6.6.1`, native stack `6.10.1`.

## Current gate

P0B repaired the authorized Expo SDK 54 patch drift without changing the SDK major/minor, protected dependencies, configuration or application source. P0 and P0B are complete; the loop resumes at P1.
