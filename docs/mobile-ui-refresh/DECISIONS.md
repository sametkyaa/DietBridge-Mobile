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

## D-008 — Publication gate separation

GitHub CLI unavailability is not a hard blocker for the engineering loop. Local implementation, build verification, independent review and package commits continue while push, draft PR and remote CI are tracked as a separate publication loop. Completed packages will not be reapplied because a publication tool is unavailable.

## D-009 — Derive dashboard nutrition from canonical completed meals

Dashboard nutrition values are presentation-only totals derived from real completed meals and the canonical `calories`, `protein`, `carbohydrate` and `fat` fields. Reference preview goals and static totals are not product data and are therefore omitted. Current-weight write ownership remains on Dashboard as established in D-003.

## D-010 — Share one meal-detail presentation

Dashboard and the meal-plan screen delegate to one `features/meals` meal-detail sheet. Dashboard keeps only a thin adapter for its presentation-shaped meal object. This avoids duplicate detail implementations while preserving signed-photo, canonical field and feature ownership boundaries.

## D-011 — Keep Analysis read-only for weight and honest for unavailable data

Current-weight entry stays on Dashboard; Analysis only reads persisted weight history. Missing weight records are not converted to 0 kg points, missing water days are not converted to persisted zeroes, and the unavailable MVP badge source is shown as empty rather than as demo achievements. Water totals do not claim a target that the analytics contract does not load.

## D-012 — Make Profile field ownership explicit

Profile shows current weight read-only and cannot write it through either the generic ViewModel payload or generic profile service. Dashboard retains the dedicated current-weight flow. E-mail remains read-only without an Auth change flow; unavailable security actions are omitted. Notification toggles are labeled as temporary device-session preferences until a persistence contract exists.
