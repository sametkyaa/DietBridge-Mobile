# Screen Integration Matrix

| Route | Current screen | ViewModel / state owner | Existing services / contexts | Kimi UI counterpart | Contracts to preserve | State mapping | Integration | Manual test |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Login | `AuthScreen` | `useAuthViewModel` | `authService` | `LoginView`, `RegisterView` | Sign-in/up callbacks, role validation, forgot-password navigation | loading/error/mode | Pending P7 | Pending |
| ForgotPassword | `ForgotPasswordScreen` | `useForgotPasswordViewModel` | `authService` | `ForgotPasswordView`, success view | Reset callback, back/login navigation | idle/loading/success/error | Pending P7 | Pending |
| MainTabs / Ana Sayfa | `DashboardScreen` | `useDashboardViewModel` | `MealsContext`, `DietitianConnectionContext`, `clientService`, `dailyLogService`, `mealService`, read model | `HomeView` and home components | Daily log, water/weight, completion RPC, signed photos, connection approval/rejection, retries, Profile/Settings/Support navigation | daily-log plus plan loading/retrying/success/empty/unlinked/error | Pending P3 | Pending |
| MainTabs / Öğünler | `MealsScreen` | `useMealsViewModel` | `MealsContext`, `DietitianConnectionContext`, `mealService`, `mealChangeRequestService` | `MealPlanView`, `MealDetailView` | Seven-day selection, canonical ordering, signed image, detail/grocery/request/photo flows | loading/retrying/success/empty/unlinked/error | Pending P4 | Pending |
| MainTabs / Analiz | `AnalysisScreen` | `useAnalyticsViewModel` | `DietitianConnectionContext`, `analyticsService` | `ProgressView` and progress components | Weight/measurement/water/badge data and measurement save | loading/ready/empty/locked/error | Pending P5 | Pending |
| MainTabs / Sohbet | `ChatScreen` | `DietitianConnectionContext` | connection service constants | `EmptyMessagesView` only | Active-dietitian guard; no fake messages/composer | loading/locked/coming-soon | Pending P8 | Pending |
| Profile | `ProfileScreen` | `useProfileViewModel` | `clientService`, connection context, profile catalogs, image picker | `ProfileView` and edit views | Signed avatar/upload, specialized saves, validation, sign-out, back navigation | loading/error/edit pending/success | Pending P6 | Pending |
| Settings | `SettingsScreen` | Local presentation only | None | Shared shell/status patterns | Existing content and back navigation; no fake security actions | ready | Pending P8 | Pending |
| Support | `SupportScreen` | Local presentation only | None | Shared shell/status patterns | Existing content and back navigation | ready | Pending P8 | Pending |

## Protected application shell

- `App.js`: auth/session lifecycle, providers and `NavigationContainer`.
- `RootNavigator`: `MainTabs`, `Profile`, `Settings`, `Support`.
- `AuthNavigator`: `Login`, `ForgotPassword`.
- `MainTabs`: `Ana Sayfa`, `Öğünler`, `Analiz`, `Sohbet`.
