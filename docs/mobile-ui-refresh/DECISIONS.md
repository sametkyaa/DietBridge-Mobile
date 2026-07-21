# UI Refresh Decisions

## D-001 — Keep all existing route contracts

The current root, auth and tab route names are functional contracts used by existing navigation callbacks. The UI reference is visual-only and will not replace the navigation root.

## D-002 — Repair baseline drift only through the authorized P0B package

P0 found Expo SDK patch mismatches in the untouched base and correctly stopped. The follow-up P0B authorization aligned only the six reported Expo SDK 54 patch dependencies; no general dependency upgrade was performed.

## D-003 — Preserve current-weight ownership

When work resumes, the working current-weight save entry remains on Dashboard. Analysis stays read-only for weight and generic Profile save must not gain current-weight ownership.

## D-004 — Honest deferred features

Real chat remains a placeholder until its service exists. Legal terms and unavailable security actions remain deferred rather than being represented by fake local behavior.

## D-005 — Preserve status distinctions and Supabase boundary

Meal `unlinked` remains distinct from `empty`; retrying remains visible. Screens and presentational components will consume ViewModels/contexts only. Existing service-layer Supabase calls, completion RPC, canonical meal mapping and signed-photo resolver remain authoritative.

## D-006 — Remain on Expo SDK 54

The baseline issue was patch-level package drift, not a requirement for an SDK major/minor upgrade. React, React Native, navigation, Supabase, auth/session, configuration and application source were preserved.

## D-007 — Adapt reference primitives to the existing host contracts

The reference theme/component filenames were retained under `shared/theme` and `shared/components/ui`. Theme import depth was adapted for the target layout, typography uses the already-loaded Inter families, semantic foreground tokens were darkened for accessible text contrast, and skeleton instances share one animation loop. Existing `fonts.js` and `styles.js` remain unchanged for incremental migration.
