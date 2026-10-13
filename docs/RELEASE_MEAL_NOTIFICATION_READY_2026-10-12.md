# Öğün ve bildirim uyumluluğu — güncel main doğrulaması

12 Ekim 2026. Branch: `codex/release-meal-notification-ready-20261012`.
Taban: mobil main `9625e3cab97f170aad641be32f59eec694ff48c5`; sohbet #36 dahil.

## Sonuç

Önceki çalışma alanındaki gerekli öğün/bildirim değişiklikleri kaynak dosyaları değiştirilmeden güncel main tabanına taşındı. Önce/sonra SHA-256 karşılaştırması eşit. Eski `codex/release-mobile-compat-20261012` branch'i ve asıl kullanıcı checkout'u korundu. `RELEASE_MOBILE_COMPAT_2026-10-12.md` önceki taban ve APK'ye ait tarihsel kanıttır; bu rapor güncel tabanın doğrulamasıdır.

- `meals.slot_label` ana sayfa, plan listesi ve detayda görünür. Etiket yoksa/geçersizse mevcut öğün türü kullanılır; tür değiştirilmez.
- Eski sunucuya dönüş yalnız `42703`/`PGRST204` kodlu, `slot_label` alanını belirten eksik kolon hatasında yapılır. Yetki, ağ, farklı kolon ve ilişki hataları gizlenmez; danışan/diyetisyen/tarih filtreleri korunur.
- `meal_plan/updated`, `meal_plan_updated` uygulama içi bildirimi tanınır. Yalnız aynı aktif ilişki için Öğünler açılır. Push göndericisi veya yeni select kolonları eklenmedi.
- Güncel hukuki kabul, sağlık saklama koruması ve birleşmiş sohbet kaynakları korundu.

## Eski mobil #29

Üç yönlü salt okunur simülasyonda `RegisterView.js`, `authService.js` ve `useAuthViewModel.js` metinsel çakışıyor. `AuthScreen.js` ve `mealService.js` iki tarafta değişmiş olsa da metinsel çakışma işareti yok; davranış düzeyinde yine incelendi. Eski checkbox/`kvkkAccepted` yaklaşımı, güncel `LegalAcceptanceFields`/`kvkkAcknowledged`, kalıcı kabul doğrulaması ve korumalı route akışının yerine geçirilmedi. Eski #29 bütün olarak birleştirilmemeli; bu dar branch onun gerekli öğün/bildirim kısmının yerine geçer. #29 henüz kapatılmadı; yeni değişiklikler onaylanıp birleştirildikten sonra superseded olarak kapatılabilir.

## Gerçekten çalıştırılan kontroller

| Kontrol | Sonuç |
| --- | --- |
| `npm ci --ignore-scripts` | Başarılı; package/lockfile değişmedi |
| `npm run quality` / typecheck | Başarılı |
| Lint | 0 hata, 41 mevcut uyarı |
| Node test | 522 geçti, 0 hata; 6 slot etiketi ve 5 plan bildirimi testi dahil |
| Expo public config | Başarılı |
| Android / iOS JavaScript export | İkisi başarılı |
| Güncel migration zinciriyle geçici yerel Supabase sözleşmesi | 42 kontrol geçti; özel etiket, mobil sorgu ve gated plan bildirimi dahil |
| `git diff --check` | Başarılı |

Yerel build loopback Supabase URL ve test yer tutucusuyla alındı. Log: `C:/dev/DietBridge-Release-Audit/2026-10-12/release-compat-quality.log`. Kaynak envanteri ve hash'ler: aynı dizindeki `release-ready-manifest.json`.

Ek `release-current-contract-runtime.log` testi kaynak main'deki tüm migration'ları (sağlık ve sohbet medya dahil) ve bir mevcut yerel bucket önkoşulunu ayrı disposable ortamda kurdu. Gerçek haftalık kayıt RPC'si etiketi kırptı/korudu; mobilin tam scoped projection'ı etiketi ve `snack` türünü okudu. Bildirim üreticisi varsayılan kapalıydı; yalnız yerel testte açılınca aynı hafta tek satır üretti ve mobilin beklediği ilişki/summary alanları eşleşti. Test bayrağı tekrar kapandı; test verileri ve ortam temizlendi. Edge deploy veya medya upload bu ek testin kapsamında değildir.

## Açık kapılar ve yetki kaydı

Bu güncel taban için imzalı APK/AAB/IPA veya fiziksel cihaz kabulü yapılmadı. Önceki APK sohbet #36'yı içermez ve güncel tabanın native kanıtı sayılmaz. Yeni paketle özel öğün adı, bildirime dokunma, bağlantısı kaldırılmış eski bildirim, sağlık tercihleri ve sohbet regresyonu cihazda denenmeli.

Production DB/Storage/Edge/feature flag değişikliği ve production sorgusu yapılmadı. Migration oluşturulmadı veya production'da çalıştırılmadı. Bu branch için DB migration'ı gerekmiyor; mevcut sunucu sözleşmesi korunuyor. Plan bildirimi üreticisini etkinleştirmek ayrı onaylı yayın adımıdır.

Commit, push, PR açma, merge ve deploy yapılmadı. Çalışma ağacı görev dosyalarıyla kirli; değişiklikler incelemeye hazır. Mevcut 45 mobil audit bildirimi (22 yüksek/23 orta) bu görevde giderilmedi; paket yükseltmesi yapılmadı. Tam dosya listesi ve sonraki yedekleme/sohbet sunucu geçişi ön koşulları ortak `RELEASE_COMPAT_INVITE_READY_2026-10-12.md` raporundadır.
