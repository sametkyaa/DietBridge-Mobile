# DietBridge – Codex'e Teknik Devir Dokümanı

**Tarih:** 27 Haziran 2026  
**Hazırlayan:** Antigravity AI (önceki geliştirici AI agent)  
**Hedef:** Codex AI coding agent'a tam proje devri  
**Proje Konumu:** `c:\Users\drsam\Desktop\Yeni klasör\dietBridge - Kopya`

---

## 1. Projenin Amacı ve Genel Kapsamı

**DietBridge**, diyetisyenler ile danışanları arasında köprü kuran bir sağlık ve beslenme takip platformudur.

### İki Taraflı Platform Yapısı

| Taraf | Platform | Durum |
|-------|----------|-------|
| **Danışan (Client)** | React Native + Expo Mobil Uygulama | ⚠️ Aktif geliştirmede (bu proje) |
| **Diyetisyen (Dietitian)** | Web Panel | ❌ Henüz başlanmamış |

### Ana Kullanım Senaryosu

1. Diyetisyen, web panelden danışana haftalık öğün planı atar
2. Danışan, mobil uygulamadan günlük öğünlerini görüntüler
3. Danışan her öğünü yediğinde tamamlama işareti koyar (opsiyonel fotoğraf)
4. Danışan su tüketimini ve kilosunu takip eder
5. Danışan ilerleme analizlerini (kilo değişimi, vücut ölçüleri) izler
6. Danışan, beğenmediği öğünler için değişiklik talep eder
7. Diyetisyen web panelden talepleri görüp planı günceller

### Genel Durum: **Erken MVP → MVP Geçiş Aşaması**

İlk raporla (8 Mart 2026) karşılaştırıldığında, önemli ilerlemeler kaydedilmiştir:
- Auth sistemi genişletildi (kayıt sonrası `profiles` + `client_profiles` otomatik oluşturma)
- Profil yönetimi tamamen Supabase'e bağlandı (CRUD)
- Su takibi ve kilo takibi Supabase `daily_logs` tablosuna bağlandı
- Öğün verisi Supabase `meal_plans` + `meals` tablolarından çekilmeye başlandı
- Analytics servisleri Supabase'e bağlandı (kilo geçmişi, su geçmişi, vücut ölçüleri)
- Öğün değişikliği talebi Supabase'e bağlandı
- JSDoc type tanımları eklendi (`lib/types.js`)

---

## 2. Kullanılan Teknoloji Stack'i

| Katman | Teknoloji | Versiyon |
|--------|-----------|----------|
| Framework | React Native + Expo | Expo ^54.0.23 |
| React | React | 19.1.0 |
| React Native | React Native | 0.81.5 |
| Dil | JavaScript (TypeScript devDep var ama kullanılmıyor) | — |
| Backend | Supabase (Auth, Postgres) | ^2.84.0 |
| Navigation | React Navigation v6 | native ^6.1.18, bottom-tabs ^6.6.1, native-stack ^6.10.1 |
| State Management | React Context API + React Hooks | — |
| Font | @expo-google-fonts/inter | ^0.4.2 |
| Icons | @expo/vector-icons (Ionicons) | ^15.0.3 |
| Storage (lokal) | @react-native-async-storage | ^2.2.0 |
| Image Picker | expo-image-picker | ^17.0.8 |
| Gradient | expo-linear-gradient | ^15.0.7 |
| SVG | react-native-svg | 15.12.1 |
| URL Polyfill | react-native-url-polyfill | ^3.0.0 |

### Mimari Pattern: MVVM (Model–View–ViewModel)

- **View (screens/):** UI kompozisyonu – sadece layout ve kullanıcı etkileşimi
- **ViewModel (viewmodels/):** `useXxxViewModel` şeklinde custom hook'lar – state yönetimi ve iş mantığı
- **Model/Service (services/):** Supabase erişim katmanı – tüm CRUD işlemleri

> [!IMPORTANT]
> Proje JavaScript ile yazılmıştır. TypeScript `devDependencies`'de var ama **aktif olarak kullanılmıyor**. Tüm dosyalar `.js` uzantılıdır. JSDoc ile tip tanımları (`lib/types.js`) yapılmış ama zorlayıcı bir tür kontrolü yoktur.

---

## 3. Klasör Yapısı ve Önemli Dosyaların Görevi

```
dietBridge - Kopya/
├── App.js                                    # Ana entry point (auth check, font loading, navigation)
├── app.json                                  # Expo konfigürasyonu (minimal)
├── package.json                              # Bağımlılıklar ve script'ler
├── .env                                      # Supabase URL + Anon Key
├── tsconfig.json                             # TypeScript config (minimal, kullanılmıyor)
├── schema.json                               # Supabase veritabanı şema tanımları (16 tablo)
├── MOBILE_AI_PROMPT.md                       # AI geliştirme rehberi/kurallar dokümanı
├── TECHNICAL_REPORT.md                       # 8 Mart 2026 tarihli eski teknik rapor (OUTDATED)
│
├── assets/
│   ├── logo.png                              # Uygulama logosu
│   └── meal_icon.png                         # Öğün ikonu
│
├── apps/mobile/src/
│   ├── config/
│   │   └── dietData.js                       # Statik/fallback diyet verileri + tarih yardımcı fonk.
│   │
│   ├── lib/
│   │   ├── supabaseClient.js                 # Supabase client tanımı + auto refresh
│   │   └── types.js                          # JSDoc tip tanımları (Profile, DailyLog, Measurement vb.)
│   │
│   ├── navigation/
│   │   ├── RootNavigator.js                  # Stack navigator (MainTabs + Profile/Settings/Support)
│   │   └── MainTabs.js                       # Bottom tab navigator (4 tab)
│   │
│   ├── shared/
│   │   └── theme/
│   │       ├── fonts.js                      # Font tanımları (Inter) + Text.defaultProps override
│   │       └── styles.js                     # Global StyleSheet (~15KB, tüm ekranların stilleri)
│   │
│   └── features/
│       ├── auth/
│       │   ├── screens/AuthScreen.js          # Giriş/kayıt ekranı (~13KB)
│       │   ├── services/authService.js        # signIn, signUp, signOut + profiles upsert
│       │   └── viewmodels/useAuthViewModel.js # Auth form state yönetimi
│       │
│       ├── clients/
│       │   ├── components/
│       │   │   └── NutritionSummaryCard.js    # SVG circular progress + makro bar'lar
│       │   ├── screens/
│       │   │   ├── DashboardScreen.js         # Ana sayfa (~21KB)
│       │   │   ├── ProfileScreen.js           # Profil düzenleme (~33KB) ← EN BÜYÜK DOSYA
│       │   │   ├── SettingsScreen.js          # Placeholder (~1.4KB)
│       │   │   ├── SupportScreen.js           # Placeholder (~1.4KB)
│       │   │   └── ChatScreen.js              # Placeholder (~393B)
│       │   ├── services/
│       │   │   ├── clientService.js            # Profil CRUD + kataloglar (~9.6KB) ← SUPABASE AKTIF
│       │   │   └── dailyLogService.js          # Su + kilo günlük kaydı (~2.8KB) ← SUPABASE AKTIF
│       │   └── viewmodels/
│       │       ├── useDashboardViewModel.js    # Dashboard state (~6.5KB) ← SUPABASE AKTIF
│       │       └── useProfileViewModel.js      # Profil düzenleme state (~11.8KB) ← SUPABASE AKTIF
│       │
│       ├── meals/
│       │   ├── context/MealsContext.js         # completedMeals global state (Context)
│       │   ├── screens/MealsScreen.js          # Öğün listesi (~18KB)
│       │   ├── services/
│       │   │   ├── mealService.js              # Günlük öğün çekme (~1.8KB) ← SUPABASE AKTIF
│       │   │   └── mealChangeRequestService.js # Öğün değişikliği talebi (~1.2KB) ← SUPABASE AKTIF
│       │   └── viewmodels/useMealsViewModel.js # Öğün state yönetimi (~6.8KB)
│       │
│       └── analytics/
│           ├── screens/AnalysisScreen.js       # Analiz ekranı (~22KB)
│           ├── services/analyticsService.js    # Kilo/ölçü/su geçmişi (~5.4KB) ← SUPABASE AKTIF
│           └── viewmodels/useAnalyticsViewModel.js # Analiz state (~4.4KB)
│
├── src_backup/                                # Eski kaynak yedekleri (temizlenmeli)
└── lib_backup/                                # Eski lib yedekleri (temizlenmeli)
```

### Navigation Yapısı

```
App.js
  └─ MealsProvider (Context)
     └─ NavigationContainer
        ├─ [session yok] → AuthScreen (giriş/kayıt)
        └─ [session var] → RootNavigator (NativeStackNavigator)
           ├─ MainTabs (BottomTabNavigator)
           │   ├─ "Ana Sayfa" → DashboardScreen
           │   ├─ "Öğünler"  → MealsScreen
           │   ├─ "Analiz"   → AnalysisScreen
           │   └─ "Sohbet"   → ChatScreen (placeholder)
           ├─ "Profile"  → ProfileScreen
           ├─ "Settings" → SettingsScreen (placeholder)
           └─ "Support"  → SupportScreen (placeholder)
```

---

## 4. Tamamlanan Özellikler

### ✅ Tam Çalışan (Supabase Bağlantılı)

| Özellik | Dosya(lar) | Detay |
|---------|-----------|-------|
| **Kullanıcı girişi** | `authService.js` | `supabase.auth.signInWithPassword()` |
| **Kullanıcı kaydı** | `authService.js` | signUp metadata (`account_type`, `full_name`, `phone`); profil kayıtları Supabase trigger ile oluşur |
| **Oturum yönetimi** | `App.js`, `supabaseClient.js` | getSession, onAuthStateChange, auto token refresh |
| **Çıkış yapma** | `clientService.js` | `supabase.auth.signOut()` |
| **Profil görüntüleme** | `clientService.js` → `useProfileViewModel` | `profiles` + `client_profiles` + `blood_types` + `client_medical_conditions` + `client_medications` tabloları JOIN |
| **Profil düzenleme** | `clientService.js` → `updateClientProfile()` | İsim, kilo, boy, hedef, kan grubu, kronik hastalıklar, ilaçlar, yaşam tarzı CRUD |
| **Tıbbi bilgi yönetimi** | `clientService.js` | Kronik hastalık/ilaç ekleme çıkarma (many-to-many ilişki) |
| **Su takibi (kayıt)** | `dailyLogService.js` | `daily_logs` tablosuna upsert, optimistic UI |
| **Kilo takibi (kayıt)** | `dailyLogService.js` | `save_my_current_weight` RPC ile `client_profiles` + `measurements` transaction |
| **Günlük öğün çekme** | `mealService.js` | `meal_plans` + `meals` tablosundan JOIN query |
| **Öğün değişikliği talebi** | `mealChangeRequestService.js` | `meal_change_requests` tablosuna insert, `dietitian_clients` ilişkisi üzerinden diyetisyen bulma |
| **Kilo geçmişi grafiği** | `analyticsService.js` | `measurements` tablosundan son 5 kilo kaydı |
| **Su tüketimi geçmişi** | `analyticsService.js` | `daily_logs` tablosundan son 7 gün |
| **Vücut ölçüleri görüntüleme** | `analyticsService.js` | `measurements` tablosundan en son kayıt |
| **Vücut ölçüleri kaydetme** | `analyticsService.js` | `measurements` tablosuna update/insert |
| **Katalog verileri çekme** | `clientService.js` | `blood_types`, `medical_conditions`, `medications_catalog` tabloları |

### ✅ UI Tamamlanmış (Frontend Çalışıyor)

| Özellik | Detay |
|---------|-------|
| Kullanıcı karşılama | Supabase'den isim çekme |
| NutritionSummaryCard | SVG circular progress + macro bar'lar (ancak değerler hâlâ hardcoded) |
| Su takip kartı | Progress bar + ml input + artır/azalt butonları |
| Kilo kayıt kartı | TextInput + kaydet butonu |
| Sıradaki öğün kartı | Öğün bilgileri, tamamlama, fotoğraf ekleme |
| Öğün detay modal'ı | Malzemeler + hazırlanış adımları |
| Sidebar modal | Profil, Ayarlar, Destek navigasyonu |
| Haftalık gün seçimi | Pzt-Paz tarih etiketli |
| Alışveriş listesi | Malzeme birleştirme + checkbox'lı modal |
| Öğün değişikliği talep modal'ı | Gün + öğün seçimi + mesaj |
| Kilo grafiği | Haftalık bar chart, interactive tooltip |
| Vücut ölçüleri kartları | Bel, Kalça, Kol + düzenleme modu |
| Su tüketimi analizi | Haftalık bar chart |
| Rozetler | Gamification badge'leri |
| Profil düzenleme ekranı | Inline edit + modal edit + kataloglardan seçim |

---

## 5. Yarım Kalan veya Eksik Özellikler

### ❌ Tamamen Placeholder Ekranlar

| Ekran | Dosya | Durum |
|-------|-------|-------|
| **ChatScreen** | `ChatScreen.js` (393B) | Sadece "Sohbet ekranı yakında." text'i |
| **SettingsScreen** | `SettingsScreen.js` (~1.4KB) | Sadece "Uygulama Ayarları" başlığı |
| **SupportScreen** | `SupportScreen.js` (~1.4KB) | Sadece "Yardım ve Destek" başlığı |

### ⚠️ Yarım Kalan İşlevler

| İşlev | Durum | Detay |
|-------|-------|-------|
| **Kalori/makro takibi** | Hardcoded | `DashboardScreen`'deki NutritionSummaryCard değerleri statik, öğünlerin kalorilerinden hesaplanmıyor |
| **Makro hedefleri** | Hardcoded | `config/dietData.js` içinde statik macro tanımları |
| **Öğün tamamlama DB kaydı** | ❌ Eksik | `MealsContext` sadece local state tutuyor, DB'ye `is_eaten` flag güncellenmiyor |
| **Fotoğraf yükleme** | ❌ Eksik | Fotoğraf sadece lokal URI olarak tutuluyor, Supabase Storage'a yüklenmiyor |
| **Bildirim sistemi** | ❌ Eksik | Toggle var ama `expo-notifications` entegrasyonu yok |
| **Şifre değiştirme** | ❌ Eksik | Alert ile "yakında" mesajı |
| **Profil fotoğrafı değiştirme** | ❌ Eksik | Edit badge görünüyor ama fonksiyonu yok |
| **Haftalık plan farklılığı** | ⚠️ Kısmi | Supabase'den gün bazlı çekiliyor ama Supabase'de veri yoksa fallback yok (boş liste gösterir) |
| **Alışveriş listesi** | ⚠️ Kısmi | `ingredients` alanı Supabase `meals` tablosunda tanımlı değil, boş dizi dönüyor |
| **Rozet sistemi** | Hardcoded | `getBadges()` hâlâ statik array dönüyor |
| **Adım sayacı** | ❌ Eksik | Health API entegrasyonu yok |

---

## 6. Mock Çalışan Kısımlar

> [!WARNING]
> Aşağıdaki kısımlar UI'da çalışır görünür ama veriler gerçek değildir. Supabase'e bağlanmamışlardır.

| Kısım | Dosya | Mock Kaynağı |
|-------|-------|-------------|
| **NutritionSummaryCard (Kalori/Makro)** | `DashboardScreen.js` + `config/dietData.js` | Kalori 1050/1800 ve makro değerleri `dietData.js` içinde hardcoded |
| **Motivasyon alıntıları** | `clientService.js:226-237` | Statik Türkçe quotes array'den rastgele seçim |
| **Rozetler** | `analyticsService.js:167-173` | Statik 3 rozet: Su Şampiyonu, İlk 5 Kilo, 7 Günlük Seri |
| **Adım sayısı** | `DashboardScreen.js` | UI'da gösteriliyorsa hardcoded değer |
| **Öğün malzemeleri ve adımları** | `mealService.js:56-57` | DB'den gelen öğünlerde `ingredients: []` ve `steps: []` olarak fallback |
| **Fallback diyet verileri** | `config/dietData.js:37-72` | Supabase'de öğün yoksa gösterilecek fallback veriler (ama şu an aktif olarak kullanılmıyor, her gün boş gelir) |
| **Karşılama mesajı** | `DashboardScreen.js` | Saate göre dinamik değil, her zaman aynı |

---

## 7. Gerçek Backend/Supabase Bağlantısı Olan Kısımlar

### Supabase Client Konfigürasyonu

```
Dosya: apps/mobile/src/lib/supabaseClient.js
```

- AsyncStorage ile session persistence ✅
- Auto refresh token ✅
- AppState listener ile arka plan/ön plan token yönetimi ✅
- `detectSessionInUrl: false` (mobil uygulama için doğru) ✅
- `.env` dosyasından EXPO_PUBLIC_SUPABASE_URL ve EXPO_PUBLIC_SUPABASE_ANON_KEY ✅

### Aktif Supabase Bağlantıları – Servis Bazlı

#### `authService.js` – ✅ TAMAMEN BAĞLI
```
supabase.auth.signInWithPassword()     → Giriş
supabase.auth.signUp()                 → Kayıt
supabase.auth.signOut()                → Çıkış
supabase.from('profiles').upsert()     → Kayıtta profil oluşturma
supabase.from('client_profiles').upsert() → Kayıtta danışan profili oluşturma
```

#### `clientService.js` – ✅ TAMAMEN BAĞLI
```
supabase.from('profiles').select()         → Profil çekme (client_profiles JOIN)
supabase.from('blood_types').select()      → Kan grubu çekme
supabase.from('client_medical_conditions') → Kronik hastalıklar (JOIN medical_conditions)
supabase.from('client_medications')        → İlaçlar (JOIN medications_catalog)
supabase.from('profiles').update()         → İsim güncelleme
supabase.from('client_profiles').update()  → Detay güncelleme
supabase.from('medical_conditions').insert/select → Yeni hastalık ekleme
supabase.from('medications_catalog').insert/select → Yeni ilaç ekleme
supabase.from('client_medical_conditions').delete/insert → Çoklu ilişki güncelleme
supabase.from('client_medications').delete/insert → Çoklu ilişki güncelleme
supabase.from('daily_logs').select/update/insert → Kilo sync
supabase.from('blood_types').select()      → Katalog
supabase.from('medical_conditions').select() → Katalog
supabase.from('medications_catalog').select() → Katalog
```

#### `dailyLogService.js` – ✅ TAMAMEN BAĞLI
```
supabase.from('daily_logs').select()   → Günlük log çekme
supabase.from('daily_logs').update()   → Su/kilo güncelleme
supabase.from('daily_logs').insert()   → Yeni günlük log oluşturma
supabase.from('client_profiles').update() → Kilo sync
```

#### `mealService.js` – ✅ BAĞLI
```
supabase.from('meal_plans').select('id, plan_date, notes, meals (*)') → Günlük öğün planı çekme
```

#### `mealChangeRequestService.js` – ✅ BAĞLI
```
supabase.from('dietitian_clients').select() → Aktif diyetisyen bulma
supabase.from('meal_change_requests').insert() → Talep oluşturma
```

#### `analyticsService.js` – ✅ BÜYÜK ÖLÇÜDE BAĞLI
```
supabase.from('measurements').select()        → Kilo geçmişi (son 5)
supabase.from('measurements').select()        → Vücut ölçüleri
supabase.from('measurements').update/insert() → Ölçü kaydetme
supabase.from('daily_logs').select()          → Su geçmişi (son 7 gün)
getBadges() → ❌ HÂLÂ MOCK (statik array)
```

### Supabase Veritabanı Tabloları (schema.json'dan)

Veritabanında tanımlı 16 tablo:

| Tablo | Kullanım Durumu | Açıklama |
|-------|-----------------|----------|
| `profiles` | ✅ Aktif | Kullanıcı temel profili (id, email, full_name, avatar_url, role) |
| `client_profiles` | ✅ Aktif | Danışan detayları (kilo, boy, hedef, yaşam tarzı) |
| `dietitian_profiles` | ❌ Kullanılmıyor | Diyetisyen profili (üniversite, uzmanlık, diploma) |
| `dietitian_clients` | ✅ Kısmi | Diyetisyen-danışan ilişkisi (sadece meal change request'te okunuyor) |
| `meal_plans` | ✅ Aktif | Günlük öğün planı |
| `meals` | ✅ Aktif | Tek tek öğünler (type, title, calories, macros, is_eaten) |
| `meal_change_requests` | ✅ Aktif | Öğün değişikliği talepleri |
| `daily_logs` | ✅ Aktif | Günlük su + kilo kaydı |
| Eski vücut ölçüm tablosu | ⚠️ Deprecated | Mobil kodda kullanılmıyor |
| `measurements` | ✅ Aktif | Kilo ve vücut ölçümleri |
| `blood_types` | ✅ Aktif | Kan grubu katalog tablosu |
| `medical_conditions` | ✅ Aktif | Tıbbi durum katalog tablosu |
| `medications_catalog` | ✅ Aktif | İlaç katalog tablosu |
| `client_medical_conditions` | ✅ Aktif | Danışan ↔ hastalık many-to-many ilişki |
| `client_medications` | ✅ Aktif | Danışan ↔ ilaç many-to-many ilişki |
| `chat_messages` | ❌ Kullanılmıyor | Sohbet mesajları (tablo tanımlı, UI yok) |
| `appointments` | ❌ Kullanılmıyor | Randevular (tablo tanımlı, UI yok) |

---

## 8. Auth Yapısı Nasıl Çalışıyor?

### Auth Flow

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────────┐
│  App.js     │     │ supabaseClient│     │  Supabase Auth       │
│  (entry)    │────▶│  .js         │────▶│  Server               │
└─────────────┘     └──────────────┘     └──────────────────────┘
       │                                          │
       ├─ getSession() → mevcut session kontrol   │
       ├─ onAuthStateChange() → listener          │
       │                                          │
       ├─ [session var] → RootNavigator           │
       └─ [session yok] → AuthScreen              │
                  │                                │
                  ├─ signIn(email, pass) ──────────┤
                  │     └→ signInWithPassword()    │
                  │                                │
                  └─ signUp(email, pass, name) ────┤
                        ├→ auth.signUp()           │
                        ├→ profiles.upsert()       │
                        └→ client_profiles.upsert()│
```

### Kritik Detaylar

1. **Session Persistence:** AsyncStorage üzerinden saklanıyor
2. **Token Refresh:** AppState değişikliğinde otomatik (arka plan → ön plan geçişinde `startAutoRefresh`)
3. **Kayıt Sonrası:** `authService.signUp()` hem auth kaydı yapar hem de `profiles` ve `client_profiles` tablolarına upsert yapar. Bu, Supabase DB trigger'ı olmasa bile profillerin oluşturulmasını garantiler.
4. **Retry Mekanizması:** `getClientProfile()` fonksiyonunda 3 deneme + 500ms bekleme var (DB trigger gecikmesi için)
5. **Rol Sistemi:** Kayıtta otomatik olarak `role: 'client'` atanıyor (Supabase'de `profiles.role` enum: `dietitian`, `client`)

### Supabase Environment Variables

```env
EXPO_PUBLIC_SUPABASE_URL=https://kagvxhyvxxypspdxcuxz.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs... (JWT token)
```

> [!CAUTION]
> `.env` dosyası repoda açık. `.gitignore`'a eklenmelidir. Anon key mobilde client-side olduğu için RLS kurallarına bağlı. RLS kurallarının Supabase Dashboard'dan kontrol edilmesi gerekir.

---

## 9. Sensör/Veri Simülasyonu Nasıl Çalışıyor?

### Su Takibi – Gerçek Veri

- Kullanıcı ml cinsinden input girer, litre'ye çevrilir
- `dailyLogService.upsertWaterIntake()` ile Supabase `daily_logs` tablosuna kaydedilir
- **Optimistic UI**: önce local state güncellenir, hata olursa rollback yapılır
- Hedef: 3 litre (hardcoded `waterProgress = Math.min(water / 3, 1)`)
- Maksimum: 5 litre güvenlik sınırı

### Kilo Takibi – Gerçek Veri

- Kullanıcı TextInput'tan kilo girer
- `dailyLogService.upsertDailyWeight()` ile hem `daily_logs` hem `client_profiles.current_weight` güncellenir
- Geçerlilik kontrolü: `0 < weight <= 300`

### Öğün Tamamlama – Sadece Local

- `MealsContext` içinde `completedMeals` state'i tutulur
- Fotoğraf URI'si local olarak saklanır
- **DB'ye yazılmıyor!** `meals.is_eaten` flag'i güncellenmez

### Vücut Ölçüleri – Gerçek Veri

- Kullanıcı bel/kalça/kol değerlerini girer
- `analyticsService.saveBodyMeasurements()` ile Supabase `measurements` tablosuna update/insert
- Negatif değer validasyonu var

### Kalori/Makro Takibi – Mock

- `config/dietData.js` içinde statik makro hedefleri tanımlı
- Gerçek hesaplama yapılmıyor
- Öğünlerin `calories` ve `macros` alanları DB'de var ama UI'da bu değerler kullanılmıyor

### Adım Sayacı – Yok

- Apple HealthKit / Google Fit entegrasyonu yok

---

## 10. State Management Yapısı Nasıl Kurulmuş?

### Genel Strateji: React Context API + Local State

```
App.js
  └── MealsProvider (MealsContext)
        ├── completedMeals: {} → {mealId: {completed: true, photoUri: 'file://...'}}
        └── toggleMealCompletion(mealId, photoUri)
```

### Feature Bazlı State (ViewModel Hook'ları)

Her ekranın kendi ViewModel hook'u var. Supabase'den veri çekme, local state yönetimi ve iş mantığı burada toplanıyor.

#### `useDashboardViewModel` – State Listesi
| State | Tip | Kaynak | Persist |
|-------|-----|--------|---------|
| `water` | number | Supabase `daily_logs` | ✅ DB |
| `weight` | number | Supabase `daily_logs` | ✅ DB |
| `meals` | array | Supabase `meal_plans` + `meals` | ✅ DB |
| `userName` | string | Supabase `profiles` | ✅ DB |
| `avatarUrl` | string | Supabase `profiles` | ✅ DB |
| `dailyQuote` | string | Mock (statik array) | ❌ |
| `waterInput` | string | Local (TextInput) | ❌ |
| `weightInput` | string | Local (TextInput) | ❌ |
| `focusedMealId` | string | Local (meal focus) | ❌ |
| `isSidebarVisible` | boolean | Local (modal state) | ❌ |
| `selectedMeal` | object | Local (modal state) | ❌ |
| `completedMeals` | object | MealsContext (local) | ❌ Not persisted! |

#### `useProfileViewModel` – State Listesi
| State | Tip | Kaynak | Persist |
|-------|-----|--------|---------|
| `userName` | string | Supabase | ✅ DB |
| `clientData` | object | Supabase (profiles + client_profiles + JOINs) | ✅ DB |
| `isEditing` | boolean | Local | ❌ |
| `editForm` | object | Local (form state) | ❌ |
| `editingField` | string | Local (inline edit) | ❌ |
| `editingValue` | any | Local (inline edit) | ❌ |
| `catalogs` | object | Supabase (blood_types, conditions, medications) | ✅ DB |

#### `useMealsViewModel` – State Listesi
| State | Tip | Kaynak | Persist |
|-------|-----|--------|---------|
| `mealsList` | array | Supabase `meal_plans` + `meals` | ✅ DB |
| `selectedDay` | number | Local (gün seçimi) | ❌ |
| `isLoadingMeals` | boolean | Local | ❌ |
| `requestSelectedMeals` | array | Local (modal form) | ❌ |
| `requestMessage` | string | Local (modal form) | ❌ |

#### `useAnalyticsViewModel` – State Listesi
| State | Tip | Kaynak | Persist |
|-------|-----|--------|---------|
| `monthlyWeightTrend` | array | Supabase `measurements` | ✅ DB |
| `measurements` | array | Supabase `measurements` | ✅ DB |
| `waterHistory` | array | Supabase `daily_logs` | ✅ DB |
| `badges` | array | Mock (statik) | ❌ |
| `measurementForm` | object | Local (edit form) | ❌ |
| `isEditingMeasurements` | boolean | Local | ❌ |

### Veri Yenileme Stratejisi

- `useFocusEffect` kullanılıyor (tab/ekran focus olduğunda veri yenileniyor)
- Dashboard ve Analytics ekranları focus'ta otomatik reload yapar
- Profile ekranı `useEffect` ile ilk mount'ta yükler, `getProfile()` ile manual reload yapar
- Meals ekranı `selectedDay` değiştiğinde otomatik fetch yapar

> [!WARNING]
> `MealsContext`'teki `completedMeals` verisi **persist edilmiyor**! Uygulama kapanıp açıldığında tüm öğün tamamlama işaretleri sıfırlanır. Bu, Supabase `meals.is_eaten` ile sync edilmelidir.

---

## 11. Kurulum ve Çalıştırma Komutları

### Ön Koşullar

- Node.js (LTS önerilir)
- npm
- Expo CLI (`npx expo` ile kullanılabilir)
- iOS Simulator veya Android Emulator veya Expo Go uygulaması

### Kurulum

```bash
# Proje dizinine git
cd "c:\Users\drsam\Desktop\Yeni klasör\dietBridge - Kopya"

# Bağımlılıkları yükle
npm install
```

### Çalıştırma

```bash
# Expo dev server'ı başlat
npx expo start

# Veya npm script ile
npm start

# Platform seçenekleri
npm run android    # Android emülatör
npm run ios        # iOS simulator
npm run web        # Web tarayıcı (kısıtlı destek)
```

### Environment Variables

`.env` dosyası zaten mevcut ve konfigüre edilmiş:
```
EXPO_PUBLIC_SUPABASE_URL=https://kagvxhyvxxypspdxcuxz.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

> [!NOTE]
> Expo `EXPO_PUBLIC_` prefix'i ile başlayan env değişkenlerini otomatik olarak client tarafında kullanıma sunar. `.env` dosyası değiştirilirse Expo dev server yeniden başlatılmalıdır.

---

## 12. Bilinen Hatalar ve Dikkat Edilmesi Gerekenler

### 🔴 Kritik

| # | Sorun | Detay |
|---|-------|-------|
| 1 | **Öğün tamamlama DB sync yok** | `completedMeals` sadece React Context'te (RAM'de) tutuluyor. Uygulama kapanınca sıfırlanır. `meals.is_eaten` güncellenmeli. |
| 2 | **RLS kuralları belirsiz** | Supabase'de RLS kurallarının tanımlı olup olmadığı bilinmiyor. Kontrol edilmeli. |
| 3 | **Fotoğraf yükleme yok** | `expo-image-picker` ile fotoğraf seçiliyor ama Supabase Storage'a yüklenmiyor. `meals.photo_url` güncellenmeli. |
| 4 | **`ingredients` ve `steps` alanları DB'de yok** | `meals` tablosunda bu alanlar tanımlı değil. `mealService.js` fallback olarak boş array dönüyor. Öğün detay modal'ı bu yüzden boş gelir. |

### 🟡 Orta

| # | Sorun | Detay |
|---|-------|-------|
| 5 | **`styles.js` çok büyük** | ~15KB tek dosyada tüm ekranların stilleri. Modülerleştirilmeli. |
| 6 | **`Text.defaultProps` override** | `fonts.js` içinde global override. React 19'da deprecated olabilir. |
| 7 | **DashboardScreen'deki iş mantığı** | `handleAddPhoto` ve `handleToggleMealCompletion` View içinde tanımlı, ViewModel'e taşınmalı. |
| 8 | **Context re-render sorunu** | `MealsProvider` her state değişiminde tüm consumer'ları re-render eder. `useMemo` ile optimize edilmemiş. |
| 9 | **ScrollView yerine FlatList** | `MealsScreen` içinde öğün listesi ScrollView ile render ediliyor. Büyük listeler için FlatList kullanılmalı. |
| 10 | **Inline style objeler** | Birçok yerde `style={{ ... }}` kullanılıyor, her render'da yeni obje oluşturuluyor. |
| 11 | **Console.log/warn temizliği** | Production build'de loglar kaldırılmalı. |
| 12 | **Karşılama mesajı statik** | Saate göre "Günaydın/İyi günler/İyi akşamlar" yapılmalı. |

### 🟢 Düşük

| # | Sorun | Detay |
|---|-------|-------|
| 13 | **Backup dizinleri** | `src_backup/` ve `lib_backup/` temizlenmeli. |
| 14 | **Asset path'leri çok derin** | `../../../../../../assets/` gibi derin relative path'ler. Babel module resolver ile alias önerilir. |
| 15 | **`app.json` minimal** | Icon, splash screen, permissions, schema, version tanımları eksik. |
| 16 | **TECHNICAL_REPORT.md outdated** | 8 Mart 2026 tarihli rapor artık güncel değil. Bu doküman güncel durumu yansıtıyor. |
| 17 | **`useMealsViewModel.js` yorum satırları** | `meal_slot` ile ilgili uzun inline yorum bırakılmış (satır 76). |

---

## 13. Bundan Sonra Geliştirilmesi Gereken Öncelikli İşler

### 🔴 Öncelik 1 – Kritik (Temel İşlevsellik)

| # | Görev | Detay | Efor |
|---|-------|-------|------|
| 1.1 | **Öğün tamamlama DB sync** | `meals.is_eaten` flag'ini Supabase'de güncelleyen fonksiyon yazılmalı. `MealsContext` → `mealService` bağlantısı kurulmalı. | Orta |
| 1.2 | **Fotoğraf yükleme (Supabase Storage)** | `expo-image-picker` → Supabase Storage → `meals.photo_url` güncelleme | Orta |
| 1.3 | **Öğün detay verisi (ingredients/steps)** | `meals` tablosuna `ingredients` (jsonb) ve `steps` (jsonb) alanları eklenmeli veya alternatif yapı kurulmalı | Orta |
| 1.4 | **Kalori/makro hesaplama** | Tamamlanan öğünlerin `calories` ve `macros` alanlarından otomatik günlük toplam hesaplama | Orta |
| 1.5 | **RLS kuralları kontrol/tanımlama** | Supabase Dashboard'dan tüm tabloların RLS kuralları kontrol edilmeli ve eksikler tanımlanmalı | Yüksek |
| 1.6 | **Fallback öğün verisi stratejisi** | Supabase'de plan yoksa (diyetisyen henüz atamadıysa) kullanıcıya ne gösterilecek? Boş state UI? Varsayılan plan? | Düşük |

### 🟡 Öncelik 2 – Önemli (MVP Tamamlama)

| # | Görev | Detay | Efor |
|---|-------|-------|------|
| 2.1 | **Chat ekranı** | `chat_messages` tablosu zaten DB'de var. Supabase Realtime ile anlık mesajlaşma | Yüksek |
| 2.2 | **Settings ekranı** | Bildirim tercihleri, tema, hesap yönetimi (şifre değiştirme dahil) | Orta |
| 2.3 | **Support ekranı** | SSS, iletişim formu | Düşük |
| 2.4 | **Rozet sistemi gerçekleştirme** | `getBadges()` fonksiyonunu gerçek verilere dayalı hale getirme (su hedefi tutan gün sayısı, toplam kilo kaybı, streak) | Orta |
| 2.5 | **Profil fotoğrafı değiştirme** | Image picker → Supabase Storage → `profiles.avatar_url` güncelleme | Orta |
| 2.6 | **Şifre değiştirme** | `supabase.auth.updateUser({ password })` | Düşük |
| 2.7 | **`completedMeals` persistance** | Context'teki veri AsyncStorage veya Supabase ile persist edilmeli | Düşük |

### 🟢 Öncelik 3 – İyileştirme (Beta/Production)

| # | Görev | Detay | Efor |
|---|-------|-------|------|
| 3.1 | **Global styles modülerleştirme** | `styles.js` → feature bazlı stil dosyaları | Orta |
| 3.2 | **Error boundary** | React Error Boundary component'leri | Düşük |
| 3.3 | **Loading/Error state UI** | Skeleton loader ve hata gösterimi | Orta |
| 3.4 | **Push notification** | expo-notifications ile öğün/su hatırlatma | Yüksek |
| 3.5 | **Offline support** | AsyncStorage ile cache | Yüksek |
| 3.6 | **Test altyapısı** | Jest + React Native Testing Library | Yüksek |
| 3.7 | **Performance** | FlatList, Context memoization, inline style eliminasyonu | Orta |
| 3.8 | **app.json tam konfigürasyon** | Icon, splash screen, permissions | Orta |
| 3.9 | **Saate göre karşılama** | "Günaydın/İyi günler/İyi akşamlar" | Düşük |

### 🔵 Öncelik 4 – Gelecek Özellikler

| # | Görev |
|---|-------|
| 4.1 | Onboarding flow (ilk kayıt sonrası bilgi toplama) |
| 4.2 | Randevu sistemi (`appointments` tablosu hazır) |
| 4.3 | Haftalık otomatik rapor |
| 4.4 | Gamification genişletme (daha fazla rozet, streak, puan) |
| 4.5 | Dark mode / tema desteği |
| 4.6 | Çoklu dil desteği (i18n – TR/EN) |
| 4.7 | Web panel (diyetisyen tarafı) |
| 4.8 | Apple HealthKit / Google Fit (adım sayısı) |

---

## 14. Yeni Geliştirici/Codex İçin Önerilen Geliştirme Sırası

### Faz 1: Temel Eksikleri Gider (1-2 gün)

```
1. [HIZLI] Öğün tamamlama DB sync → meals.is_eaten güncelleme
2. [HIZLI] Karşılama mesajını saate göre dinamikleştir
3. [ORTA]  Kalori/makro hesaplama → tamamlanan öğünlerden otomatik toplam
4. [ORTA]  Fallback UX → Supabase'de plan yoksa boş state tasarla
```

### Faz 2: Fotoğraf & Storage (1 gün)

```
5. [ORTA]  Supabase Storage bucket oluştur
6. [ORTA]  Fotoğraf yükleme → expo-image-picker → Storage → meals.photo_url
7. [DÜŞÜK] Profil fotoğrafı değiştirme → Storage → profiles.avatar_url
```

### Faz 3: Öğün Detaylarını Zenginleştir (1 gün)

```
8. [ORTA]  meals tablosuna ingredients/steps alanları ekle (jsonb)
9. [ORTA]  mealService.js'i güncelle → bu alanları parse et
10. [DÜŞÜK] Alışveriş listesini gerçek ingredient verisiyle çalıştır
```

### Faz 4: Placeholder Ekranları Tamamla (2-3 gün)

```
11. [YÜKSEK] Chat ekranı → Supabase Realtime + chat_messages
12. [ORTA]   Settings ekranı → bildirimler, şifre değiştirme, tema
13. [DÜŞÜK]  Support ekranı → SSS + iletişim formu
```

### Faz 5: Rozet Sistemi & Gamification (1 gün)

```
14. [ORTA]  getBadges() → gerçek veriye dayalı rozet hesaplama
15. [DÜŞÜK] Streak sistemi → art arda gün takibi
```

### Faz 6: Altyapı İyileştirmeleri (1-2 gün)

```
16. [ORTA]  styles.js modülerleştirme
17. [DÜŞÜK] Error boundary ekleme
18. [ORTA]  Loading/skeleton UI
19. [ORTA]  Context memoization
20. [DÜŞÜK] console.log temizliği
21. [DÜŞÜK] Backup dizinlerini silme
```

### ⚠️ Codex İçin Önemli Notlar

> [!IMPORTANT]
> 1. **MVVM pattern'ını koru!** Tüm Supabase çağrıları sadece `services/` katmanından yapılmalı. Screen'lere doğrudan DB çağrısı yazma.
> 2. **`MOBILE_AI_PROMPT.md` dosyasını oku!** Projenin kodlama kuralları, dosya isimlendirme ve mimari standartları orada tanımlı.
> 3. **`schema.json` dosyası Supabase şemasıdır.** Tablo yapılarını, ilişkileri ve enum'ları burada bulabilirsin.
> 4. **JavaScript kullan, TypeScript kullanma!** Proje bilinçli olarak JS ile yazılmıştır.
> 5. **UI metinleri Türkçe, kod ve yorumlar İngilizce** olmalı.
> 6. **Supabase Anon Key** `.env`'de açık duruyor ama bu mobil uygulama için normaldir. RLS kurallarına güveniliyor.
> 7. **`config/dietData.js`'deki `meals` array artık aktif olarak kullanılmıyor.** Öğünler Supabase'den çekiliyor ama `macros` ve `getDayOptions`/`getDateFromWeekIndex` yardımcı fonksiyonları hâlâ kullanılıyor.

---

## Dosya İstatistikleri (Güncel – 27 Haziran 2026)

| Metrik | Değer |
|--------|-------|
| Toplam kaynak dosya sayısı | 28 dosya |
| Toplam kaynak kodu boyutu | ~170KB+ |
| En büyük dosya | `ProfileScreen.js` (~33KB) |
| Tamamlanmış ekran sayısı | 4 (Auth, Dashboard, Meals, Analysis) |
| Placeholder ekran sayısı | 3 (Chat, Settings, Support) |
| Feature modülü | 4 (auth, clients, meals, analytics) |
| Supabase'e bağlı servis | 6 (authService, clientService, dailyLogService, mealService, mealChangeRequestService, analyticsService) |
| Mock fonksiyon sayısı | 2 (getDailyQuote, getBadges) |
| ViewModel dosyası | 5 (useAuth, useDashboard, useProfile, useMeals, useAnalytics) |
| DB tablosu (aktif kullanılan) | 11/16 |
| DB tablosu (kullanılmayan) | 5 (dietitian_profiles, measurements, chat_messages, appointments, dietitian_clients kısmen) |

---

*Bu doküman, projenin 27 Haziran 2026 tarihindeki **güncel durumunu** yansıtmaktadır. 8 Mart 2026 tarihli `TECHNICAL_REPORT.md` artık outdated'tır – bu doküman onu supersede eder.*
