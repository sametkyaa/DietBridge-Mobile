# Mobil yayın hazırlığı: öğün ve bildirim uyumluluğu

12 Ekim 2026. Branch: `codex/release-mobile-compat-20261012`.
Başlangıç: güncel `origin/main`, `d10b7c148a0f618a09a25a3645d79e2156d628f7`.

## Amaç ve değişiklik

Açık #29 PR'ındaki eksik öğün adı ve uygulama içi plan bildirimi desteği güncel main'e taşındı. Eski PR'ın kayıt/checkbox değişiklikleri alınmadı; #34/#35 sağlık tercihi ve cache davranışı korundu.

- Diyetisyenin `meals.slot_label` alanı ana sayfa, öğün listesi ve detayda gösterilir. Geçersiz veya bulunmayan etiket mevcut öğün türü adına döner.
- Kolon bulunmayan eski sunucuda yalnız `42703`/`PGRST204` ve `slot_label` hatası eski sorguya geçer. Yetki, ağ, ilişki veya başka kolon hatası gizlenmez. İki sorguda da danışan/diyetisyen/tarih filtreleri korunur.
- `meal_plan/updated` uygulama içi bildirimi desteklenir; yalnız halen aktif, aynı danışan-diyetisyen ilişkisi için Öğünler ekranını açar. Push göndericisi eklenmedi.

15 kaynak/mevcut test dosyası ve iki yeni test değişti. Dosya bazlı SHA-256 manifesti repository dışında `C:/dev/DietBridge-Release-Audit/2026-10-12/mobile-compat-source-manifest.json` içindedir. Bu belge native build kaynak yüklemesinden sonra yazıldı; uygulama kodunu değiştirmez.

## Çalıştırılan kontroller

| Komut/kontrol | Sonuç |
| --- | --- |
| `npm ci --ignore-scripts` | Başarılı; lockfile değişmedi |
| İki yeni test dosyası: `node --test` | 11 test başarılı |
| `npm run test` | 502 test başarılı |
| `npm run typecheck` | Başarılı |
| `npm run lint` | 0 hata, 41 mevcut uyarı |
| `npm run expo:config` | Başarılı |
| `npm run export:android` | Başarılı |
| `npm run export:ios` | Başarılı |
| `git diff --check` | Başarılı |

Yerel exportlarda sağlık tercihi UI bayrağı `true`; yalnız derleme için yerel Supabase URL/yer tutucu anahtar kullanıldı. Bu değerler kaynak veya EAS ortamına yazılmadı. EAS preview build, mevcut preview ortamının gerçek istemci yapılandırmasını kullanır.

## Android native build ve kabul

Mevcut EAS Android imzasını değiştirmeden `--freeze-credentials`, `--non-interactive`, `--no-wait`, `--profile preview`, `--platform android` ile internal APK istendi.

[EAS build f93784f5-8417-4b43-bf5b-7c59a5b11a27](https://expo.dev/accounts/samet_app/projects/dietbridge/builds/f93784f5-8417-4b43-bf5b-7c59a5b11a27)

Build 12 Ekim 2026 10:39 Türkiye saatiyle `FINISHED` oldu. [Yeni APK](https://expo.dev/artifacts/eas/BELfdfCc_XtYzAXqJF9VOHLSVMyo-OqIzJ0Bi86Zvuw.apk), 104.332.966 byte. `apksigner verify --verbose --print-certs` başarılı; imza webde hazırlanan Android association dosyasıyla eşleşiyor. `aapt dump badging`: `com.dietbridge.app`, versionName `1.0.0`, versionCode `1`, minSdk `24`, targetSdk `36`. Bu internal APK'dir; mağaza AAB'si değildir.

Build'in Git metadata'sı başlangıç main commit'ini gösterir. Henüz commit edilmemiş uyumluluk kodunun yüklenen kaynak kimliği yukarıdaki manifesttir; native build sonrasında 17 hash yeniden kontrol edilip aynı bulundu. Native sonuç ve APK imza doğrulaması `mobile-compat-native-evidence.json`, `mobile-compat-apk-signature.log` ve `mobile-compat-apk-badging.log` içinde repository dışında kaydedildi. APK içindeki bundle ayrıca beklenen Supabase proje alanını ve yeni slot/bildirim kodunu içeriyor; yerel derleme yer tutucusu içermiyor. Hiçbir anahtar rapora çıkarılmadı. Telefon testi henüz yapılmadı.

Telefon kabulü henüz yapılmadı. Yeni APK'de giriş/oturum geri yükleme, onboarding, özel öğün adları, bildirimden Öğünler'e geçiş, su/kilo, fotoğraf/sohbet ve şifre kurtarma denenmeli. Etkin sağlık saklama/paylaşma/geri çekme senaryoları ayrıca onaylı test ortamı gerektirir: production sunucu bayrağı kapalıdır, APK UI bayrağının açık olması bunu etkinleştirmez.

## Yetki, çalışma ağacı ve kalanlar

Production DB/Storage yazması yapılmadı; migration oluşturulmadı/çalıştırılmadı. Commit, push, PR, merge veya mağaza gönderimi yapılmadı. Çalışma ağacı yalnız bu aşamanın dosyalarıyla kirli; kullanıcının asıl checkout'u korunuyor.

Yeni paket veya major yükseltme yok. Mevcut 45 mobil audit bulgusu ayrı değerlendirme aşamasında; bu değişiklik onları gidermiş sayılmaz. Plan bildirimi üreticisi ve sağlık koruması production'da etkinleştirilmedi. Cihaz kabulü bu aşamanın kalan kapısıdır.

Android ve iOS ilk yayında hedefleniyor. Play Console/Apple Developer hesapları onay beklediğinden production AAB, Play internal testing, Apple imzası, IPA/TestFlight ve iPhone kabulü hesaplara bağlı sonraki aşamadır.
