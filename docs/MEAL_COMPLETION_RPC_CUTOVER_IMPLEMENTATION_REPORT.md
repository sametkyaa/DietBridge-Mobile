# DietBridge Mobile — Meal Completion RPC Cutover Uygulama Raporu

> [!IMPORTANT]
> Bu aşamada mobil meal completion kodu `set_my_meal_completion` RPC’sine geçirilmiştir. Supabase staging veya production üzerinde çalışma zamanı testi yapılmamış, legacy database policy kaldırılmamış ve migration uygulanmamıştır.

## 1. Amaç

Danışan öğün tamamlama akışındaki doğrudan `meals` UPDATE çağrısını, sahiplik kontrolünü veritabanında yapan RPC ile değiştirmek.

## 2. Başlangıç commit’i

`73ce5422103bc7b0ea9b07c2cc55006ffe9c1784` — `chore: establish mobile project baseline`

## 3. Aktif branch

`codex/meal-completion-rpc-cutover`

## 4. Önceki çağrı zinciri

`DashboardScreen → useDashboardViewModel.completeMeal → MealsContext.toggleMealCompletion → mealService.updateMealCompletion → direct meals UPDATE`

## 5. Yeni çağrı zinciri

`DashboardScreen → useDashboardViewModel.completeMeal → MealsContext.toggleMealCompletion → mealService.updateMealCompletion → set_my_meal_completion RPC`

## 6. Değiştirilen dosyalar

- `apps/mobile/src/features/meals/services/mealService.js`: Direct UPDATE kaldırıldı ve RPC çağrısı eklendi.
- Bu rapor: Cutover kararı, doğrulamalar ve kalan riskler kaydedildi.

## 7. Service değişikliği

`updateMealCompletion(mealId, isEaten)` yalnız geçerli UUID biçimindeki meal ID ve boolean değer kabul eder. Geçersiz değerlerde ağ çağrısı yapılmaz. Doğrudan tablo UPDATE veya fallback yoktur.

## 8. RPC kontratı

Aktif Web migration kaynağı `public.set_my_meal_completion(p_meal_id uuid, p_is_eaten boolean)` tanımlar. Function `boolean` döndürür, `SECURITY DEFINER` kullanır, `search_path = pg_catalog, public` ayarlıdır; `auth.uid()` ve `meal_plans.client_id` ile sahipliği doğrular ve yalnız `is_eaten` alanını günceller. `authenticated` için execute grant’i vardır; `anon` ve `public` revoke edilmiştir.

## 9. Parametre değişiklikleri

İstemci yalnız `p_meal_id` ve `p_is_eaten` gönderir. `userId`, `planId` ve `dietitianId` güvenlik parametresi olarak gönderilmez.

## 10. Context ve state yönetimi

`MealsContext` doğrudan Supabase çağrısı yapmaz. Mevcut context API’si değişmediği için çağıran ViewModel veya UI değişikliği gerekmedi.

## 11. Optimistic update

Korundu. Context, RPC’den önce `completedMeals` durumunu günceller.

## 12. Rollback davranışı

Korundu. RPC veya doğrulama hatasında context, ref-backed önceki `completedMeals` snapshot’ını geri yükler ve hatayı üst katmana iletir.

## 13. Hata yönetimi

Geçersiz ID ve RPC hataları kontrollü Türkçe hata ile sonuçlanır: `Öğün durumu güncellenemedi.` Teknik Supabase hata nesnesi kullanıcıya gösterilmez.

## 14. Direct UPDATE kaldırma sonucu

Aktif mobil meal completion direct UPDATE: **Kaldırıldı.**

## 15. Fallback kontrolü

Fallback direct UPDATE: **Yok.** RPC başarısız olduğunda service hata fırlatır ve context rollback uygular.

## 16. Dead/unreferenced kod

`src_backup` içindeki eski local-only/direct-update kodu aktif import zincirinde değildir ve bu aşamada değiştirilmemiştir.

## 17. Statik kontroller

RPC adı ve parametreleri aktif Web migration ile karşılaştırıldı. Aktif kaynakta meal completion için direct UPDATE/fallback aranacaktır. Context ve UI’da doğrudan Supabase çağrısı eklenmedi.

## 18. Test sonuçları

Mevcut package script’lerinde lint, test, typecheck veya check komutu bulunmadığı için framework testi çalıştırılamaz. Service syntax kontrolü ve statik grep doğrulamaları uygulanacaktır.

## 19. Çalıştırılmayan testler

Staging/production bağlantısı, gerçek RPC çağrısı, test kullanıcısı veya fixture oluşturma, Expo/EAS build ve network gerektiren integration testleri çalıştırılmadı.

## 20. Supabase değişmezliği

Supabase staging veya production’a bağlanılmadı. RPC gerçek kullanıcıyla çalıştırılmadı. Migration uygulanmadı. Legacy meals UPDATE policy değiştirilmedi veya kaldırılmadı. Test kullanıcısı veya fixture oluşturulmadı.

## 21. Kalan production blocker

Legacy database policy: **Değiştirilmedi.** Mobil kod RPC’ye geçirilmiş olsa bile staging cihaz testi, foreign meal reddi, state rollback doğrulaması ve eski mobil build uyumluluk değerlendirmesi tamamlanmadan legacy meals UPDATE policy kaldırılamaz.

## 22. Staging test gereksinimi

Staging mobil cihaz testi bekliyor. Foreign meal RPC reddi ve RPC hata rollback’i gerçek staging bağlantısıyla doğrulanmadı.

## 23. Eski build uyumluluk riski

Eski mobil build’lerin doğrudan UPDATE davranışı manuel olarak değerlendirilmelidir; legacy policy henüz bu nedenle kaldırılamaz.

## 24. Sonuç

Aktif RPC kullanımı: **Mevcut.** Optimistic update ve rollback: **Korundu.** Production rollout: **Hâlâ bloklu.**

## 25. Sonraki aşama

Aşama 3E-1C: DietBridge Staging üzerinde gerçek meal completion, foreign meal reddi ve rollback testleri.
