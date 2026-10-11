# Yayın öncesi mobil düzeltmeler

Taban: a29deda4417cc8742c8e769c35c6860b5ea0b50f. Çalışma dalı: codex/release-preparation.
Hazırlık dalları: codex/release-mobile-legal ve codex/release-dependency-patches.

Yeni kayıtta Kullanım Koşulları kabulü ve KVKK aydınlatmasının okunduğunun bildirimi ayrı, başlangıçta işaretsiz alanlardır. İkisi tamamlanmadan kayıt isteği gönderilmez. Supabase Auth metadata'sına mevcut handle_new_user trigger'ının desteklediği terms_accepted ve kvkk_accepted değerleri gönderilir.

Mevcut danışanın profilindeki terms_accepted_at/kvkk_accepted_at eksikse kayıt tamamlama ekranı açılır. Mevcut accept_legal_terms RPC'si kullanılır; kalıcı zaman damgaları tekrar okunmadan korumalı uygulamaya, push kaydına ve danışan veri provider'larına erişim açılmaz. Şifre kurtarma ve danışan rol kontrolü korunur. Yeni DB/RLS şeması yoktur.

Bu teknik kayıt; sağlık verisinin işlenmesi için hukuki dayanak, gerektiğinde ayrı açık rıza, yurt dışı aktarım usulü veya metinlerin hukuki uygunluğu hakkında karar vermez. Mevcut backend belge sürümü saklamaz; sürümlü kabul kanıtı ayrı bir backend tasarımı gerektirir.

## Doğrulama

- Temiz npm ci --ignore-scripts, typecheck, lint ve test başarılı.
- 444 test başarılı; lint: 0 hata, 40 uyarı.
- Birleşik kaynak Android JS export başarılı. Hukuki düzeltme dalında Android/iOS JS exportları başarılı.
- Bağımlılık dalında Expo Doctor: 18/18 başarılı.
- npm audit: başlangıç 1 kritik/31 yüksek/20 orta; kontrollü yamalar sonrası 0 kritik/22 yüksek/23 orta. Audit sıfır değildir.
- Expo/RN/React Navigation major sürümleri değiştirilmedi. package.json yalnız hedefli PostCSS 8.5.29 ve image-size 2.x→2.0.4 override'ları içerir. image-size 1.x farklı API'si nedeniyle zorla 2.x yapılmadı.

## Fiziksel Android kabul kaydı

Kullanıcı, development ve preview paketlerini kendi Android telefonunda denediğini ve çoğu özelliğin çalıştığını bildirdi. Denenen kesin build ID'si, cihaz modeli ve adım sonuçları verilmedi; bu beyan otomatik/bağımsız test sonucu değildir.

EAS geçmişinde tamamlanmış preview build 00a61caa-4d7a-4de3-a17f-771b11227e2b (2026-10-10, bu taban SHA) ve development build c2c2a79d-c24b-4de1-84e6-6d3cfbd87b05 mevcut. Kullanıcının denediği paketle kesin eşleşme kurulmadı.

İlk native deneme 49c012d2-6dec-4f58-9ea5-5cc59b6c6b44, npm ci'da eksik @emnapi/core/runtime lock kayıtları nedeniyle başarısız oldu. Node 24.17.0/npm 11.13.0 Linux ortamında lockfile normalize edildi: yalnız iki eksik 1.11.3 kaydı eklendi, mevcut paket sürümleri değişmedi. Linux npm ci ve ardından Windows npm ci/typecheck/lint/test/Android export tekrar başarılı.
Yeni düzeltmeli Android preview build: https://expo.dev/accounts/samet_app/projects/dietbridge/builds/94596a86-2cbd-476b-b7fd-9cc1c1340861
Durum: FINISHED; 11 Ekim 2026 10:45:46 UTC. Gerçek APK artifact'i mevcut; sürüm 1.0.0, versionCode 1. İlk lockfile hatası giderildi; son native build başarılı. Bu yeni paketin fiziksel telefon testi hâlâ bekliyor. RELEASE_ANDROID_BUILD_EVIDENCE.json ve audit dizinindeki mobile-build-source-manifest.json kaynak kimliğini kaydeder.
Public mağaza yayını ve EAS Submit yapılmadı. Preview build üretim Play AAB kabul testinin yerine geçmez.

Yeni paketle aşağıdaki adımlar kayıt altına alınmalı:

| İşlem | Beklenen sonuç | Durum |
|---|---|---|
| Metro kapalıyken APK'yi açma/uygulamayı yeniden başlatma | Uygulama bağımsız açılır, oturum güvenli biçimde geri gelir | Bekliyor |
| Onaylı test ortamında kabul kutularını boş/tek işaretli bırakma | Kayıt gönderilmez; iki belge erişilebilir | Bekliyor |
| Onaylı test hesabıyla başarılı kayıt | Backend iki gerçek zaman damgasını saklar; hata sahte başarı sayılmaz | Bekliyor |
| Kabul kaydı olmayan test hesabıyla giriş | Kabul ekranı; başarısız RPC'de bu ekranda kalma; yeniden deneme/çıkış | Bekliyor |
| Şifre sıfırlama bağlantısı | Şifre kurtarma kabul ekranına takılmadan tamamlanır | Bekliyor |
| Migration sonrasında 00:00–02:59 kilo kaydı | Mobil/web aynı İstanbul tarihini gösterir; aynı gün tek ölçüm | Bekliyor |
| Fotoğraf, sohbet, randevu ve öğün tamamlama | Gönderim kalıcıdır; yeniden açınca kayıt görünür | Kullanıcının eski paket beyanı; yeni paket bekliyor |
| Bildirim izni kabul/red ve uygulama kapalı bildirim | İzin ve cihaz yapılandırmasına uygun davranış | Bekliyor |

Onaylı test ortamı dışında yeni sahte kullanıcı/veri oluşturulmadı. Telefon testi kullanıcı tarafından yapılmalıdır. Android production AAB'yi Google Play internal testing kanalından denemek için uygulamanın herkese yayınlanması gerekmez. iOS IPA/fiziksel iPhone testi yapılmadı.

Kaynaklar: [Expo APK](https://docs.expo.dev/build-reference/apk/), [Expo internal distribution](https://docs.expo.dev/tutorial/eas/internal-distribution-builds/), [Android production/internal testing](https://docs.expo.dev/tutorial/eas/android-production-build/).
