# Sağlık verisi tercihi — mobil hazırlık

11.10.2026 · Varsayılan kapalı · Mağaza paketi gönderilmedi.

Mevcut başlangıç ve profil ekranlarında saklama ve aktif diyetisyene sunma için ayrı tercihler hazırlanır. Yeni tercihler boş başlar; metin ve sürüm backend'den gelir. Ayrı bir geri alma ekranı/butonu veya yeni Ayarlar bölümü eklenmez. Mevcut tercih bileşeni seçim değişikliğini sunucuda kaydeder.

`EXPO_PUBLIC_ENABLE_HEALTH_CONSENT=true` olduğunda profil sağlık yazmaları, kilo RPC'si ve günlük su kaydı öncesinde sunucu tercihi doğrulanır. RPC veya sonuç doğrulanamazsa kayıt yapılmaz. Sağlık bilgisi adımları atlanabilir; hesap/iletişim/avatar işlemleri bu tercihe bağlanmaz. Bu istemci kontrolü backend trigger/RLS korumasının yerini tutmaz.

Varsayılan `false` mevcut backend akışını korur. Backend migration'ı, kesinleşmiş hukukî metinler, KVKK m.9, kalan sağlık veri yolları ve fiziksel cihaz testi tamamlanmadan etkinleştirilmez. Backend koruması etkinse eski mobil sürümler korunan sağlık yazmalarında hata alır. Web/backend eş PR'ındaki kapsam ve yayın kapıları geçerlidir.

Doğrulama: typecheck, lint, node testleri ve Android/iOS export. Gerçek kullanıcı veya canlı veritabanına test yazması yapılmaz.
