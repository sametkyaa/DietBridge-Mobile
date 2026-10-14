# Mobil hata açıklamaları ve gösterim sözleşmesi

15 Ekim 2026. Branch: codex/mobile-error-onboarding. Değişiklik öncesindeki kaynak listesi: [Hata envanteri](MOBILE_ERROR_INVENTORY_20261015.md).

## Kullanıcıya gösterim

198 sabit, uygulamaya ait açıklama/kod çifti tanımlandı. Mevcut servislerin iç sonuç kodları, retryability bilgileri ve yetkilendirme davranışları korunur. Kullanıcıya gösterilen DB- kodları destek için ayrı bir sunum katmanıdır.

- İşlem hataları DietBridge renkleriyle, güvenli alanları gözeten, kaydırılabilir bir hata kartında açılır. Kaydırılabilir açıklama, seçilip kopyalanabilen kod ve mevcut işlem düğmeleri gösterilir. Klavye hata penceresini örtemesin diye açılmadan önce kapatılır.
- Form hataları ilgili alanın altında, sayfa yükleme hataları ortak ErrorState kartında, diğer küçük hatalar InlineAlert alanında gösterilir. Başarı ve işlem onayı davranışları korunur.
- Bilinmeyen sunucu mesajları, SQL, token, kimlik ve e-posta gibi bilgiler kullanıcıya taşınmaz. Bilinen kod veya incelenmiş uygulama metni eşlenir; diğerleri bağlama uygun güvenli varsayılan açıklamayı alır.
- Kodsuz ama bilinen yerel mesajlar ayrı DB- kodlarına eşlenir. Uygulamaya ait sınırlı alan adları ve sayısal aralıklar güvenli biçimde korunur. Aynı hata metni iki kez formatlanınca kod tekrarlanmaz.
- Pasif aynı hatalar art arda pencere açmaz. İşlem düğmelerinin callback'leri bir kez çalışır; hesabın değişmesi önceki hesaba ait bekleyen pencereleri temizler.

## Şifre, kayıt ve başlangıç

Kayıt ekranındaki açıklama: “Şifren en az 6 karakter olmalı. Daha güçlü bir şifre için büyük ve küçük harf, rakam ve özel karakter kullanmanı öneririz.”

Minimum 6 karakter mevcut repository Supabase yapılandırmasıyla uyumludur; büyük/küçük harf, rakam ve sembol öneridir. Supabase daha güçlü kurallar uygularsa weak_password nedenleri ayrı açıklanır: length, characters, pwned. Sunucunun bildirdiği daha yüksek minimum korunur. Canlı Auth ayarları bu görevde okunmadı/değiştirilmedi; yayın öncesinde görünen kural ile canlı politika eşleşmesi kontrol edilmelidir. Mevcut hesabın giriş şifresine yeni minimum kural uygulanmaz.

Sağlık onayı özelliği açıkken kayıt için hem saklama/işleme hem paylaşma onayı gerekir. Kayıt ekranı düğmesi yanında ViewModel ve servis de denetler. Başlangıç onay ekranında yalnız kutuları işaretlemek yetmez: iki onayın kaydedilmiş olması, güncel kayıt ve hatasız yükleme gerekir. Ayarlar ekranından sonradan rızayı geri almak korunur. Onboarding'in soru adımlarına tekrar onay kutusu eklenmez.

Onboarding'in önceki adım düğmesi ve Android geri tuşu aynı geri dönüşü kullanır. Girilen form değerleri korunur. Kaydetme sırasında geri gitme engellenir; Bitir/Atla/Kapat akışları çalışır. RootNavigator'daki mevcut gestureEnabled:false korunur.

## Başlıca backend eşlemeleri

| Backend kodu / durumu | Açıklama kodu |
|---|---|
| invalid_credentials | DB-AUTH-INVALID-CREDENTIALS |
| email_address_invalid | DB-AUTH-EMAIL-INVALID |
| email_not_confirmed | DB-AUTH-EMAIL-UNCONFIRMED |
| email_exists / user_already_exists | DB-AUTH-EMAIL-EXISTS |
| weak_password, length | DB-AUTH-PASSWORD-SHORT |
| weak_password, characters | DB-AUTH-PASSWORD-CHARACTERS |
| weak_password, pwned | DB-AUTH-PASSWORD-LEAKED |
| same_password | DB-AUTH-PASSWORD-SAME |
| session_expired / session_not_found / refresh_token_* | DB-AUTH-SESSION-EXPIRED |
| otp_expired / bad_code_verifier / flow_state_expired | DB-AUTH-RECOVERY-INVALID |
| over_request_rate_limit / over_email_send_rate_limit / HTTP 429 | DB-RATE-LIMITED |
| Network request failed / AuthRetryableFetchError | DB-NETWORK-UNAVAILABLE |
| timeout / AbortError / TIMED_OUT | DB-REQUEST-TIMEOUT |
| HTTP 5xx | DB-SERVICE-UNAVAILABLE |

Auth eşlemeleri [Supabase'in resmi hata kodları](https://supabase.com/docs/guides/auth/debugging/error-codes) ile kontrol edildi. Belirsiz validation_failed kodu tek başına e-posta hatası sayılmaz.

## Tam açıklama listesi

| Gösterilen kod | Güvenli açıklama |
|---|---|
| DB-MEASURE-001 | Aksiyon için oturum açmalısınız. |
| DB-MEASURE-002 | Analiz verileri yüklenemedi. Lütfen tekrar deneyin. |
| DB-MEASURE-003 | Kaydetmek için en az bir ölçü giriniz. |
| DB-MEASURE-004 | Lütfen 0 ile 500 cm arasında geçerli ölçüler giriniz. |
| DB-MEASURE-005 | Ölçüler kaydedilirken bir sorun oluştu. |
| DB-MEASURE-006 | Lütfen 20 ile 500 kg arasında geçerli bir kilo giriniz. |
| DB-MEASURE-007 | Kilonuz kaydedilemedi. Lütfen tekrar deneyin. |
| DB-APPOINTMENT-001 | Randevular yüklenemedi. Lütfen tekrar deneyin. |
| DB-APPOINTMENT-002 | Geçersiz randevu tarih/saat bilgisi. |
| DB-APPOINTMENT-003 | Geçerli bir tarih bulunamadı. |
| DB-APPOINTMENT-004 | Geçersiz randevu tarihi. |
| DB-APPOINTMENT-005 | Geçersiz randevu saati. |
| DB-APPOINTMENT-006 | Geçersiz randevu kaydı. |
| DB-APPOINTMENT-007 | Randevu sahipliği doğrulanamadı. |
| DB-APPOINTMENT-008 | Randevu sahibi doğrulanamadı. |
| DB-APPOINTMENT-009 | Geçersiz randevu başlığı. |
| DB-APPOINTMENT-010 | Geçersiz randevu durumu. |
| DB-APPOINTMENT-011 | Geçersiz randevu süresi. |
| DB-AUTH-001 | Hesap silme işlemi için geçerli bir oturum bulunamadı. |
| DB-AUTH-002 | Hesap doğrulanamadı. Lütfen tekrar giriş yapın. |
| DB-AUTH-003 | Hesap silme durumu doğrulanamadı. Lütfen tekrar deneyin. |
| DB-AUTH-004 | Hesap silme isteği doğrulanamadı. Lütfen tekrar giriş yapın. |
| DB-AUTH-005 | Hesap silme işlemi henüz tamamlanamadı. Lütfen tekrar deneyin. |
| DB-AUTH-006 | Hesap silme işlemi doğrulanamadı. Lütfen tekrar deneyin. |
| DB-AUTH-007 | Bu uygulama danışan kullanımı içindir. Diyetisyen paneline web uygulamasından giriş yapabilirsiniz. |
| DB-AUTH-008 | Kullanıcı profili bulunamadı. |
| DB-AUTH-009 | E-posta veya şifre hatalı. |
| DB-AUTH-010 | Bir sorun oluştu. Lütfen tekrar deneyin. |
| DB-AUTH-011 | Şifreniz güncellenemedi. Lütfen yeni bir sıfırlama bağlantısı isteyin. |
| DB-AUTH-012 | Şifreniz güncellenemedi. Lütfen tekrar deneyin. |
| DB-AUTH-013 | Mevcut şifreniz hatalı. |
| DB-AUTH-014 | Yeni şifreniz yeterince güçlü değil. Lütfen daha güçlü bir şifre deneyin. |
| DB-AUTH-015 | Yeni şifreniz mevcut şifrenizden farklı olmalıdır. |
| DB-AUTH-016 | Oturum doğrulanamadı. Lütfen tekrar giriş yapın. |
| DB-AUTH-017 | Bekleyen hesap silme işlemi tamamlanmadan uygulamaya devam edilemez. |
| DB-AUTH-018 | Hesap silme işlemi henüz tamamlanamadı. Aynı hesapla tekrar giriş yaparak yeniden deneyebilirsiniz. |
| DB-AUTH-019 | Hesabınız silindi ancak bu cihazdaki oturum temizliği tamamlanamadı. |
| DB-AUTH-020 | E-posta adresin henüz doğrulanmadı. Gelen kutundaki doğrulama bağlantısına dokunup ardından tekrar giriş yap. E-postayı bulamazsan spam veya gereksiz klasörünü kontrol et. |
| DB-AUTH-021 | Devam etmek için Kullanım Koşulları’nı kabul edin ve KVKK Aydınlatma Metni’ni okuduğunuzu belirtin. |
| DB-AUTH-022 | Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş. Lütfen yeni bir bağlantı isteyin. |
| DB-AUTH-023 | Lütfen tüm alanları doldurun. |
| DB-AUTH-024 | Lütfen ad soyad alanını doldurun. |
| DB-AUTH-025 | Şifreler eşleşmiyor. |
| DB-AUTH-026 | Bir hata oluştu. Lütfen tekrar deneyin. |
| DB-AUTH-027 | Lütfen geçerli bir e-posta adresi girin. |
| DB-AUTH-028 | Lütfen e-posta adresinizi girin. |
| DB-AUTH-029 | Sağlık verisi tercihlerin henüz kaydedilmedi. Seçimlerini kontrol edip Tercihleri kaydet’e dokun, ardından tekrar devam et. Rıza vermeden devam etmek için kutuları boş bırakarak kaydedebilirsin. |
| DB-AUTH-030 | Bilgiler kaydedilemedi. Lütfen tekrar deneyin. |
| DB-AUTH-031 | Çıkış yapılamadı. Lütfen tekrar deneyin. |
| DB-AUTH-032 | Lütfen yeni şifrenizi girin. |
| DB-AUTH-033 | Lütfen yeni şifrenizi tekrar girin. |
| DB-CHAT-001 | Teslim durumu şu anda güncellenemedi. |
| DB-CHAT-002 | Dosya seçilemedi. Video en fazla 20 MB, belge en fazla 10 MB olabilir. |
| DB-CHAT-003 | Okunma durumu şu anda güncellenemedi. |
| DB-CHAT-004 | Dosya seçilemedi. |
| DB-CHAT-005 | Dosya veya açıklama bilgisi geçersiz. |
| DB-CHAT-006 | Dosya yükleme izni doğrulanamadı. |
| DB-CHAT-007 | Seçilen dosya değişti. Yeniden seçin. |
| DB-CHAT-008 | Dosya okunamadı. |
| DB-CHAT-009 | Mesaj sonucu doğrulanamadı. |
| DB-CHAT-010 | Bu dosya kullanılamıyor. |
| DB-CHAT-011 | Dosya açılamadı. Erişiminizi kontrol edip tekrar deneyin. |
| DB-CHAT-012 | Sohbet işlemi şu anda tamamlanamadı. Lütfen tekrar deneyin. |
| DB-CHAT-013 | Görsel okunamadı. Lütfen başka bir dosya deneyin. |
| DB-CHAT-014 | Görsel boyutları geçersiz. Lütfen başka bir dosya deneyin. |
| DB-CHAT-015 | Görsel çok büyük. Lütfen daha küçük bir görsel seçin. |
| DB-CHAT-016 | Görsellere erişim izni verilmedi. Lütfen izin verin ve tekrar deneyin. |
| DB-CHAT-017 | Görsel bilgisi geçersiz. Lütfen tekrar deneyin. |
| DB-CHAT-018 | Çok fazla bekleyen görsel var. Lütfen biraz sonra tekrar deneyin. |
| DB-CHAT-019 | Görsel gönderim süresi doldu. Lütfen görseli yeniden seçin. |
| DB-CHAT-020 | Görsel doğrulaması tamamlanamadı. Lütfen daha sonra tekrar deneyin. |
| DB-CHAT-021 | Görsel gönderim kaydı bulunamadı. |
| DB-CHAT-022 | Yüklenen görsel bulunamadı. Lütfen yeniden deneyin. |
| DB-CHAT-023 | Görsel güvenli biçimde doğrulanamadı. Lütfen başka bir görsel seçin. |
| DB-CHAT-024 | Görsel boyutları izin verilen sınırı aşıyor. |
| DB-CHAT-025 | Görsel doğrulanırken geçici bir sorun oluştu. Lütfen tekrar deneyin. |
| DB-CHAT-026 | Görsel doğrulaması şu anda tamamlanamadı. Lütfen tekrar deneyin. |
| DB-CHAT-027 | Görsel yüklenemedi. Lütfen tekrar deneyin. |
| DB-CHAT-028 | Görsel işlemi beklenmeyen bir yanıt döndürdü. Lütfen tekrar deneyin. |
| DB-CHAT-029 | Bağlantı kurulamadı. İnternet bağlantınızı kontrol edip tekrar deneyin. |
| DB-CHAT-030 | Görsel işlemi şu anda tamamlanamadı. Lütfen tekrar deneyin. |
| DB-CHAT-031 | Görsel göndermek için önce bir metin mesajı gönderin. |
| DB-CHAT-032 | Görsel gönderme özelliği henüz kullanıma açık değil. |
| DB-CHAT-033 | Dosya adı okunamadı. |
| DB-CHAT-034 | MP4, MOV, WebM, PDF, DOCX, XLSX, TXT veya CSV dosyası seçin. |
| DB-CHAT-035 | Mesaj metni geçersiz. |
| DB-CHAT-036 | Mesaj metni boş olamaz. |
| DB-CHAT-037 | Güvenli mesaj kimliği oluşturulamadı. Lütfen tekrar deneyin. |
| DB-PROFILE-001 | Lütfen eklemek istediğiniz bilgiyi girin. |
| DB-PROFILE-002 | Bu bilgi zaten seçili. |
| DB-PROFILE-003 | DietBridge hesabınız ve danışan hesabınıza bağlı veriler kalıcı olarak silinecek. Bu işlem geri alınamaz. |
| DB-PROFILE-004 | DietBridge hesabından çıkış yapmak istiyor musunuz? |
| DB-PROFILE-005 | Profil bilgileri bulunamadı. |
| DB-PROFILE-006 | Danışan profil bilgileri bulunamadı. |
| DB-PROFILE-007 | Kullanıcı oturumu bulunamadı. |
| DB-PROFILE-008 | Bu uygulama yalnızca danışan profilleri içindir. |
| DB-PROFILE-009 | Profil bilgilerine ulaşılamadı. |
| DB-PROFILE-010 | Profil fotoğrafı kaydedilemedi. Lütfen tekrar deneyin. |
| DB-PROFILE-011 | Uyku süresi sayısal olmalıdır. |
| DB-PROFILE-012 | Minimum uyku maksimum uykudan büyük olamaz. |
| DB-PROFILE-013 | Lütfen 0.5 ile 10 litre arasında geçerli bir değer girin. |
| DB-PROFILE-014 | Lütfen 0 ile 24 saat arasında geçerli bir değer girin. |
| DB-PROFILE-015 | Güncel kilo boş bırakılamaz. |
| DB-PROFILE-016 | Yüklenecek profil fotoğrafı bulunamadı. |
| DB-PROFILE-017 | Profil fotoğrafı JPEG, PNG veya WebP olmalıdır. |
| DB-PROFILE-018 | Profil fotoğrafı en fazla 5 MB olabilir. |
| DB-PROFILE-019 | Profil fotoğrafı silinemedi. Lütfen tekrar deneyin. |
| DB-PROFILE-020 | Günlük kayıt bilgilerine ulaşılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin. |
| DB-PROFILE-021 | Günlük kayıt bilgileri şu anda yüklenemedi. |
| DB-PROFILE-022 | Su miktarı kaydedilemedi. Lütfen tekrar deneyin. |
| DB-PROFILE-023 | Geçerli öğün ID bulunamadı. |
| DB-PROFILE-024 | Öğün durumu güncellenemedi. Lütfen internet bağlantınızı kontrol edip tekrar deneyin. |
| DB-PROFILE-025 | Lütfen geçerli bir kilo giriniz. |
| DB-PROFILE-026 | Kaydetme işlemi devam ediyor. |
| DB-PROFILE-027 | Profil fotoğrafı seçilemedi. Lütfen tekrar deneyin. |
| DB-PROFILE-028 | Profil bilgileri yüklenemedi. Lütfen tekrar deneyin. |
| DB-PROFILE-029 | Bazı profil seçenekleri yüklenemedi. Lütfen tekrar deneyin. |
| DB-PROFILE-030 | Lütfen tüm şifre alanlarını doldurun. |
| DB-PROFILE-031 | Ayarlar yüklenemedi. Lütfen tekrar deneyin. |
| DB-INVITE-001 | Bu özelliği kullanmak için aktif bir diyetisyen bağlantınız olmalı. |
| DB-INVITE-002 | İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin. |
| DB-INVITE-003 | Bu bağlantı isteği artık geçerli değil. |
| DB-INVITE-004 | Zaten aktif bir diyetisyen bağlantınız var. |
| DB-INVITE-005 | Kod bulunamadı. Diyetisyeninizden kodu kontrol etmesini isteyin. |
| DB-INVITE-006 | Çok fazla deneme yaptınız. Lütfen daha sonra tekrar deneyin. |
| DB-INVITE-007 | Diyetisyeninizin danışan kontenjanı şu anda dolu. |
| DB-INVITE-008 | İşlem tamamlanamadı. Lütfen tekrar deneyin. |
| DB-GROCERY-001 | Oturumunuz doğrulanamadı. Lütfen tekrar giriş yapın. |
| DB-GROCERY-002 | Ürün adı 1–120 karakter olmalıdır. |
| DB-GROCERY-003 | Alışveriş listesi yüklenemedi. Lütfen tekrar deneyin. |
| DB-GROCERY-004 | Alışveriş listesi güncellenemedi. Lütfen tekrar deneyin. |
| DB-GROCERY-005 | Alışveriş listesi veri sözleşmesi doğrulanamadı. |
| DB-CONSENT-001 | Bu bilgiyi diyetisyenine göndermek için Ayarlar’daki sağlık verisi paylaşım tercihini onayla. |
| DB-CONSENT-002 | Sağlık verisi tercihlerini kontrol edin. |
| DB-MEAL-001 | Öğün durumu güncellenemedi. |
| DB-MEAL-002 | Lütfen en az bir öğün seçiniz. |
| DB-MEAL-003 | Lütfen bir mesaj veya talep yazınız. |
| DB-NOTIFICATION-001 | Bildirim görünümü geçersiz. |
| DB-NOTIFICATION-002 | Bildirim okunamadı. Lütfen tekrar deneyin. |
| DB-NOTIFICATION-003 | Bildirim açılamadı. Lütfen tekrar deneyin. |
| DB-NOTIFICATION-004 | Bildirimler okunamadı. Lütfen tekrar deneyin. |
| DB-NOTIFICATION-005 | Bildirimler şu anda yüklenemedi. Lütfen tekrar deneyin. |
| DB-NOTIFICATION-006 | Oturumunuz doğrulanamadı. Lütfen yeniden giriş yapın. |
| DB-NOTIFICATION-007 | Bildirim bilgisi geçersiz. Lütfen tekrar deneyin. |
| DB-APP-001 | Bu bağlantı cihazınızda açılamadı. Lütfen daha sonra tekrar deneyin. |
| DB-APP-002 | Geçerli bir gün farkı bulunamadı. |
| DB-APP-003 | Geçerli bir hafta günü bulunamadı. |
| DB-APP-004 | 1–9999 ml arasında geçerli bir miktar girin. |
| DB-APP-005 | Günlük su kaydı geçersiz. |
| DB-GENERAL-FAILED | İşlem tamamlanamadı. Lütfen tekrar dene. |
| DB-LOAD-FAILED | Bilgiler yüklenemedi. Bağlantını kontrol edip tekrar dene. |
| DB-NETWORK-UNAVAILABLE | Sunucuya ulaşılamadı. İnternet bağlantını kontrol edip tekrar dene. |
| DB-REQUEST-TIMEOUT | İşlem beklenenden uzun sürdü. Bağlantını kontrol edip tekrar dene. |
| DB-SERVICE-UNAVAILABLE | Hizmet şu anda yanıt veremiyor. Biraz sonra tekrar dene. |
| DB-RATE-LIMITED | Kısa sürede çok fazla deneme yapıldı. Biraz bekleyip tekrar dene. |
| DB-AUTH-EMAIL-REQUIRED | E-posta adresini gir. |
| DB-AUTH-EMAIL-INVALID | Geçerli bir e-posta adresi gir. Örnek: ad@ornek.com |
| DB-AUTH-PASSWORD-REQUIRED | Şifreni gir. |
| DB-AUTH-PASSWORD-SHORT | Şifren en az 6 karakter olmalı. |
| DB-AUTH-PASSWORD-CONFIRM-REQUIRED | Şifreni doğrulama alanına tekrar gir. |
| DB-AUTH-PASSWORD-MISMATCH | Şifreler eşleşmiyor. Her iki alana aynı şifreyi gir. |
| DB-AUTH-PASSWORD-WEAK | Şifre güvenlik koşullarını karşılamıyor. Daha uzun, büyük ve küçük harf, rakam ve özel karakter içeren bir şifre dene. |
| DB-AUTH-PASSWORD-CHARACTERS | Şifrende gereken karakter türleri eksik. Büyük ve küçük harf, rakam ve özel karakter kullan. |
| DB-AUTH-PASSWORD-LEAKED | Bu şifre bilinen veri sızıntılarında yer alıyor. Başka ve benzersiz bir şifre seç. |
| DB-AUTH-PASSWORD-SAME | Yeni şifren mevcut şifrenden farklı olmalı. |
| DB-AUTH-CURRENT-PASSWORD-INVALID | Mevcut şifren hatalı. Kontrol edip tekrar gir. |
| DB-AUTH-NAME-REQUIRED | Adını ve soyadını gir. |
| DB-AUTH-INVALID-CREDENTIALS | E-posta veya şifre hatalı. Bilgilerini kontrol edip tekrar dene. |
| DB-AUTH-EMAIL-UNCONFIRMED | E-posta adresin henüz doğrulanmadı. Gelen kutundaki doğrulama bağlantısına dokunup ardından tekrar giriş yap. Spam klasörünü de kontrol et. |
| DB-AUTH-EMAIL-EXISTS | Bu e-posta adresiyle zaten hesap var. Giriş yapabilir veya şifreni sıfırlayabilirsin. |
| DB-AUTH-SESSION-EXPIRED | Oturumun sona erdi. Tekrar giriş yap. |
| DB-AUTH-RECOVERY-INVALID | Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş. Yeni bir bağlantı iste. |
| DB-AUTH-DISABLED | Bu giriş veya kayıt yöntemi şu anda kullanılamıyor. Biraz sonra tekrar dene. |
| DB-AUTH-SIGNUP-FAILED | Hesap oluşturulamadı. Bağlantını kontrol edip tekrar dene. |
| DB-AUTH-LOGIN-FAILED | Giriş tamamlanamadı. Bağlantını kontrol edip tekrar dene. |
| DB-AUTH-RESET-FAILED | Şifre sıfırlama e-postası gönderilemedi. Biraz sonra tekrar dene. |
| DB-AUTH-PASSWORD-UPDATE-FAILED | Şifre güncellenemedi. Oturumunu kontrol edip tekrar dene. |
| DB-LEGAL-ACCEPTANCE-REQUIRED | Devam etmek için Kullanım Koşulları’nı kabul et ve KVKK Aydınlatma Metni’ni okuduğunu belirt. |
| DB-HEALTH-STORAGE-REQUIRED | Devam etmek için sağlık verilerinin işlenmesi ve saklanması onayını ver. |
| DB-HEALTH-SHARING-REQUIRED | Devam etmek için sağlık verilerinin bağlı diyetisyeninle paylaşılması onayını ver. |
| DB-HEALTH-CONFIRMATION-REQUIRED | Devam etmek için iki sağlık onayını da verip Tercihleri kaydet’e dokun. |
| DB-HEALTH-CONFIRMATION-FAILED | Sağlık onayları doğrulanamadı. Tercihlerini kaydedip tekrar dene. |
| DB-PROFILE-VALUE-INVALID | Bu alan için geçerli bir değer gir. |
| DB-PROFILE-VALUE-REQUIRED | Bu alan boş bırakılamaz. |
| DB-PROFILE-VALUE-RANGE | Bu alan için belirtilen sınırlar içinde bir değer gir. |
| DB-PROFILE-DATE-INVALID | Geçerli bir tarih gir. |
| DB-MEASUREMENT-INVALID | Geçerli bir vücut ölçüsü gir. |
| DB-MEASUREMENT-REFRESH-FAILED | Ölçüler kaydedildi ancak analiz verileri yenilenemedi. Lütfen tekrar deneyin. |
| DB-WEIGHT-REFRESH-FAILED | Kilo kaydedildi ancak analiz verileri yenilenemedi. Lütfen tekrar deneyin. |
| DB-PUSH-PERMISSION-DENIED | DietBridge bildirimlerini telefonunun uygulama ayarlarından açabilirsin. |
| DB-PUSH-PERMISSION-REQUIRED | Bildirimleri açmak için tekrar dokunup izin penceresinden onay verebilirsin. |
| DB-PUSH-SETTINGS-UNAVAILABLE | Telefonunun Ayarlar bölümünden DietBridge uygulamasını seçip bildirimlere izin verebilirsin. |
| DB-PUSH-ENABLE-FAILED | Bildirimler şu anda etkinleştirilemedi. Lütfen daha sonra tekrar dene. |
| DB-NOTIFICATION-OPEN-FAILED | Bildirim açılamadı. Bildirimler ekranından tekrar deneyebilirsiniz. |
| DB-PHOTO-SELECTION-FAILED | Fotoğraf eklenemedi. Fotoğraf iznini kontrol edip tekrar dene. |
| DB-CHAT-DELETE-FAILED | Mesaj şu anda silinemedi. Lütfen tekrar deneyin. |
| DB-APPOINTMENT-OPEN-FAILED | Bu randevu artık görüntülenemiyor. |
| DB-LINK-OPEN-FAILED | Bu bağlantı cihazınızda açılamadı. Lütfen daha sonra tekrar deneyin. |

## Manuel doğrulama

Fiziksel Android cihazda ve iOS'ta küçük ekran/büyük yazı, klavye açıkken hata kartı, alt navigasyon çubuğu, TalkBack/VoiceOver, başlatma sırasında kayıtlı sağlık onayları ve gerçek onboarding geri tuşu kontrol edilmelidir. Otomatik JSX testleri gerçek bileşenleri izole native yüzeylerle doğrular; fiziksel cihaz doğrulaması yerine geçmez. Bu görevde production verisine, Storage'a veya şemaya yazılmadı.
