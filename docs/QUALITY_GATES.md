# Mobile automated quality gate

Node.js 24 LTS ve npm 11 ile:

```bash
npm ci
npm run typecheck
npm run lint
npm run test
npm run expo:config
npm run export:android
npm run export:ios
```

`npm test`, aktif Mobile meal, water, appointments, Chat, Notifications, shared date/measurement ve Push 6C.1 testlerini tek koşumda keşfeder. Push testleri gerçek Expo token, permission prompt, EAS project, Firebase, FCM veya APNs istemez.

`src_backup`, `lib_backup`, `.expo`, `dist` ve dependency cache'leri production kaynak zincirinde değildir; typecheck/lint bu generated/backup yollarını dışarıda bırakır. Android/iOS export çıktıları `dist/` altında üretilir ve commit edilmez.

GitHub Actions job/check adı `Mobile Quality Gate` olarak sabittir. Workflow Node 24 kullanır, token yetkisini `contents: read` ile sınırlar ve yalnız local sentaktik Supabase placeholder'ları tanımlar; Production secret/veri kullanılmaz.

`npm audit` mevcut Expo SDK 54/Metro toolchain'inde transitive borç raporlar. MVP-11 içinde major Expo yükseltmesi veya `npm audit fix --force` yapılmaz; bu bulgular ayrı dependency-upgrade aşamasında ele alınır.
