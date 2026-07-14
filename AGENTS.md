# DietBridge Agent Rules

- This repository is the DietBridge client mobile app, not GroundLess.
- Keep the React Native + Expo structure.
- Use JavaScript only. Do not convert files to TypeScript.
- Keep the existing MVVM architecture.
- Supabase access belongs in `services/` files only.
- Screens should contain UI composition and user interaction wiring only.
- ViewModels should own screen state and business logic.
- Do not add unnecessary dependencies.
- Do not perform broad or unrelated refactors.
- Keep UI text in Turkish.
- Prefer English for code, function names, and technical comments.
- Preserve MVP stability over architectural churn.
- Do not solve Supabase Dashboard tasks such as RLS, Email login, or Storage bucket policy in app code; report them as manual checks.
