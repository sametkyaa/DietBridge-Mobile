# Hedefe göre su bardakları — 11 Ekim 2026

## Amaç ve kaynak

Ana sayfadaki sabit 200 ml ve en fazla 12 bardak hesabı, yüksek hedeflerde tüm bardakların hedef tamamlanmadan dolmasına neden oluyordu. Yeni görünüm günlük hedefi 10 bardağa böler; tüm bardaklar ancak hedefe ulaşıldığında dolar. Günlük hedef değiştirilmez ve mevcut su kayıtları yeniden yazılmaz.

Dal: `codex/water-goal-glasses`. İlk kaynak tabanı: `d04b511f868781310ceeeb4c8b8ee77c5497b8de`. Kullanıcının canlıya alma talimatıyla dal güncel main'e fast-forward edildi: `ed79d7c19bfeebf27018373f461915d51d5028ea`. İki tabanın dosya içerikleri aynıydı; geliştirme değişiklikleri korundu.

Çalışma dizini: `C:/dev/DietBridge-Release-Fixes/2026-10-11/mobile-water-goal`. Kullanıcının `C:/dev/DietBridge-Mobile-UI` dizinindeki değişiklikleri ve `mobile-ready` dizinindeki kabul belgesi güncellemeleri korunmuştur.

## Davranış

| Günlük hedef | Bardak sayısı | Bir bardak |
|---|---|---|
| 2,5 L | 10 | 250 ml |
| 3 L | 10 | 300 ml |
| 3,5 L | 10 | 350 ml |

- Su miktarı tam veya kısmi bardaklarla hedefe oranlanır. Hedef değişince aynı kayıt yeni hedefe göre gösterilir.
- Bir bardağa dokunmak hedefe uygun miktarı ekler; son ekleme yalnız hedefte kalan miktarı tamamlar. Hedef sonrasındaki dokunuşlar su tüketimini kaydetmeye devam eder.
- Hedef 10'a tam bölünmüyorsa ml miktarı yaklaşık olarak etiketlenir, son bardak kalan ml ile tamamlanır. Örneğin 2755 ml hedef: dokuz kez 276 ml, son kez 271 ml.
- Elle miktar girişi ve artı/eksi işlemleri korunur. Kullanıcı miktarı değiştirmediyse alanın varsayılanı hedefe göre güncellenir; elle yazılan değer üzerine yazılmaz.
- Toplama/çıkarma tam ml hesabıyla yapılır; 300 ml'lik on ekleme tam 3 L verir.
- Bardak ekleme miktarı, mevcut tarih/session korumaları altında ve gerekiyorsa yeni günün kaydı yüklendikten sonra hesaplanır. Kayıt hatasında mevcut geri alma davranışı korunur.
- Kartta bardak sayısı ve ml miktarı görünür; erişilebilirlik etiketi eklenecek gerçek miktarı bildirir.

## Değişen dosyalar

1. `apps/mobile/src/features/clients/components/dashboard/WaterTrackerCard.js`
2. `apps/mobile/src/features/clients/screens/DashboardScreen.js`
3. `apps/mobile/src/features/clients/viewmodels/useDashboardViewModel.js`
4. `apps/mobile/src/shared/utils/waterTrackingContract.cjs`
5. Yeni `apps/mobile/src/shared/utils/waterGlassPolicy.cjs`
6. Yeni `apps/mobile/src/features/clients/services/__tests__/waterGlassPolicy.test.cjs`
7. Bu rapor.

## Doğrulama

Node 24.18.0, npm 11.6.2. Aktif zincir: App.js → RootNavigator → MainTabs → DashboardScreen → WaterTrackerCard/useDashboardViewModel.

| Kontrol | Sonuç |
|---|---|
| `npm ci --ignore-scripts --no-audit --no-fund` | Başarılı; paket veya lockfile değişmedi |
| `npm run typecheck` | Başarılı |
| `npm run lint` | 0 hata, mevcut 40 uyarı |
| İki su test dosyası için `node --test` | 56/56 başarılı |
| `npm run test` | 457/457 başarılı |
| `npm run export:android` | Başarılı, dist/android |
| `npm run export:ios` | Başarılı, dist/ios |
| `git diff --check` | Başarılı |

Yeni davranış testleri 2,5/3/3,5 L, düşük/yüksek hedefler, kısmi kayıt, hedef değişikliği, hedef üstü tüketim, çıkarma, geçersiz değerler ve yuvarlama durumlarını doğrular. Ayrıca 250–10000 ml aralığındaki her tam ml hedef için sıfırdan on bardak eklemesinin tam hedefi verdiği kontrol edildi.

İnceleme/çalışma komutları: git status --short --branch, rg, Get-Content, git worktree add, git diff ve yukarıdaki kalite komutları.

## Sınırlar ve sonraki adım

Production Supabase veya Storage'a yazılmadı. Migration oluşturulmadı veya çalıştırılmadı. DB, RLS ve servis erişim yolları değişmedi. Web kaynak kodu değişmedi.

İlk yerel doğrulama sonunda çalışma ağacı yalnız yukarıdaki dosyalarda değişiklik içeriyordu. Kullanıcı daha sonra canlıya alma talimatı verdi; yayın yolu bu dalın commit/push edilmesi, required checks sonrasında PR üzerinden main'e birleştirilmesi ve Android preview APK oluşturulmasıdır. Bu rapor yayın başlamadan önceki kod doğrulama kaydıdır; nihai PR/build kimlikleri yayın tamamlandığında ayrıca doğrulanmalıdır. Önceki Android kabulü eski pakete aittir; bu geliştirme için fiziksel cihaz/ekran görüntüsü testi yapılmadı. JavaScript export başarısı fiziksel cihaz kabulü sayılmaz.

Manuel kontrol: telefonda 2,5/3/3,5 L hedefleri, kısmi/elle giriş, artı/eksi, hedef değişikliği ve küçük ekran/büyük yazı görünümü. Sonrasında yayın hazırlığındaki production AAB/internal testing aşamasına dönülebilir. Önceki rapordaki hukuki değerlendirme, bağımlılık uyarıları ve düzenli/offsite yedek işleri devam eder.
