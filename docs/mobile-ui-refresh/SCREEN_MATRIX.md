# Screen Integration Matrix

| Route | Current screen | ViewModel / state owner | Existing services / contexts | Kimi UI counterpart | Contracts to preserve | State mapping | Integration | Manual test |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Login | `AuthScreen` | `useAuthViewModel` | `authService` | `LoginView`, `RegisterView` | Sign-in/up callbacks, role validation, forgot-password navigation | loading/error/mode | Integrated / P7 PASS | Physical-device acceptance pending |
| ForgotPassword | `ForgotPasswordScreen` | `useForgotPasswordViewModel` | `authService` | `ForgotPasswordView`, success view | Reset callback, back/login navigation | idle/loading/success/error | Integrated / P7 PASS | Physical-device acceptance pending |
| MainTabs / Ana Sayfa | `DashboardScreen` | `useDashboardViewModel` | `MealsContext`, `DietitianConnectionContext`, `clientService`, `dailyLogService`, `mealService`, read model | `HomeView` and home components | Daily log, water/weight, completion RPC, signed photos, connection approval/rejection, retries, Profile/Settings/Support navigation | daily-log plus plan loading/retrying/success/empty/unlinked/error | Integrated / P3 PASS | Physical-device acceptance pending |
| MainTabs / Öğünler | `MealsScreen` | `useMealsViewModel` | `MealsContext`, `DietitianConnectionContext`, `mealService`, `mealChangeRequestService` | `MealPlanView`, `MealDetailView` | Seven-day selection, canonical ordering, signed image, detail/grocery/request/photo flows | loading/retrying/success/empty/unlinked/error | Integrated / P4 PASS | Physical-device acceptance pending |
| MainTabs / Analiz | `AnalysisScreen` | `useAnalyticsViewModel` | `DietitianConnectionContext`, `analyticsService` | `ProgressView` and progress components | Weight/measurement/water/badge data and measurement save | loading/retrying/ready/empty/locked/error | Integrated / P5 PASS | Physical-device acceptance pending |
| MainTabs / Sohbet | `ChatScreen` | `DietitianConnectionContext` | connection service constants | `EmptyMessagesView` only | Active-dietitian guard; real connection retry; no fake messages/composer | loading/error/locked/coming-soon | Integrated / P8 PASS | Physical-device acceptance pending |
| Profile | `ProfileScreen` | `useProfileViewModel` | `clientService`, connection context, profile catalogs, image picker | `ProfileView` and edit views | Signed avatar/upload, specialized saves, validation, sign-out, back navigation | loading/error/edit pending/success | Integrated / P6 PASS | Physical-device acceptance pending |
| Settings | `SettingsScreen` | Local presentation only | None | Shared shell/status patterns | Existing content and back navigation; no fake security actions | honest unavailable | Integrated / P8 PASS | Physical-device acceptance pending |
| Support | `SupportScreen` | Local presentation only | None | Shared shell/status patterns | Existing content and back navigation | honest unavailable | Integrated / P8 PASS | Physical-device acceptance pending |

## Protected application shell

- `App.js`: auth/session lifecycle, providers and `NavigationContainer`.
- `RootNavigator`: `MainTabs`, `Profile`, `Settings`, `Support`.
- `AuthNavigator`: `Login`, `ForgotPassword`.
- `MainTabs`: `Ana Sayfa`, `Öğünler`, `Analiz`, `Sohbet`.

P2 navigation shell status: PASS. The four tab routes and their screen bindings are unchanged; semantic icons, theme tokens, a single bottom-inset calculation and explicit Turkish accessibility labels are integrated.

P3 dashboard status: PASS. Real plan, completion, signed-photo, water, weight and dietitian-connection contracts are integrated through the existing ViewModel/context/service boundaries; no preview or mock success data was introduced.

P4 meal-plan status: PASS. A single vertical list preserves seven local dates, serialized real-plan loading, status distinctions, signed photos, detail, honest grocery output, change requests and resolved-photo preview without fabricating completion or recipe actions.

P5 analytics status: PASS. Weight remains read-only, real weight/measurement/water records drive the presentation, measurement saves stay in the ViewModel/service chain, and unavailable badge data is represented honestly as empty.

P6 profile status: PASS. Overview, dietitian, personal/goals, lifestyle, health/nutrition, temporary notification preferences, signed avatar, dirty/error/pending and logout flows are integrated through their existing specialized callbacks.

P7 auth status: PASS. Login, registration and password-reset presentations use the shared visual system while preserving the single-screen mode model, auth callbacks, safe error mapping, phone metadata, reset edit/resend behavior and frozen session/navigation lifecycle.

P8 placeholder status: PASS. Chat distinguishes loading, connection error with real retry, locked and active-but-coming-soon states without a fake messaging surface. Settings and Support retain only their existing content and back navigation in a shared honest placeholder shell.
