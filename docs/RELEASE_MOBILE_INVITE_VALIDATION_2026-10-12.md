# Mobil davet akışı — runtime regresyon kanıtı

12 Ekim 2026. Branch: `codex/release-mobile-invite-validation-20261012`.
Taban: mobil main `9625e3cab97f170aad641be32f59eec694ff48c5`.

Mevcut main'deki davet akışı incelendi; üretim kaynak kodunu değiştirmeyi gerektiren hata bulunmadı. İki test dosyasında gerçek provider/ViewModel kodunu yürüten yerel regresyon kapsamı artırıldı. Servisler, Linking, storage ve hook ortamı test harness'inde taklit edilir; bu fiziksel React Native/OS kabul testi değildir.

- Yeni `inviteFlowRuntime.test.cjs`: 7 test; giriş öncesi cold link saklanır, giriş sonrası sheet açılır; açık uygulamada HTTPS/custom scheme açılır; kötü origin/protocol/code/query reddedilir; geciken eski initial URL yeni linki ezmez; logout/account değişimi doğru userId'ye bağlanır; kapatma/tamamlamada pending kod temizlenir; unmount sonrası async yazma olmaz.
- `inviteViewModel.test.cjs`: 3 yeni test; kapalı/eski/hız sınırına takılmış kod profil veya bağlantı üretmez; bozuk kod API'ye gitmez; giriş sonrası önizleme bağlantıyı otomatik kaydetmez, açık onay gerekir.
- Önceki davet sözleşmesi ve ViewModel testleri dahil hedefli kapsam: 21 test geçti.

## Kontroller

`npm run quality` başarılı: typecheck; lint 0 hata/41 mevcut uyarı; 521 Node testi geçti/0 hata; Expo config; Android ve iOS JavaScript export. `git diff --check` başarılı. Loglar audit dizininde `release-invite-mobile-{targeted,quality}.log`.

Webin geçici yerel Supabase runtime'ı ayrıca 35 sunucu kontrolünden geçti: anonim/yanlış rol reddi, aktif ilişki izolasyonu, explicit redeem, eski kodun yenilemeyle geçersizliği, closed, ortak deneme limiti, idempotency ve son kapasite yarışında tek kazanan. Bu mobil UI'nin fiziksel cihaz üzerinde gerçek HTTP testi değildir.

Güncel main'in tüm sağlık/sohbet migration'larıyla hazırlanan ek disposable audit runtime'ı 42 kontrolden geçti. Davet sözleşmesi, özel öğün etiketinin mobil sorguyla okunması, plan bildirimi bayrağı/ilişki alanları ve kalıntısız temizlik doğrulandı. Log: `release-current-contract-runtime.log`. Bu test Edge fonksiyonlarını veya OS association'ı çalıştırmaz.

## Süre sonu ve kalan kabul

Mevcut davet sözleşmesinde `expires_at` veya tarih bazlı TTL yok. Kullanıcının süre dolmuş senaryosu için mevcut üründeki karşılıklar yenilenen eski kodun `not_found` ve kapatılmış kodun `closed` olmasıdır; bu durumlar doğrulandı. Deneme kayıtlarının 24 saat sonra temizlenmesi davet kodunun son kullanma süresi değildir. TTL bu göreve yeni özellik olarak eklenmedi.

OS verified link, uygulama kurulu değilken web fallback, giriş/signup ardından davetin sürmesi, imzalı güncel Android/iPhone kabulü açık. Giriş veya hukuki kabul tamamlanmadan bağlantı ekranının açılmaması App.js ana akışı üzerinden incelendi; OS/device kabulü yapılmış sayılmaz.

Bu branch test/dokümantasyon içerir; sohbet/auth/servis üretim kodu değişmedi. Öğün/bildirim branch'iyle dosya çakışması yok. Yeni paket/migration, production erişimi/yazması, commit/push/PR/merge/deploy yok. Çalışma ağacı bu görev dosyalarıyla kirli. İnceleme sonrası iki mobil mantıksal birim ayrı PR olarak sunulabilir; mevcut #29 körlemesine birleştirilmemeli.
