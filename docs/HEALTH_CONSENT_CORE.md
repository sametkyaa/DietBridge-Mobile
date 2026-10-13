# Sağlık verisi tercihi — mobil hazırlık

11.10.2026 · Varsayılan kapalı · Mağaza paketi gönderilmedi.

Kayıt ekranında KVKK bilgilendirmesinin altında saklama ve aktif diyetisyene sunma için ayrı, isteğe bağlı tercihler hazırlanır. Yeni tercihler boş başlar. Onboarding adımlarında ve profil ekranında KVKK/sağlık verisi bloğu bulunmaz; mevcut tercih bileşeni Ayarlar ekranında seçim değişikliğini sunucuda kaydeder. Salt bilgilendirme metni kayıt ve Ayarlar ekranlarında gösterilir.

Kayıt anında oturum bulunmadığından, gösterilen belge sürümü ve tam metin ile seçimler `registration_health_consent` Auth metadata'sında taşınır. Metadata erişim izni değildir. İlk doğrulanmış danışan oturumunda mevcut `get_my_health_consent` ve `set_my_health_consent` RPC'leriyle kalıcı kayıt doğrulanır; mevcut sunucu tercihi varsa kayıt seçimi yeniden uygulanmaz. Böylece sonraki geri almalar girişte ezilmez. Başarısız kayıt veya sürüm/metin uyuşmazlığında uygulama ve veri provider'ları açılmadan güncel metinlerle tek seferlik tamamlama ekranı gösterilir; boş kutularla ret kaydetmek mümkündür.

Kayıt belgesi `registrationHealthConsent.cjs` içinde mevcut backend'in `health-core-2026-10-11-v1-draft` metnine sabitlenmiştir; rollout bayrağı değiştirilmemiştir. Yayın metni güncellendiğinde bu belge de eşlenmelidir. Backend şeması, migration, RLS ve üretim verisi bu yerleşim değişikliğinde değiştirilmemiştir. Gerçek e-posta doğrulaması, ilk giriş, başka cihazdan giriş, ret ve Ayarlar'dan geri alma fiziksel cihazda ayrıca kontrol edilmelidir.

`EXPO_PUBLIC_ENABLE_HEALTH_CONSENT=true` olduğunda profil sağlık yazmaları, kilo RPC'si, günlük su kaydı, öğün tamamlaması ve kişisel öğün fotoğrafı öncesinde sunucu tercihi doğrulanır. RPC veya sonuç doğrulanamazsa kayıt yapılmaz. Sağlık bilgisi adımları atlanabilir; hesap/iletişim/avatar işlemleri bu tercihe bağlanmaz. Bu istemci kontrolü backend trigger/RLS korumasının yerini tutmaz.

Varsayılan `false` mevcut backend akışını korur. Backend migration'ı, kesinleşmiş hukukî metinler, KVKK m.9, kalan sağlık veri yolları ve fiziksel cihaz testi tamamlanmadan etkinleştirilmez. Backend koruması etkinse eski mobil sürümler korunan sağlık yazmalarında hata alır. Web/backend eş PR'ındaki kapsam ve yayın kapıları geçerlidir.

Doğrulama: typecheck, lint, node testleri ve Android/iOS export. Gerçek kullanıcı veya canlı veritabanına test yazması yapılmaz.

Öğün değişiklik talebi diyetisyene gönderildiği için saklama ve paylaşım tercihi birlikte doğrulanır. Kişisel öğün fotoğrafında kontrol yerel hazırlık/yüklemeden önce yapılır. Rıza hatası genel kayıt hatasıyla gizlenmez. Metin mesajı, görsel intent oluşturma, Storage yükleme, Edge doğrulama ve görsel finalize öncesinde de paylaşım tercihi doğrulanır. Rıza hatası genel chat/görsel hata eşlemesine girerek kaybolmaz. İptal ve silme yeni rıza istemez. Backend eş PR chat/bildirim/servis yazma kontrollerini içerir; gerçek Edge/Storage HTTP, cihaz ve cache değerlendirmesi yayın kapısı olmaya devam eder.

Son doğrulama: 484 Node testi PASS; paylaşım ret halinde gerçek servis gövdelerinin RPC, Storage ve Edge çağrısı yapmadığı sınandı. Typecheck/lint PASS (mevcut 41 lint uyarısı); flag=true Android ve iOS export PASS. Fiziksel cihaz testi ve mağaza gönderimi yapılmadı.

Oturum değişimi ve mevcut tercih bileşeninden yapılan tercih kaydı görsel URL önbelleğini ve ekrandaki görsel durumunu temizler. Kaydın sonucu belirsizse de eski cache geçersizleşir. Bekleyen eski Storage isteği cache'i yeniden dolduramaz veya daha yeni isteği silemez. Kullanıcı kimliği değişince korumalı navigator yeniden oluşturulur. Kendi geçmiş görsellerine erişim korunur; tercih kaydı sonrası yeni Storage kontrolüyle tekrar okunabilir. Önceden verilen 300 saniyelik signed URL ve cihazın indirdiği içerik geri çağrılamaz. Başka cihazdan yapılan tercih değişikliği anlık olarak bu istemciye yayınlanmaz.

Cache düzeltmesinin son doğrulaması: 491 Node testi PASS (7 yeni yarış/tercih/oturum testi), typecheck/lint PASS (41 mevcut uyarı), config ve Android/iOS export PASS. Aynı hesabın token/oturum yenilemesi görselleri gereksiz yere temizlemez; hesap değişimi, çıkış ve recovery sınırları temizler.
