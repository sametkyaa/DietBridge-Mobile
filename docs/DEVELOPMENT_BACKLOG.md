# DietBridge Development Backlog

## WP5.4A — Mobil Runtime Kabulü (Ertelendi)

- Manuel Android kabulünde plan, makrolar, sıralama, private fotoğraf ve completion akışları doğrulandı.
- Session restore ile daily-log empty/network-error ayrımı doğrulandı.
- Tekrarlayan `Response status 0` ile `Invalid Refresh Token: Refresh Token Not Found` hatalarının kök nedeni kesinleştirilemedi.
- WP5.4A tamamlanmadı; bu konu Stage 5 kapanışı ve yayın öncesi blocker olarak izlenecek.
- Expo Go cold reload ve Android development-build kabulü ertelendi.

## Mevcut Durum

DietBridge bu çalışma alanında danışan tarafı mobil uygulama olarak ilerliyor. Proje React Native + Expo ve JavaScript ile yazılmış durumda; MVVM ayrımı genel olarak korunmuş. Supabase client `apps/mobile/src/lib/supabaseClient.js` içinde tanımlı, veritabanı çağrıları feature bazlı `services/` dosyalarında toplanmış.

## Çalışan Özellikler

- Supabase Auth ile giriş, kayıt ve oturum yönetimi.
- Profil görüntüleme ve güncelleme akışı.
- Günlük su ve kilo kaydı.
- Günlük öğün planı okuma.
- Öğün değişikliği talebi gönderme.
- Kilo, su ve vücut ölçümü analiz verilerini okuma/kaydetme.

## Riskli Alanlar

- `meals` tablosu için RLS update policy durumu Supabase Dashboard üzerinden doğrulanmalı.
- Fotoğraf seçimi şu anda Supabase Storage'a yüklenmiyor; local URI uygulama kapanınca kalıcı değildir.
- Kalori/makro kartı halen gerçek öğün verilerinden hesaplanmıyor.
- `SettingsScreen`, `SupportScreen` ve `ChatScreen` MVP placeholder seviyesinde.
- Projede lint/test script'i yok; doğrulama şu an Expo smoke check ile sınırlı.

## İlk Çözülmesi Gereken 5 Konu

1. Öğün tamamlama DB sync: `meals.is_eaten` alanı UI ile çift yönlü uyumlu olmalı.
2. Supabase Dashboard'da `meals` RLS update/select policy kontrolü yapılmalı.
3. Öğün fotoğrafı için Supabase Storage upload akışı tasarlanmalı.
4. Kalori/makro hesaplaması gerçek öğün verilerine bağlanmalı.
5. Boş öğün planı durumunda kullanıcıya anlaşılır empty state gösterilmeli.

## Bu Turda Dokunulan Dosyalar

- `docs/HANDOFF_FROM_ANTIGRAVITY.md`
- `docs/DEVELOPMENT_BACKLOG.md`
- `AGENTS.md`
- `.env.example`
- `.gitignore`
- `apps/mobile/src/features/meals/services/mealService.js`
- `apps/mobile/src/features/meals/context/MealsContext.js`
- `apps/mobile/src/features/meals/viewmodels/useMealsViewModel.js`
- `apps/mobile/src/features/clients/viewmodels/useDashboardViewModel.js`
- `apps/mobile/src/features/clients/screens/DashboardScreen.js`
- `apps/mobile/src/features/meals/screens/MealsScreen.js`

## WP5.3C1 — Canonical Mobil Meal Plan Read Model (Tamamlandı)

- Canonical macro sözleşmesi: `protein`, `carbs`, `fat`; mobil eşleme `carbs → carbohydrate`.
- PostgreSQL zaman değeri `HH:MM:SS` biçiminden canonical `HH:MM` biçimine normalize edilir.
- WP5.3C2 kapsamında private meal photo path için signed-URL resolver hâlâ açıktır.
- Cihaz/emülatör UI kabulü WP5.4 kapsamına ertelenmiştir.

## WP5.3C2 — Private Meal Photo Resolver (Tamamlandı)

- Private `meal-photos` bucket için 5 dakikalık signed URL kullanılır.
- Resolver, 4 dakikalık in-memory cache ve eşzamanlı istek deduplication uygular.
- Yetkisiz, 404 ve Storage hataları fail-closed placeholder ile sonuçlanır.
- `photoPath`, geçici `photoUri` ve cihazdaki `completionPhotoUri` ayrı tutulur.
- Cihaz/emülatör görsel kabulü WP5.4 kapsamına ertelenmiştir.
