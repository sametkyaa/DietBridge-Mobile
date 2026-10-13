# GitHub sürüm eşitleme — 13 Ekim 2026

Bu görev, yayımlanan Android 1.0.3 (5) kaynaklarının GitHub'a aktarılması ve doğrulamadan sonra main'e birleştirilmesidir. Kullanıcı commit/push ve ayrıca main'e birleştirmeyi açıkça istedi.

Branch: `codex/release-sync-20261013-mobile`; taban `9625e3cab97f170aad641be32f59eec694ff48c5`. Kaynak çalışma alanı `C:/dev/DietBridge-Mobile-Short-Invite`; kullanıcının diğer çalışma alanlarının değişiklikleri korunur.

Yayımlanmış öğün etiketi/plan bildirimi uyumluluğu, bildirim izni kurtarma ve bildirim dokunma akışı, sağlık tercihlerini kayıt/Ayarlar'a taşıma, doğrulanmamış e-posta mesajı ve kısa kodun otomatik biçimlenmesi birlikte sürüm kaynaklarını oluşturur. Mevcut eski #29 PR'ının güncel hukuki kabul akışını geri alabilecek kayıt kodu birleştirilmez; gerekli öğün/bildirim davranışı bu kaynakta korunur.

İnceleme düzeltmeleri: package.json ve lockfile kök sürümü Expo 1.0.3 ile eşitlendi; bağımlılık sürümleri değiştirilmedi. GitHub quality workflow'u `EXPO_PUBLIC_ENABLE_HEALTH_CONSENT=true` ile mevcut production EAS profiline eşlendi. Yeni native paket oluşturulmaz; Play Console'daki yayımlanmış paket hâlâ 1.0.3 (5).

Yerel doğrulama: `EXPO_PUBLIC_ENABLE_HEALTH_CONSENT=true npm run quality` başarılı; typecheck başarılı, lint 0 hata/41 mevcut uyarı, 569/569 test başarılı, Expo config ve Android/iOS export başarılı. `git diff --check` başarılı. Gönderilecek dosyalarda private key, Supabase secret, GitHub token, AWS key ve JWT literal taraması bulgu vermedi; bu kontrol kapsamlı güvenlik denetimi değildir.

Bu görevde production DB/Auth/Storage yazması, migration oluşturma/uygulama veya RLS değişikliği yapılmadı. Kısa kod migration'ı önceki onaylı yayında web repository'sinden uygulandı. Android remote versionCode EAS tarafından yönetilir; yerel başlangıç sayısı mevcut remote sürümün yerine kullanılmaz.

GitHub'daki Mobile Quality Gate sonucu PR kontrolünde doğrulanır. Fiziksel cihaz klavyesi, bildirim izni ve gerçek doğrulama e-postasıyla giriş manuel kontrol olarak kalır; iOS native IPA oluşturulmadı. Sonraki aşama: `codex/post-release-validation`.

Dosya kapsamı: `App.js`, `app.json`, `app.config.js`, package/lockfile, mobile quality workflow'u; auth, healthConsent, dietitianConnection, onboarding, push, notifications, meals ve ilgili dashboard/profil/ayarlar bileşenleri, servisleri ve testleri; yayın raporları. Ayrı konu commit'leri GitHub PR dosya listesini izlenebilir tutar.
