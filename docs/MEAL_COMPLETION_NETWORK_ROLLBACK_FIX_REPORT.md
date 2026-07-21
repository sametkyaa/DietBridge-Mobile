# DietBridge Mobile — Meal Completion Network Rollback Düzeltme Raporu

## 1. Amaç

`set_my_meal_completion` RPC veya ağ çağrısı başarısız olduğunda mobildeki optimistic öğün tamamlama durumunun hem Dashboard hem de paylaşılan meals context içinde güvenle geri alınması amaçlandı.

## 2. Staging cihaz testinde gözlenen hata

İnternet kapalıyken “Öğünü Yedim” işlemi sonrası arayüz öğünü tamamlanmış göstermeye devam etti. İlk denemede uygulamanın kapanması da bildirildi.

## 3. Database sonucu

Önceki staging testinde database rollback: **PASS**. Client A öğününde `is_eaten` değişmedi; Client B foreign meal değişmeden kaldı.

## 4. Mobil UI sonucu

Önceki staging testinde mobil UI rollback: **FAIL**. UI, database gerçeğinden ayrışarak optimistic tamamlanma durumunu göstermeye devam etti.

## 5. Kök neden

RPC ağ/fetch istisnaları service katmanında normalize edilmeden üst katmana taşınabiliyordu; ViewModel de hata metnini doğrudan kullanıcıya gösterebiliyordu. Context rollback’i bütün `completedMeals` nesnesinin eski referansına dayanıyordu ve aynı meal için yeni bir talep başladıktan sonra eski bir talebin rollback’i yeni durumu ezebiliyordu.

Dashboard ayrıca meal kartını kendi `meals` dizisinden oluştururken tamamlanma görünümünü context’teki ayrı `completedMeals` kopyasından çıkarıyordu. Bu çift state kaynağı, hata durumunda görsel durumun deterministik biçimde geri alınmasını zorlaştırıyordu.

## 6. Etkilenen çağrı zinciri

`DashboardScreen → useDashboardViewModel.completeMeal → MealsContext.toggleMealCompletion → mealService.updateMealCompletion → set_my_meal_completion RPC`

## 7. Service hata propagation düzeltmesi

`updateMealCompletion` yalnız `set_my_meal_completion` RPC’sini çağırır. RPC `error` döndürürse, `false`/beklenmeyen sonuç dönerse veya ağ/fetch exception oluşursa Promise kontrollü `Öğün durumu güncellenemedi.` hatasıyla reject eder. Direct `meals UPDATE` ve fallback yoktur.

## 8. Context rollback düzeltmesi

Context her işlemde yalnız hedef meal’in önceki completion kaydını saklar ve React state güncellemesini mevcut ref tabanlı state üzerinden üretir. Hata halinde sadece hedef meal eski durumuna döner; diğer meal kayıtları korunur. Meal bazlı request sürümü, eski bir isteğin rollback’inin daha yeni isteğin durumunu ezmesini engeller. Hata rollback sonrasında yeniden fırlatılır.

## 9. ViewModel/UI state düzeltmesi

Dashboard kartı artık tamamlanma durumunu kendi güncel `meals[].is_eaten` kaynağından türetir. ViewModel hedef meal’i optimistic günceller, hata halinde aynı meal’in önceki `is_eaten` değerine döner ve diğer meal alanlarını korur. Bu local state için de meal bazlı request sürümü uygulanır.

## 10. Kullanıcı hata mesajı

Hata yalnız ViewModel’de bir kez gösterilir:

`Öğün durumu güncellenemedi. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.`

`fetch`, `Response status 0`, Supabase ve PostgREST teknik hata metinleri kullanıcıya gösterilmez.

## 11. Unhandled rejection/crash koruması

Service bütün RPC/ağ başarısızlıklarını reject eden normalize bir hata sözleşmesine çevirir. Context bu rejection’ı rollback sonrasında yeniden fırlatır; `completeMeal` bunu yakalar ve kontrollü Alert gösterir. Dashboard event handler yolunda rejection UI dışına taşınmaz.

## 12. Başarılı RPC yolunun korunması

Başarılı `true` RPC sonucu `{ id, is_eaten }` olarak döner. ViewModel bu sonucu mevcut meal objesiyle merge eder; `title`, `calories`, `macros`, `time`, `photo_url` ve diğer mevcut alanlar korunur.

## 13. Direct UPDATE kontrolü

Aktif meal completion yolu RPC referansını kullanır. Direct `meals UPDATE`: **Yok**. Fallback: **Yok**. `src_backup` içindeki eski eşleşmeler aktif yol değildir.

## 14. Değiştirilen dosyalar

| Dosya | Değişiklik |
|---|---|
| `apps/mobile/src/features/meals/services/mealService.js` | RPC/ağ hatası normalize edilerek reject sözleşmesi netleştirildi. |
| `apps/mobile/src/features/meals/context/MealsContext.js` | Hedef meal rollback’i ve request-version koruması eklendi. |
| `apps/mobile/src/features/clients/viewmodels/useDashboardViewModel.js` | Dashboard optimistic update/rollback’i, tek UI hata mesajı ve request-version koruması eklendi. |
| `docs/MEAL_COMPLETION_NETWORK_ROLLBACK_FIX_REPORT.md` | Bu teknik rapor eklendi. |

## 15. Statik kontroller

Tamamlandı:

- Değiştirilen üç JavaScript dosyası Babel ile `sourceType: module` ve JSX parser eklentisi kullanılarak parse edildi.
- `mealService.js` için `node --check` geçti.
- `git diff --check` geçti.
- Aktif `set_my_meal_completion` referansı doğrulandı.
- `apps/mobile/src` altında `from('meals')` ve `.update({ is_eaten` eşleşmesi bulunmadı.
- `new Response`, `status: 0`, `whatwg-fetch`, `global.fetch`, `fetch(` ve `Unhandled` için mobil kaynak taramasında eşleşme bulunmadı.
- Secret taramasında eşleşme bulunmadı.
- Web referans deposunun branch, HEAD ve çalışma ağacı salt okunur doğrulandı; temiz kaldı.

## 16. Test sonuçları

Repository’de test script’i veya mevcut JavaScript test altyapısı bulunmadığı için yeni dependency ya da framework eklenmedi. Bu nedenle otomatik davranış testi eklenmedi; yukarıdaki parse, syntax ve aktif yol kontrolleri geçti.

## 17. Çalıştırılmayan testler

Supabase bağlantılı integration testi, Expo başlatma ve staging cihaz testi bu aşamada çalıştırılmadı. ROLLBACK-01, ROLLBACK-02, SUCCESS-01, ISOLATION-01 ve NETWORK-01 senaryoları gerçek staging cihaz testinde yeniden doğrulanmalıdır.

## 18. Supabase değişmezliği

Supabase staging veya production’a bağlanılmadı. Gerçek RPC tekrar testi yapılmadı. Fixture oluşturulmadı. Migration veya policy değiştirilmedi. Legacy `meals UPDATE` policy kaldırılmadı.

## 19. Kalan staging testi

Düzeltilmiş mobil build ile internet kapalıyken ve açıkken meal completion akışı yeniden test edilmeli; rollback, controlled Alert ve app restart sonrası persistence doğrulanmalıdır.

## 20. Production blocker

Production rollout: **Bloklu**. Gerçek staging network rollback ve persistence testleri tamamlanmadan rollout yapılmamalıdır.

## 21. Sonuç

Kod düzeltmesi: **Tamamlandı**. Network/RPC hatasında service reject → context rollback → ViewModel/UI catch → kontrollü Türkçe Alert akışı uygulanmıştır. Direct meals UPDATE yoktur ve fallback yoktur.

## 22. Sonraki aşama

Aşama 3E-1C-3: Düzeltilmiş mobil build ile staging network rollback ve persistence testlerini yeniden çalıştırmak.
