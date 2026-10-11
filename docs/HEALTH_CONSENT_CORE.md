# Sağlık verisi tercihi — mobil hazırlık

11.10.2026 · Varsayılan kapalı · Mağaza paketi gönderilmedi.

Mevcut başlangıç ve profil ekranlarında saklama ve aktif diyetisyene sunma için ayrı tercihler hazırlanır. Yeni tercihler boş başlar; metin ve sürüm backend'den gelir. Ayrı bir geri alma ekranı/butonu veya yeni Ayarlar bölümü eklenmez. Mevcut tercih bileşeni seçim değişikliğini sunucuda kaydeder.

`EXPO_PUBLIC_ENABLE_HEALTH_CONSENT=true` olduğunda profil sağlık yazmaları, kilo RPC'si, günlük su kaydı, öğün tamamlaması ve kişisel öğün fotoğrafı öncesinde sunucu tercihi doğrulanır. RPC veya sonuç doğrulanamazsa kayıt yapılmaz. Sağlık bilgisi adımları atlanabilir; hesap/iletişim/avatar işlemleri bu tercihe bağlanmaz. Bu istemci kontrolü backend trigger/RLS korumasının yerini tutmaz.

Varsayılan `false` mevcut backend akışını korur. Backend migration'ı, kesinleşmiş hukukî metinler, KVKK m.9, kalan sağlık veri yolları ve fiziksel cihaz testi tamamlanmadan etkinleştirilmez. Backend koruması etkinse eski mobil sürümler korunan sağlık yazmalarında hata alır. Web/backend eş PR'ındaki kapsam ve yayın kapıları geçerlidir.

Doğrulama: typecheck, lint, node testleri ve Android/iOS export. Gerçek kullanıcı veya canlı veritabanına test yazması yapılmaz.

Öğün değişiklik talebi diyetisyene gönderildiği için saklama ve paylaşım tercihi birlikte doğrulanır. Kişisel öğün fotoğrafında kontrol yerel hazırlık/yüklemeden önce yapılır. Rıza hatası genel kayıt hatasıyla gizlenmez. Metin mesajı, görsel intent oluşturma, Storage yükleme, Edge doğrulama ve görsel finalize öncesinde de paylaşım tercihi doğrulanır. Rıza hatası genel chat/görsel hata eşlemesine girerek kaybolmaz. İptal ve silme yeni rıza istemez. Backend eş PR chat/bildirim/servis yazma kontrollerini içerir; gerçek Edge/Storage HTTP, cihaz ve cache değerlendirmesi yayın kapısı olmaya devam eder.

Son doğrulama: 482 Node testi PASS; paylaşım ret halinde gerçek servis gövdelerinin RPC, Storage ve Edge çağrısı yapmadığı sınandı. Typecheck/lint PASS (mevcut 41 lint uyarısı); flag=true Android ve iOS export PASS. Fiziksel cihaz testi ve mağaza gönderimi yapılmadı.
