# DietBridge – Mobile AI Code Assistant Prompt (React Native + Expo)

Bu prompt, DietBridge’in **mobil uygulaması** (danışan tarafı) için kod üreten AI aracı tarafından kullanılacaktır.  
Lütfen aşağıdaki mimari ve kurallara **kesin olarak uy**.

---

## 1. Proje Özeti

- Proje adı: **DietBridge**
- Amaç: Diyetisyenlerin danışanlarını takip etmesini sağlayan, danışanlar için mobil uygulama + diyetisyenler için web panel.
- Bu prompt: **Sadece mobil uygulama (danışan tarafı, React Native + Expo)** için geçerlidir.
- Backend: **Supabase** (Auth, Postgres, Storage, opsiyonel Edge Functions).

Detaylı mimari, projedeki `ARCHITECTURE.md` dosyasında tanımlıdır.  
Bu prompt, o dokümanla **tutarlı olmak zorundadır**.

---

## 2. Teknoloji ve Temel Kurallar (MOBİL)

- Framework: **React Native + Expo**
- Dil: **JavaScript** (TypeScript KULLANMA).
- Mimari: **MVVM (Model–View–ViewModel)**
- State yönetimi: React hooks (gerekirse Context).
- Supabase erişimi:
  - **Sadece `services/` katmanından** veya ortak `packages/shared/services/` içinden yapılır.
  - Screen dosyaları içinde **doğrudan** `supabase.from(...).select(...)` yazma.

---

## 3. Klasör Yapısı (MOBİL)

Tüm kodu şu yapıya göre yaz:

```text
apps/mobile/src/
  features/
    auth/
      screens/
      components/
      services/
      viewmodels/
    clients/
      screens/
      components/
      services/
      viewmodels/
    meals/
      screens/
      components/
      services/
      viewmodels/
    analytics/
      screens/
      components/
      services/
      viewmodels/
  shared/
    components/
    hooks/
    utils/
    theme/
  navigation/
  config/
  lib/
    supabaseClient.js
```

### 3.1. Responsibilities

**screens/**
Ekran bileşenleri (View)
Yalnızca:
- UI kompozisyonu (layout)
- Kullanıcı etkileşimlerini ViewModel’e yönlendirme
Yapma:
- Supabase çağrısı
- Business logic gömme
Örnek dosya isimleri:
`ClientListScreen.js`, `ClientDetailScreen.js`, `MealPlanScreen.js`

**viewmodels/**
MVVM’in ViewModel katmanı. `useXxxViewModel` isimli custom hook’lar.
Görevleri:
- Ekranın state’ini yönetmek (isLoading, error, data vb.)
- İş mantığı (kaydet, güncelle, filtrele vb.)
- `services/` altındaki fonksiyonları kullanmak.
Sadece servis katmanına konuşur, doğrudan Supabase kullanmaz.
Örnek: `useClientDetailViewModel.js`, `useMealPlanViewModel.js`

**services/**
Supabase erişim katmanı. Tüm CRUD işlemleri burada.
Fonksiyon isimleri:
- Okuma: `getXxx`, `fetchXxx`
- Yazma: `createXxx`, `updateXxx`, `deleteXxx`, `saveXxx`
Örnek:
`getDietitianClients(dietitianId)`
`getClientById(clientId)`
`saveMealPlan({ clientId, weekStartDate, meals })`
`supabaseClient.js` sadece buradan import edilir.

**components/**
Yeniden kullanılabilir UI parçaları.
Örnek: `ClientCard`, `MealPlanRow`, `WeeklySummaryCard`

**shared/**
Ortak bileşenler, hook’lar, utils, tema.
Örnek: `shared/components/Button.js`, `shared/theme/colors.js`

---

## 4. Supabase Erişim Kuralları
`apps/mobile/src/lib/supabaseClient.js` içinde Supabase client tanımlanacak.

Environment değişkenleri:
`SUPABASE_URL`
`SUPABASE_ANON_KEY`
Bu değerler koda gömülmeyecek, `.env` üzerinden okunacak.

Tüm Supabase çağrıları:
`features/*/services/*.js` veya `packages/shared/services/*.js` içinden yapılır.

Screen veya ViewModel dosyasında `supabase.from(...)` yazma. Her zaman bir servis fonksiyonu kullan.

---

## 5. Domain Model ve Tablo İsimleri
Database modeli ARCHITECTURE.md ile uyumlu olmalı. Örnek tablolar:
`dietitians`, `clients`, `meal_plans`, `recipes`, `measurements`, `appointments`

Kolon isimlerini asla değiştirme, örneğin:
**clients**: `id, dietitian_id, name, birth_date, gender, allergies, disliked_foods, notes, created_at`
**meal_plans**: `id, client_id, week_start_date, meals`

Supabase sorguları yazarken:
- Doğru tablo adını kullan.
- Doğru kolon isimleriyle çalış.
- Veri tiplerini bozmadan işle.

---

## 6. Kodlama Kuralları (MOBİL)
- Dil: dosya, değişken, fonksiyon isimleri İngilizce.
- Yorumlar: Tercihen İngilizce; UI metinleri Türkçe olabilir.

**Dosya isimleri:**
- Screen & Component: PascalCase → `ClientListScreen.js`, `MealPlanCard.js`
- Servisler: camelCase → `clientService.js`, `mealPlanService.js`

**Hook isimleri:**
- `useClientListViewModel`
- `useMealPlanViewModel`

**Error & loading state:**
Her ViewModel’de en az:
- `isLoading`
- `error`
- Ana data veya ilgili state’ler

---

## 7. Güvenlik ve Auth (MOBİL)
- Auth: Supabase Auth
- Kullanıcı rolleri: `dietitian`, `client`
- Mobil uygulama burada esas olarak client (danışan) rolüne odaklanır.
- Supabase Row Level Security (RLS) kuralları dikkate alınarak:
  - Her sorguda sadece ilgili kullanıcının verisi çekilmeli.
  - Şifre, token vb. hassas bilgileri asla ekrana loglama.

---

## 8. Cevaplama Biçimin
Bu prompt’u kullanan kişi, sana aşağıda "TASK" bölümünde özel görevler verecektir.
Sen:
- Kod verirken, ilgili dosya yolunu açıkça belirt:
  Örn: `apps/mobile/src/features/meals/screens/MealPlanScreen.js`
- Mümkün olduğunca tam dosya içeriği ver.
- Eğer mevcut dosyada değişiklik yapıyorsan:
  - “Önce” dosya yolunu yaz,
  - Sonra güncellenmiş tam içerik ver.
- Açıklamaları Türkçe yap, kod İngilizce olsun.

---

## 9. TASK (BURAYI KULLANICI DOLDURACAK)
Aşağıda sana verilecek görevleri, yukarıdaki tüm kurallara uyarak gerçekleştir:

TASK:
(Bu kısmı her kullanımda kullanıcı dolduracak. Örneğin:
“Danışanın haftalık beslenme planı ekranını oluştur. Kullanıcı, seçilen haftadaki öğünlerini görebilsin ve detay sayfasına gidebilsin.”)
