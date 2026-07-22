# Manual Android Acceptance Checklist

## Android modal accessibility crash repair — pending device checks

Status: `NOT_RUN`

- [ ] A real Dashboard meal's `Öğünümü yedim` action opens the photo modal without an Android accessibility-role crash.
- [ ] Title, description, X, Android back, and backdrop close behavior work without changing meal completion.
- [ ] Gallery, camera, and no-photo completion actions retain their existing behavior and duplicate-submit guard.
- [ ] TalkBack reads the X as `Fotoğraf ekleme penceresini kapat` and focus returns to the meal completion action after dismissal.

## Android acceptance UX corrections — pending device checks

Status: `NOT_RUN`

- [ ] Dashboard: dietitian connection card is absent and Profile still presents connection information.
- [ ] Dashboard: macros, next meal, and water tracking appear in that order in the first viewport at 320×568, 360×640, 360×800, 390×844, and 412×915.
- [ ] Dashboard: macro rows do not overlap and show canonical consumed/planned values.
- [ ] Dashboard: water `ml` remains inside its input control and plus/minus actions work.
- [ ] Meal completion: the photo prompt X and Android back close without changing completion; TalkBack reads `Fotoğraf ekleme penceresini kapat` and focus returns to the completion control.
- [ ] Meal completion: skip, gallery, and camera flows remain functional without duplicate submission.
- [ ] Analysis: arm input and save/cancel are reachable while the numeric keyboard is open; the sheet scrolls as necessary.

Status: `DEVICE_UI_ACCEPTANCE_PENDING`

An authorized Android emulator (`emulator-5554`) was detected during the regression package. The application could not be launched within the five-minute non-interactive build limit after switching the terminal from Java 11 to the required Java 21; no authenticated UI scenario was claimed as passed. Automated Android/iOS exports passed; physical UI acceptance remains pending.

- [ ] Auth sign-in
- [ ] Auth sign-up
- [ ] Dashboard loading / ready / water pending / meal completion pending / error-retry
- [ ] Meals ready / empty / unlinked
- [ ] Meal detail and signed photo
- [ ] Analysis
- [ ] Profile overview and edit flows
- [ ] Health modal
- [ ] Navigation tabs
- [ ] Chat placeholder
- [ ] Settings
- [ ] Support
- [ ] Authenticated Android 8+ minute background/reload/token-refresh release acceptance
- [ ] Regression: authenticated Dashboard plan/macro display, Meals day selection, and avatar gallery/camera upload, rollback, removal, and reload persistence
- [ ] Regression: authenticated legacy/partial `meal.macros` plan loading, Dashboard macro availability, and Meal Detail absent-macro display
