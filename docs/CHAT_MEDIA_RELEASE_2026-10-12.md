# Mobil sohbet medya hazırlığı — 12 Ekim 2026

Durum: kaynak kod ve yerel kontroller hazır. Bu değişiklikler henüz kullanıcının telefonundaki APK'ya veya production'a dağıtılmadı.

Branch: `codex/chat-media-20261012`; başlangıç main commit'i `d10b7c148a0f618a09a25a3645d79e2156d628f7`. Önceki `codex/release-mobile-compat-20261012` çalışma ağacı ve kullanıcı tarafından denenmiş paket korunuyor. Başka branch'in değişiklikleri kendiliğinden birleştirilmedi.

## Değişiklik

- Mevcut kamera/galeri görsel gönderimi aktif ChatScreen/ViewModel üzerinden açıldı. Kaynak görsel en fazla 20 MiB; mevcut sıkıştırma çıktısı JPEG, 4 MiB/2048 piksel sınırında kalıyor.
- SDK 54 uyumlu `expo-document-picker ~14.0.8` (MIT) ile MP4/MOV/WebM (20 MiB) ve PDF/DOCX/XLSX/TXT/CSV (10 MiB) seçimi eklendi. Tek gönderimde bir ek ve isteğe bağlı açıklama var.
- Veriye erişim services katmanında. ViewModel yüklemeyi yönetir; ekran UI bağlantısını kurar. Hatalı dosya/bağlantı başarılı mesaj gibi gösterilmez; retry aynı clientMessageId ve intent'i kullanır. Yerel picker önbelleği temizlenir.
- Özel dosya URL'si tıklanınca 5 dakika için üretilir, desteklenen işletim sistemi görüntüleyicisi/tarayıcısı açılır. Oturum/izin yenilemesi eski sonucu geçersiz kılar.
- Sohbet ilk yüklendiğinde ve sekmeye yeniden girildiğinde son mesaj konumlanır. Eski mesajları okumaya başlayan kullanıcı aşağı zorlanmaz. Sayfalama korunur.
- Tek gri tik sunucuya gönderim, çift gri tik istemci teslim kaydı, çift mavi tik görünür okuma kaydıdır. Web migration'ı gönderenin karşı taraf receipt'ini okuyabilmesini düzeltir.

## Sunucu bağımlılığı ve yayın

Web repository'sindeki `20261012080237_chat_media_and_rate_limits.sql` ve `validate-chat-media`, `cleanup-chat-images`, `delete-client-account` dağıtımları gerekir. Genel medya bayrağı migration'da kapalı başlar; eski sunucuda yeni picker fail-closed gizlenir, mevcut JPEG yolu korunur.

Sunucu kullanıcı başına 5 ek/dakika, 30 ek/saat, 100 MiB/saat ve 300 MiB/son 24 saat rezervasyon kotası; tüm mesajlar için 30/dakika, 200/saat uygular. İptal edilen rezervasyonlar da sayılır. Format kontrolü antivirüs taraması değildir. Daha önce indirilmiş dosya veya henüz süresi bitmemiş imzalı bağlantı uzaktan geri alınamaz.

Native picker için yeni APK/AAB ve IPA build gerekir; JS export veya OTA yeterli değildir. Yeni paket hazırlanırken önceki ayrı mobil uyumluluk düzeltmelerinin korunacağı sürüm onaylı şekilde belirlenmelidir. Android preview APK mağaza hesabı beklemeden denenebilir; imzalı iOS testi Apple hesabı/imzalama hazırlığını bekler. Aktif kullanıcıların eski APK'sı genel medyayı okuyamayacağından sunucu bayrağını açmadan sürüm uyumluluğu kararı gerekir.

## Kontroller / görev sonu

- `npm ci --ignore-scripts`, `npx expo install expo-document-picker --ignore-scripts`, `npm run quality`, `git diff --check` ve Git durum kontrolü çalıştırıldı.
- Typecheck başarılı. Lint: 0 hata, mevcut 41 uyarı. PR incelemesinin 10 yeni regresyon testiyle birlikte 511 test başarılı. Expo config, Android ve iOS JS export başarılı (~4.46 MB JS bundle; APK/IPA boyutu değildir).
- Paket kurulumunun npm taraması 45 bildirim (22 yüksek, 23 orta) verdi. Bunlar 45 kullanılabilir mağaza uygulaması açığı anlamına gelmez; ayrı bağımlılık değerlendirmesi gerekiyor. Toplu `audit fix --force` uygulanmadı.
- Yeni testler gerçek servis modülünü stub'larla boyut/kota, iptal/retry, yetkisiz descriptor için; gerçek liste bileşenini layout/focus/data sıraları ve kullanıcı kaydırması için çalıştırır. Webin geçici Supabase testi gerçek dosya/video/JPEG, receipt, erişim ve kota akışlarını doğrular.
- PR incelemesinde picker açıkken ek alanının kilitlenmesi, yeniden açılan/sayfalanan geçmişte gerçek dosya adının okunması ve medya tamamlanmasında mevcut/ortak reconciliation isteğinin beklenmesi düzeltildi. Sohbet değişince eski isteğin yeni sohbete kaydırma etkisi engellenir.
- Kanıt: `C:\dev\DietBridge-Release-Audit\2026-10-12\chat-mobile-quality.log`; sunucu ve web kanıtları aynı klasörde.
- İnceleme sonrası güncel kanıt: `chat-review-mobile-quality.log`; aynı klasörde eski kodda hatayı gösteren `chat-review-*-before.log` dosyaları bulunur.
- Yerel hazırlık doğrulamasında çalışma ağacında yalnız görev değişiklikleri vardı. Kullanıcı 12 Ekim 2026'da commit/push ve iki PR açılmasını onayladı; merge ve production dağıtımı bu onayın kapsamında değil. Tam dosya envanteri webdeki `docs/CHAT_MEDIA_CHANGED_FILES_2026-10-12.md` belgesinde.
- Mobil repository'de migration oluşturulmadı/çalıştırılmadı. Production verisi veya Storage'a yazılmadı. Web migration'ı yalnız geçici yerel ortamda test edildi.
- Çalıştırılmayan: yeni imzalı APK/AAB/IPA, fiziksel cihaz kabulü ve production dağıtımı. Kullanıcının daha önceki APK testi bu yeni medya özelliği için fiziksel test kanıtı değildir.
- Manuel kabul: kamera/galeri, Android/iOS belge sağlayıcıları, MP4/MOV, Office/PDF/metin, iptal/çevrimdışı/retry, iki platform arası tikler, uzun sohbet/klavye/sekme dönüşü, izin iptali ve hesap silme.
- Sonraki aşama: onaylı Git/sunucu yayın sırası, ardından önceki uyumluluk düzeltmelerini koruyan yeni mobil build ve cihaz kabulü. Kapsam dışı refactor, paket major yükseltmesi ve mağaza başvurusu yapılmadı.

Ayrıntılı yayın/geri dönüş planı: web `docs/CHAT_MEDIA_RELEASE_2026-10-12.md`. Kaynaklar, production preflight/postflight ve yerel runtime harness web repository'sinde sürümlenmiştir.
