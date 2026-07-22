# Manual Android Acceptance Checklist

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
