# UI Refresh Evidence

## P0B Pre-remediation dependency snapshot

| Dependency | `package.json` | Locked / installed |
| --- | --- | --- |
| `expo` | `^54.0.23` | `54.0.23` |
| `expo-asset` | `^12.0.10` | `12.0.10` |
| `expo-font` | `~14.0.9` | `14.0.9` |
| `expo-image-picker` | `^17.0.8` | `17.0.8` |
| `expo-linear-gradient` | `^15.0.7` | `15.0.7` |
| `expo-status-bar` | `~3.0.8` | `3.0.8` |
| `react` | `19.1.0` | `19.1.0` |
| `react-native` | `0.81.5` | `0.81.5` |
| `@supabase/supabase-js` | `^2.84.0` | `2.84.0` |
| `@react-native-async-storage/async-storage` | `^2.2.0` | `2.2.0` |
| `@react-navigation/native` | `^6.1.18` | `6.1.18` |
| `@react-navigation/bottom-tabs` | `^6.6.1` | `6.6.1` |
| `@react-navigation/native-stack` | `^6.10.1` | `6.11.0` |
| `@expo/vector-icons` | `^15.0.3` | `15.0.3` |

## Initial P0 baseline attempt — BLOCKED, later resolved by P0B

Commit: none; package did not pass.

Files: persistent state/evidence documents only; no application, package or lockfile changes.

Commands:

- `git status --short --branch`
- `git rev-parse --show-toplevel`, `git rev-parse HEAD`, `git branch --show-current`
- `git remote -v`, `git log --oneline --decorate -10`
- `git merge-base --is-ancestor d5c869c... HEAD`
- `git pull --ff-only origin main`
- UI reference clone and `git cat-file -t 8b3f115...`
- `npm ci`
- `npx expo-doctor`

Results:

- Functional base and `origin/main` matched at `d5c869c183117c3b3bc6944a580f15daa0b26196`.
- UI reference commit resolved as a commit and was checked out detached at `8b3f1159bf41a0e7b97084da29f7ce58d2373470`.
- `npm ci` succeeded (704 packages installed; audit reported 24 existing vulnerabilities).
- Expo doctor passed 17/18 checks and failed dependency validation: expected/found were `expo ~54.0.36/54.0.23`, `expo-asset ~12.0.13/12.0.10`, `expo-font ~14.0.12/14.0.9`, `expo-image-picker ~17.0.11/17.0.8`, `expo-linear-gradient ~15.0.8/15.0.7`, `expo-status-bar ~3.0.9/3.0.8`.
- `main` and the new branch were identical when the failure occurred, proving the failure belongs to the pinned baseline.
- Android export was not run because the chained baseline stopped at Expo doctor.

Reviewer findings: Read-only Explorer confirmed the route/ViewModel/service map. It flagged the reference design's five-tab shell as incompatible with the protected four-tab plus root-profile contract, confirmed that chat has no service/ViewModel contract, and identified adapter needs for meal statuses, pending locks, signed photos and progress states. No application implementation was available to review.

Resolved findings: none.

Remaining risks:

- Baseline dependency mismatch must be repaired and committed separately before restarting P0.
- Existing npm audit findings remain untriaged and were not modified in this UI task.
- Authenticated Android background/reload/token-refresh acceptance remains open.

## P0B Baseline Dependency Remediation — PASS

Commit: `a6e1818` (`chore(expo): align SDK 54 dependency patches`)

Changed: only `package.json` and `package-lock.json`; six Expo SDK 54 patch dependencies.

Commands:

- `npx expo install --check`
- `npx expo install --fix`
- `npm ci`
- `npx expo install --check`
- `npx expo-doctor`
- `npx expo export --platform android --output-dir .tmp-ui-baseline/android`
- `npx expo export --platform ios --output-dir .tmp-ui-baseline/ios`
- source/config boundary diffs and staged diff checks

Results:

- `npm ci`: PASS
- Expo dependency check: PASS (`Dependencies are up to date`)
- Expo doctor: PASS (18/18)
- Android export: PASS
- iOS export: PASS
- Application source changes: none
- Backend or production mutations: none
- React, React Native, Supabase, AsyncStorage, navigation and Vector Icons: unchanged

Reviewer findings: independent scope/contract review reported no P0, P1, P2 or P3 findings. The large lockfile diff was confirmed as consistent transitive refresh with an exact six-package direct dependency delta.

Resolved findings: Expo CLI attempted to add `expo-asset` to `app.json`; this allowlist violation was removed before validation and the final `app.json` blob matches HEAD.

Remaining risks:

- Existing npm audit findings remain out of scope (19 total after remediation).
- Authenticated Android 8+ minute background/reload/token-refresh acceptance remains open.
