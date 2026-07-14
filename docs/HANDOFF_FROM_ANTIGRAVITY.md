# DietBridge â€“ Codex'e Teknik Devir DokÃ¼manÄ±

**Tarih:** 27 Haziran 2026  
**HazÄ±rlayan:** Antigravity AI (Ã¶nceki geliÅŸtirici AI agent)  
**Hedef:** Codex AI coding agent'a tam proje devri  
**Proje Konumu:** `c:\Users\drsam\Desktop\Yeni klasÃ¶r\dietBridge - Kopya`

---

## 1. Projenin AmacÄ± ve Genel KapsamÄ±

**DietBridge**, diyetisyenler ile danÄ±ÅŸanlarÄ± arasÄ±nda kÃ¶prÃ¼ kuran bir saÄŸlÄ±k ve beslenme takip platformudur.

### Ä°ki TaraflÄ± Platform YapÄ±sÄ±

| Taraf | Platform | Durum |
|-------|----------|-------|
| **DanÄ±ÅŸan (Client)** | React Native + Expo Mobil Uygulama | âš ï¸ Aktif geliÅŸtirmede (bu proje) |
| **Diyetisyen (Dietitian)** | Web Panel | âŒ HenÃ¼z baÅŸlanmamÄ±ÅŸ |

### Ana KullanÄ±m Senaryosu

1. Diyetisyen, web panelden danÄ±ÅŸana haftalÄ±k Ã¶ÄŸÃ¼n planÄ± atar
2. DanÄ±ÅŸan, mobil uygulamadan gÃ¼nlÃ¼k Ã¶ÄŸÃ¼nlerini gÃ¶rÃ¼ntÃ¼ler
3. DanÄ±ÅŸan her Ã¶ÄŸÃ¼nÃ¼ yediÄŸinde tamamlama iÅŸareti koyar (opsiyonel fotoÄŸraf)
4. DanÄ±ÅŸan su tÃ¼ketimini ve kilosunu takip eder
5. DanÄ±ÅŸan ilerleme analizlerini (kilo deÄŸiÅŸimi, vÃ¼cut Ã¶lÃ§Ã¼leri) izler
6. DanÄ±ÅŸan, beÄŸenmediÄŸi Ã¶ÄŸÃ¼nler iÃ§in deÄŸiÅŸiklik talep eder
7. Diyetisyen web panelden talepleri gÃ¶rÃ¼p planÄ± gÃ¼nceller

### Genel Durum: **Erken MVP â†’ MVP GeÃ§iÅŸ AÅŸamasÄ±**

Ä°lk raporla (8 Mart 2026) karÅŸÄ±laÅŸtÄ±rÄ±ldÄ±ÄŸÄ±nda, Ã¶nemli ilerlemeler kaydedilmiÅŸtir:
- Auth sistemi geniÅŸletildi (kayÄ±t sonrasÄ± `profiles` + `client_profiles` otomatik oluÅŸturma)
- Profil yÃ¶netimi tamamen Supabase'e baÄŸlandÄ± (CRUD)
- Su takibi ve kilo takibi Supabase `daily_logs` tablosuna baÄŸlandÄ±
- Ã–ÄŸÃ¼n verisi Supabase `meal_plans` + `meals` tablolarÄ±ndan Ã§ekilmeye baÅŸlandÄ±
- Analytics servisleri Supabase'e baÄŸlandÄ± (kilo geÃ§miÅŸi, su geÃ§miÅŸi, vÃ¼cut Ã¶lÃ§Ã¼leri)
- Ã–ÄŸÃ¼n deÄŸiÅŸikliÄŸi talebi Supabase'e baÄŸlandÄ±
- JSDoc type tanÄ±mlarÄ± eklendi (`lib/types.js`)

---

## 2. KullanÄ±lan Teknoloji Stack'i

| Katman | Teknoloji | Versiyon |
|--------|-----------|----------|
| Framework | React Native + Expo | Expo ^54.0.23 |
| React | React | 19.1.0 |
| React Native | React Native | 0.81.5 |
| Dil | JavaScript (TypeScript devDep var ama kullanÄ±lmÄ±yor) | â€” |
| Backend | Supabase (Auth, Postgres) | ^2.84.0 |
| Navigation | React Navigation v6 | native ^6.1.18, bottom-tabs ^6.6.1, native-stack ^6.10.1 |
| State Management | React Context API + React Hooks | â€” |
| Font | @expo-google-fonts/inter | ^0.4.2 |
| Icons | @expo/vector-icons (Ionicons) | ^15.0.3 |
| Storage (lokal) | @react-native-async-storage | ^2.2.0 |
| Image Picker | expo-image-picker | ^17.0.8 |
| Gradient | expo-linear-gradient | ^15.0.7 |
| SVG | react-native-svg | 15.12.1 |
| URL Polyfill | react-native-url-polyfill | ^3.0.0 |

### Mimari Pattern: MVVM (Modelâ€“Viewâ€“ViewModel)

- **View (screens/):** UI kompozisyonu â€“ sadece layout ve kullanÄ±cÄ± etkileÅŸimi
- **ViewModel (viewmodels/):** `useXxxViewModel` ÅŸeklinde custom hook'lar â€“ state yÃ¶netimi ve iÅŸ mantÄ±ÄŸÄ±
- **Model/Service (services/):** Supabase eriÅŸim katmanÄ± â€“ tÃ¼m CRUD iÅŸlemleri

> [!IMPORTANT]
> Proje JavaScript ile yazÄ±lmÄ±ÅŸtÄ±r. TypeScript `devDependencies`'de var ama **aktif olarak kullanÄ±lmÄ±yor**. TÃ¼m dosyalar `.js` uzantÄ±lÄ±dÄ±r. JSDoc ile tip tanÄ±mlarÄ± (`lib/types.js`) yapÄ±lmÄ±ÅŸ ama zorlayÄ±cÄ± bir tÃ¼r kontrolÃ¼ yoktur.

---

## 3. KlasÃ¶r YapÄ±sÄ± ve Ã–nemli DosyalarÄ±n GÃ¶revi

```
dietBridge - Kopya/
â”œâ”€â”€ App.js                                    # Ana entry point (auth check, font loading, navigation)
â”œâ”€â”€ app.json                                  # Expo konfigÃ¼rasyonu (minimal)
â”œâ”€â”€ package.json                              # BaÄŸÄ±mlÄ±lÄ±klar ve script'ler
â”œâ”€â”€ .env                                      # Supabase URL + Anon Key
â”œâ”€â”€ tsconfig.json                             # TypeScript config (minimal, kullanÄ±lmÄ±yor)
â”œâ”€â”€ schema.json                               # Supabase veritabanÄ± ÅŸema tanÄ±mlarÄ± (16 tablo)
â”œâ”€â”€ MOBILE_AI_PROMPT.md                       # AI geliÅŸtirme rehberi/kurallar dokÃ¼manÄ±
â”œâ”€â”€ TECHNICAL_REPORT.md                       # 8 Mart 2026 tarihli eski teknik rapor (OUTDATED)
â”‚
â”œâ”€â”€ assets/
â”‚   â”œâ”€â”€ logo.png                              # Uygulama logosu
â”‚   â””â”€â”€ meal_icon.png                         # Ã–ÄŸÃ¼n ikonu
â”‚
â”œâ”€â”€ apps/mobile/src/
â”‚   â”œâ”€â”€ config/
â”‚   â”‚   â””â”€â”€ dietData.js                       # Statik/fallback diyet verileri + tarih yardÄ±mcÄ± fonk.
â”‚   â”‚
â”‚   â”œâ”€â”€ lib/
â”‚   â”‚   â”œâ”€â”€ supabaseClient.js                 # Supabase client tanÄ±mÄ± + auto refresh
â”‚   â”‚   â””â”€â”€ types.js                          # JSDoc tip tanÄ±mlarÄ± (Profile, DailyLog, Measurement vb.)
â”‚   â”‚
â”‚   â”œâ”€â”€ navigation/
â”‚   â”‚   â”œâ”€â”€ RootNavigator.js                  # Stack navigator (MainTabs + Profile/Settings/Support)
â”‚   â”‚   â””â”€â”€ MainTabs.js                       # Bottom tab navigator (4 tab)
â”‚   â”‚
â”‚   â”œâ”€â”€ shared/
â”‚   â”‚   â””â”€â”€ theme/
â”‚   â”‚       â”œâ”€â”€ fonts.js                      # Font tanÄ±mlarÄ± (Inter) + Text.defaultProps override
â”‚   â”‚       â””â”€â”€ styles.js                     # Global StyleSheet (~15KB, tÃ¼m ekranlarÄ±n stilleri)
â”‚   â”‚
â”‚   â””â”€â”€ features/
â”‚       â”œâ”€â”€ auth/
â”‚       â”‚   â”œâ”€â”€ screens/AuthScreen.js          # GiriÅŸ/kayÄ±t ekranÄ± (~13KB)
â”‚       â”‚   â”œâ”€â”€ services/authService.js        # signIn, signUp, signOut + profiles upsert
â”‚       â”‚   â””â”€â”€ viewmodels/useAuthViewModel.js # Auth form state yÃ¶netimi
â”‚       â”‚
â”‚       â”œâ”€â”€ clients/
â”‚       â”‚   â”œâ”€â”€ components/
â”‚       â”‚   â”‚   â””â”€â”€ NutritionSummaryCard.js    # SVG circular progress + makro bar'lar
â”‚       â”‚   â”œâ”€â”€ screens/
â”‚       â”‚   â”‚   â”œâ”€â”€ DashboardScreen.js         # Ana sayfa (~21KB)
â”‚       â”‚   â”‚   â”œâ”€â”€ ProfileScreen.js           # Profil dÃ¼zenleme (~33KB) â† EN BÃœYÃœK DOSYA
â”‚       â”‚   â”‚   â”œâ”€â”€ SettingsScreen.js          # Placeholder (~1.4KB)
â”‚       â”‚   â”‚   â”œâ”€â”€ SupportScreen.js           # Placeholder (~1.4KB)
â”‚       â”‚   â”‚   â””â”€â”€ ChatScreen.js              # Placeholder (~393B)
â”‚       â”‚   â”œâ”€â”€ services/
â”‚       â”‚   â”‚   â”œâ”€â”€ clientService.js            # Profil CRUD + kataloglar (~9.6KB) â† SUPABASE AKTIF
â”‚       â”‚   â”‚   â””â”€â”€ dailyLogService.js          # Su + kilo gÃ¼nlÃ¼k kaydÄ± (~2.8KB) â† SUPABASE AKTIF
â”‚       â”‚   â””â”€â”€ viewmodels/
â”‚       â”‚       â”œâ”€â”€ useDashboardViewModel.js    # Dashboard state (~6.5KB) â† SUPABASE AKTIF
â”‚       â”‚       â””â”€â”€ useProfileViewModel.js      # Profil dÃ¼zenleme state (~11.8KB) â† SUPABASE AKTIF
â”‚       â”‚
â”‚       â”œâ”€â”€ meals/
â”‚       â”‚   â”œâ”€â”€ context/MealsContext.js         # completedMeals global state (Context)
â”‚       â”‚   â”œâ”€â”€ screens/MealsScreen.js          # Ã–ÄŸÃ¼n listesi (~18KB)
â”‚       â”‚   â”œâ”€â”€ services/
â”‚       â”‚   â”‚   â”œâ”€â”€ mealService.js              # GÃ¼nlÃ¼k Ã¶ÄŸÃ¼n Ã§ekme (~1.8KB) â† SUPABASE AKTIF
â”‚       â”‚   â”‚   â””â”€â”€ mealChangeRequestService.js # Ã–ÄŸÃ¼n deÄŸiÅŸikliÄŸi talebi (~1.2KB) â† SUPABASE AKTIF
â”‚       â”‚   â””â”€â”€ viewmodels/useMealsViewModel.js # Ã–ÄŸÃ¼n state yÃ¶netimi (~6.8KB)
â”‚       â”‚
â”‚       â””â”€â”€ analytics/
â”‚           â”œâ”€â”€ screens/AnalysisScreen.js       # Analiz ekranÄ± (~22KB)
â”‚           â”œâ”€â”€ services/analyticsService.js    # Kilo/Ã¶lÃ§Ã¼/su geÃ§miÅŸi (~5.4KB) â† SUPABASE AKTIF
â”‚           â””â”€â”€ viewmodels/useAnalyticsViewModel.js # Analiz state (~4.4KB)
â”‚
â”œâ”€â”€ src_backup/                                # Eski kaynak yedekleri (temizlenmeli)
â””â”€â”€ lib_backup/                                # Eski lib yedekleri (temizlenmeli)
```

### Navigation YapÄ±sÄ±

```
App.js
  â””â”€ MealsProvider (Context)
     â””â”€ NavigationContainer
        â”œâ”€ [session yok] â†’ AuthScreen (giriÅŸ/kayÄ±t)
        â””â”€ [session var] â†’ RootNavigator (NativeStackNavigator)
           â”œâ”€ MainTabs (BottomTabNavigator)
           â”‚   â”œâ”€ "Ana Sayfa" â†’ DashboardScreen
           â”‚   â”œâ”€ "Ã–ÄŸÃ¼nler"  â†’ MealsScreen
           â”‚   â”œâ”€ "Analiz"   â†’ AnalysisScreen
           â”‚   â””â”€ "Sohbet"   â†’ ChatScreen (placeholder)
           â”œâ”€ "Profile"  â†’ ProfileScreen
           â”œâ”€ "Settings" â†’ SettingsScreen (placeholder)
           â””â”€ "Support"  â†’ SupportScreen (placeholder)
```

---

## 4. Tamamlanan Ã–zellikler

### âœ… Tam Ã‡alÄ±ÅŸan (Supabase BaÄŸlantÄ±lÄ±)

| Ã–zellik | Dosya(lar) | Detay |
|---------|-----------|-------|
| **KullanÄ±cÄ± giriÅŸi** | `authService.js` | `supabase.auth.signInWithPassword()` |
| **KullanÄ±cÄ± kaydÄ±** | `authService.js` | signUp + `profiles` ve `client_profiles` tablosuna otomatik upsert |
| **Oturum yÃ¶netimi** | `App.js`, `supabaseClient.js` | getSession, onAuthStateChange, auto token refresh |
| **Ã‡Ä±kÄ±ÅŸ yapma** | `clientService.js` | `supabase.auth.signOut()` |
| **Profil gÃ¶rÃ¼ntÃ¼leme** | `clientService.js` â†’ `useProfileViewModel` | `profiles` + `client_profiles` + `blood_types` + `client_medical_conditions` + `client_medications` tablolarÄ± JOIN |
| **Profil dÃ¼zenleme** | `clientService.js` â†’ `updateClientProfile()` | Ä°sim, kilo, boy, hedef, kan grubu, kronik hastalÄ±klar, ilaÃ§lar, yaÅŸam tarzÄ± CRUD |
| **TÄ±bbi bilgi yÃ¶netimi** | `clientService.js` | Kronik hastalÄ±k/ilaÃ§ ekleme Ã§Ä±karma (many-to-many iliÅŸki) |
| **Su takibi (kayÄ±t)** | `dailyLogService.js` | `daily_logs` tablosuna upsert, optimistic UI |
| **Kilo takibi (kayÄ±t)** | `dailyLogService.js` | `daily_logs` + `client_profiles` sync |
| **GÃ¼nlÃ¼k Ã¶ÄŸÃ¼n Ã§ekme** | `mealService.js` | `meal_plans` + `meals` tablosundan JOIN query |
| **Ã–ÄŸÃ¼n deÄŸiÅŸikliÄŸi talebi** | `mealChangeRequestService.js` | `meal_change_requests` tablosuna insert, `dietitian_clients` iliÅŸkisi Ã¼zerinden diyetisyen bulma |
| **Kilo geÃ§miÅŸi grafiÄŸi** | `analyticsService.js` | `daily_logs` tablosundan son 5 kayÄ±t |
| **Su tÃ¼ketimi geÃ§miÅŸi** | `analyticsService.js` | `daily_logs` tablosundan son 7 gÃ¼n |
| **VÃ¼cut Ã¶lÃ§Ã¼leri gÃ¶rÃ¼ntÃ¼leme** | `analyticsService.js` | `body_measurements` tablosundan en son kayÄ±t |
| **VÃ¼cut Ã¶lÃ§Ã¼leri kaydetme** | `analyticsService.js` | `body_measurements` tablosuna upsert |
| **Katalog verileri Ã§ekme** | `clientService.js` | `blood_types`, `medical_conditions`, `medications_catalog` tablolarÄ± |

### âœ… UI TamamlanmÄ±ÅŸ (Frontend Ã‡alÄ±ÅŸÄ±yor)

| Ã–zellik | Detay |
|---------|-------|
| KullanÄ±cÄ± karÅŸÄ±lama | Supabase'den isim Ã§ekme |
| NutritionSummaryCard | SVG circular progress + macro bar'lar (ancak deÄŸerler hÃ¢lÃ¢ hardcoded) |
| Su takip kartÄ± | Progress bar + ml input + artÄ±r/azalt butonlarÄ± |
| Kilo kayÄ±t kartÄ± | TextInput + kaydet butonu |
| SÄ±radaki Ã¶ÄŸÃ¼n kartÄ± | Ã–ÄŸÃ¼n bilgileri, tamamlama, fotoÄŸraf ekleme |
| Ã–ÄŸÃ¼n detay modal'Ä± | Malzemeler + hazÄ±rlanÄ±ÅŸ adÄ±mlarÄ± |
| Sidebar modal | Profil, Ayarlar, Destek navigasyonu |
| HaftalÄ±k gÃ¼n seÃ§imi | Pzt-Paz tarih etiketli |
| AlÄ±ÅŸveriÅŸ listesi | Malzeme birleÅŸtirme + checkbox'lÄ± modal |
| Ã–ÄŸÃ¼n deÄŸiÅŸikliÄŸi talep modal'Ä± | GÃ¼n + Ã¶ÄŸÃ¼n seÃ§imi + mesaj |
| Kilo grafiÄŸi | HaftalÄ±k bar chart, interactive tooltip |
| VÃ¼cut Ã¶lÃ§Ã¼leri kartlarÄ± | Bel, KalÃ§a, Kol + dÃ¼zenleme modu |
| Su tÃ¼ketimi analizi | HaftalÄ±k bar chart |
| Rozetler | Gamification badge'leri |
| Profil dÃ¼zenleme ekranÄ± | Inline edit + modal edit + kataloglardan seÃ§im |

---

## 5. YarÄ±m Kalan veya Eksik Ã–zellikler

### âŒ Tamamen Placeholder Ekranlar

| Ekran | Dosya | Durum |
|-------|-------|-------|
| **ChatScreen** | `ChatScreen.js` (393B) | Sadece "Sohbet ekranÄ± yakÄ±nda." text'i |
| **SettingsScreen** | `SettingsScreen.js` (~1.4KB) | Sadece "Uygulama AyarlarÄ±" baÅŸlÄ±ÄŸÄ± |
| **SupportScreen** | `SupportScreen.js` (~1.4KB) | Sadece "YardÄ±m ve Destek" baÅŸlÄ±ÄŸÄ± |

### âš ï¸ YarÄ±m Kalan Ä°ÅŸlevler

| Ä°ÅŸlev | Durum | Detay |
|-------|-------|-------|
| **Kalori/makro takibi** | Hardcoded | `DashboardScreen`'deki NutritionSummaryCard deÄŸerleri statik, Ã¶ÄŸÃ¼nlerin kalorilerinden hesaplanmÄ±yor |
| **Makro hedefleri** | Hardcoded | `config/dietData.js` iÃ§inde statik macro tanÄ±mlarÄ± |
| **Ã–ÄŸÃ¼n tamamlama DB kaydÄ±** | âŒ Eksik | `MealsContext` sadece local state tutuyor, DB'ye `is_eaten` flag gÃ¼ncellenmiyor |
| **FotoÄŸraf yÃ¼kleme** | âŒ Eksik | FotoÄŸraf sadece lokal URI olarak tutuluyor, Supabase Storage'a yÃ¼klenmiyor |
| **Bildirim sistemi** | âŒ Eksik | Toggle var ama `expo-notifications` entegrasyonu yok |
| **Åifre deÄŸiÅŸtirme** | âŒ Eksik | Alert ile "yakÄ±nda" mesajÄ± |
| **Profil fotoÄŸrafÄ± deÄŸiÅŸtirme** | âŒ Eksik | Edit badge gÃ¶rÃ¼nÃ¼yor ama fonksiyonu yok |
| **HaftalÄ±k plan farklÄ±lÄ±ÄŸÄ±** | âš ï¸ KÄ±smi | Supabase'den gÃ¼n bazlÄ± Ã§ekiliyor ama Supabase'de veri yoksa fallback yok (boÅŸ liste gÃ¶sterir) |
| **AlÄ±ÅŸveriÅŸ listesi** | âš ï¸ KÄ±smi | `ingredients` alanÄ± Supabase `meals` tablosunda tanÄ±mlÄ± deÄŸil, boÅŸ dizi dÃ¶nÃ¼yor |
| **Rozet sistemi** | Hardcoded | `getBadges()` hÃ¢lÃ¢ statik array dÃ¶nÃ¼yor |
| **AdÄ±m sayacÄ±** | âŒ Eksik | Health API entegrasyonu yok |

---

## 6. Mock Ã‡alÄ±ÅŸan KÄ±sÄ±mlar

> [!WARNING]
> AÅŸaÄŸÄ±daki kÄ±sÄ±mlar UI'da Ã§alÄ±ÅŸÄ±r gÃ¶rÃ¼nÃ¼r ama veriler gerÃ§ek deÄŸildir. Supabase'e baÄŸlanmamÄ±ÅŸlardÄ±r.

| KÄ±sÄ±m | Dosya | Mock KaynaÄŸÄ± |
|-------|-------|-------------|
| **NutritionSummaryCard (Kalori/Makro)** | `DashboardScreen.js` + `config/dietData.js` | Kalori 1050/1800 ve makro deÄŸerleri `dietData.js` iÃ§inde hardcoded |
| **Motivasyon alÄ±ntÄ±larÄ±** | `clientService.js:226-237` | Statik TÃ¼rkÃ§e quotes array'den rastgele seÃ§im |
| **Rozetler** | `analyticsService.js:167-173` | Statik 3 rozet: Su Åampiyonu, Ä°lk 5 Kilo, 7 GÃ¼nlÃ¼k Seri |
| **AdÄ±m sayÄ±sÄ±** | `DashboardScreen.js` | UI'da gÃ¶steriliyorsa hardcoded deÄŸer |
| **Ã–ÄŸÃ¼n malzemeleri ve adÄ±mlarÄ±** | `mealService.js:56-57` | DB'den gelen Ã¶ÄŸÃ¼nlerde `ingredients: []` ve `steps: []` olarak fallback |
| **Fallback diyet verileri** | `config/dietData.js:37-72` | Supabase'de Ã¶ÄŸÃ¼n yoksa gÃ¶sterilecek fallback veriler (ama ÅŸu an aktif olarak kullanÄ±lmÄ±yor, her gÃ¼n boÅŸ gelir) |
| **KarÅŸÄ±lama mesajÄ±** | `DashboardScreen.js` | Saate gÃ¶re dinamik deÄŸil, her zaman aynÄ± |

---

## 7. GerÃ§ek Backend/Supabase BaÄŸlantÄ±sÄ± Olan KÄ±sÄ±mlar

### Supabase Client KonfigÃ¼rasyonu

```
Dosya: apps/mobile/src/lib/supabaseClient.js
```

- AsyncStorage ile session persistence âœ…
- Auto refresh token âœ…
- AppState listener ile arka plan/Ã¶n plan token yÃ¶netimi âœ…
- `detectSessionInUrl: false` (mobil uygulama iÃ§in doÄŸru) âœ…
- `.env` dosyasÄ±ndan EXPO_PUBLIC_SUPABASE_URL ve EXPO_PUBLIC_SUPABASE_ANON_KEY âœ…

### Aktif Supabase BaÄŸlantÄ±larÄ± â€“ Servis BazlÄ±

#### `authService.js` â€“ âœ… TAMAMEN BAÄLI
```
supabase.auth.signInWithPassword()     â†’ GiriÅŸ
supabase.auth.signUp()                 â†’ KayÄ±t
supabase.auth.signOut()                â†’ Ã‡Ä±kÄ±ÅŸ
supabase.from('profiles').upsert()     â†’ KayÄ±tta profil oluÅŸturma
supabase.from('client_profiles').upsert() â†’ KayÄ±tta danÄ±ÅŸan profili oluÅŸturma
```

#### `clientService.js` â€“ âœ… TAMAMEN BAÄLI
```
supabase.from('profiles').select()         â†’ Profil Ã§ekme (client_profiles JOIN)
supabase.from('blood_types').select()      â†’ Kan grubu Ã§ekme
supabase.from('client_medical_conditions') â†’ Kronik hastalÄ±klar (JOIN medical_conditions)
supabase.from('client_medications')        â†’ Ä°laÃ§lar (JOIN medications_catalog)
supabase.from('profiles').update()         â†’ Ä°sim gÃ¼ncelleme
supabase.from('client_profiles').update()  â†’ Detay gÃ¼ncelleme
supabase.from('medical_conditions').insert/select â†’ Yeni hastalÄ±k ekleme
supabase.from('medications_catalog').insert/select â†’ Yeni ilaÃ§ ekleme
supabase.from('client_medical_conditions').delete/insert â†’ Ã‡oklu iliÅŸki gÃ¼ncelleme
supabase.from('client_medications').delete/insert â†’ Ã‡oklu iliÅŸki gÃ¼ncelleme
supabase.from('daily_logs').select/update/insert â†’ Kilo sync
supabase.from('blood_types').select()      â†’ Katalog
supabase.from('medical_conditions').select() â†’ Katalog
supabase.from('medications_catalog').select() â†’ Katalog
```

#### `dailyLogService.js` â€“ âœ… TAMAMEN BAÄLI
```
supabase.from('daily_logs').select()   â†’ GÃ¼nlÃ¼k log Ã§ekme
supabase.from('daily_logs').update()   â†’ Su/kilo gÃ¼ncelleme
supabase.from('daily_logs').insert()   â†’ Yeni gÃ¼nlÃ¼k log oluÅŸturma
supabase.from('client_profiles').update() â†’ Kilo sync
```

#### `mealService.js` â€“ âœ… BAÄLI
```
supabase.from('meal_plans').select('id, plan_date, notes, meals (*)') â†’ GÃ¼nlÃ¼k Ã¶ÄŸÃ¼n planÄ± Ã§ekme
```

#### `mealChangeRequestService.js` â€“ âœ… BAÄLI
```
supabase.from('dietitian_clients').select() â†’ Aktif diyetisyen bulma
supabase.from('meal_change_requests').insert() â†’ Talep oluÅŸturma
```

#### `analyticsService.js` â€“ âœ… BÃœYÃœK Ã–LÃ‡ÃœDE BAÄLI
```
supabase.from('daily_logs').select()          â†’ Kilo geÃ§miÅŸi (son 5)
supabase.from('body_measurements').select()   â†’ VÃ¼cut Ã¶lÃ§Ã¼leri
supabase.from('body_measurements').update/insert() â†’ Ã–lÃ§Ã¼ kaydetme
supabase.from('daily_logs').select()          â†’ Su geÃ§miÅŸi (son 7 gÃ¼n)
getBadges() â†’ âŒ HÃ‚LÃ‚ MOCK (statik array)
```

### Supabase VeritabanÄ± TablolarÄ± (schema.json'dan)

VeritabanÄ±nda tanÄ±mlÄ± 16 tablo:

| Tablo | KullanÄ±m Durumu | AÃ§Ä±klama |
|-------|-----------------|----------|
| `profiles` | âœ… Aktif | KullanÄ±cÄ± temel profili (id, email, full_name, avatar_url, role) |
| `client_profiles` | âœ… Aktif | DanÄ±ÅŸan detaylarÄ± (kilo, boy, hedef, yaÅŸam tarzÄ±) |
| `dietitian_profiles` | âŒ KullanÄ±lmÄ±yor | Diyetisyen profili (Ã¼niversite, uzmanlÄ±k, diploma) |
| `dietitian_clients` | âœ… KÄ±smi | Diyetisyen-danÄ±ÅŸan iliÅŸkisi (sadece meal change request'te okunuyor) |
| `meal_plans` | âœ… Aktif | GÃ¼nlÃ¼k Ã¶ÄŸÃ¼n planÄ± |
| `meals` | âœ… Aktif | Tek tek Ã¶ÄŸÃ¼nler (type, title, calories, macros, is_eaten) |
| `meal_change_requests` | âœ… Aktif | Ã–ÄŸÃ¼n deÄŸiÅŸikliÄŸi talepleri |
| `daily_logs` | âœ… Aktif | GÃ¼nlÃ¼k su + kilo kaydÄ± |
| `body_measurements` | âœ… Aktif | VÃ¼cut Ã¶lÃ§Ã¼leri (bel, kalÃ§a, kol) |
| `measurements` | âŒ KullanÄ±lmÄ±yor | DetaylÄ± Ã¶lÃ§Ã¼mler (boyun, gÃ¶ÄŸÃ¼s, bacak â€“ henÃ¼z UI'da yok) |
| `blood_types` | âœ… Aktif | Kan grubu katalog tablosu |
| `medical_conditions` | âœ… Aktif | TÄ±bbi durum katalog tablosu |
| `medications_catalog` | âœ… Aktif | Ä°laÃ§ katalog tablosu |
| `client_medical_conditions` | âœ… Aktif | DanÄ±ÅŸan â†” hastalÄ±k many-to-many iliÅŸki |
| `client_medications` | âœ… Aktif | DanÄ±ÅŸan â†” ilaÃ§ many-to-many iliÅŸki |
| `chat_messages` | âŒ KullanÄ±lmÄ±yor | Sohbet mesajlarÄ± (tablo tanÄ±mlÄ±, UI yok) |
| `appointments` | âŒ KullanÄ±lmÄ±yor | Randevular (tablo tanÄ±mlÄ±, UI yok) |

---

## 8. Auth YapÄ±sÄ± NasÄ±l Ã‡alÄ±ÅŸÄ±yor?

### Auth Flow

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  App.js     â”‚     â”‚ supabaseClientâ”‚     â”‚  Supabase Auth       â”‚
â”‚  (entry)    â”‚â”€â”€â”€â”€â–¶â”‚  .js         â”‚â”€â”€â”€â”€â–¶â”‚  Server               â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
       â”‚                                          â”‚
       â”œâ”€ getSession() â†’ mevcut session kontrol   â”‚
       â”œâ”€ onAuthStateChange() â†’ listener          â”‚
       â”‚                                          â”‚
       â”œâ”€ [session var] â†’ RootNavigator           â”‚
       â””â”€ [session yok] â†’ AuthScreen              â”‚
                  â”‚                                â”‚
                  â”œâ”€ signIn(email, pass) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
                  â”‚     â””â†’ signInWithPassword()    â”‚
                  â”‚                                â”‚
                  â””â”€ signUp(email, pass, name) â”€â”€â”€â”€â”¤
                        â”œâ†’ auth.signUp()           â”‚
                        â”œâ†’ profiles.upsert()       â”‚
                        â””â†’ client_profiles.upsert()â”‚
```

### Kritik Detaylar

1. **Session Persistence:** AsyncStorage Ã¼zerinden saklanÄ±yor
2. **Token Refresh:** AppState deÄŸiÅŸikliÄŸinde otomatik (arka plan â†’ Ã¶n plan geÃ§iÅŸinde `startAutoRefresh`)
3. **KayÄ±t SonrasÄ±:** `authService.signUp()` hem auth kaydÄ± yapar hem de `profiles` ve `client_profiles` tablolarÄ±na upsert yapar. Bu, Supabase DB trigger'Ä± olmasa bile profillerin oluÅŸturulmasÄ±nÄ± garantiler.
4. **Retry MekanizmasÄ±:** `getClientProfile()` fonksiyonunda 3 deneme + 500ms bekleme var (DB trigger gecikmesi iÃ§in)
5. **Rol Sistemi:** KayÄ±tta otomatik olarak `role: 'client'` atanÄ±yor (Supabase'de `profiles.role` enum: `dietitian`, `client`)

### Supabase Environment Variables

```env
EXPO_PUBLIC_SUPABASE_URL=https://kagvxhyvxxypspdxcuxz.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs... (JWT token)
```

> [!CAUTION]
> `.env` dosyasÄ± repoda aÃ§Ä±k. `.gitignore`'a eklenmelidir. Anon key mobilde client-side olduÄŸu iÃ§in RLS kurallarÄ±na baÄŸlÄ±. RLS kurallarÄ±nÄ±n Supabase Dashboard'dan kontrol edilmesi gerekir.

---

## 9. Takip Verileri Nasıl Çalışıyor?

### Su Takibi â€“ GerÃ§ek Veri

- KullanÄ±cÄ± ml cinsinden input girer, litre'ye Ã§evrilir
- `dailyLogService.upsertWaterIntake()` ile Supabase `daily_logs` tablosuna kaydedilir
- **Optimistic UI**: Ã¶nce local state gÃ¼ncellenir, hata olursa rollback yapÄ±lÄ±r
- Hedef: 3 litre (hardcoded `waterProgress = Math.min(water / 3, 1)`)
- Maksimum: 5 litre gÃ¼venlik sÄ±nÄ±rÄ±

### Kilo Takibi â€“ GerÃ§ek Veri

- KullanÄ±cÄ± TextInput'tan kilo girer
- `dailyLogService.upsertDailyWeight()` ile hem `daily_logs` hem `client_profiles.current_weight` gÃ¼ncellenir
- GeÃ§erlilik kontrolÃ¼: `0 < weight <= 300`

### Ã–ÄŸÃ¼n Tamamlama â€“ Sadece Local

- `MealsContext` iÃ§inde `completedMeals` state'i tutulur
- FotoÄŸraf URI'si local olarak saklanÄ±r
- **DB'ye yazÄ±lmÄ±yor!** `meals.is_eaten` flag'i gÃ¼ncellenmez

### VÃ¼cut Ã–lÃ§Ã¼leri â€“ GerÃ§ek Veri

- KullanÄ±cÄ± bel/kalÃ§a/kol deÄŸerlerini girer
- `analyticsService.saveBodyMeasurements()` ile Supabase `body_measurements` tablosuna upsert
- Negatif deÄŸer validasyonu var

### Kalori/Makro Takibi â€“ Mock

- `config/dietData.js` iÃ§inde statik makro hedefleri tanÄ±mlÄ±
- GerÃ§ek hesaplama yapÄ±lmÄ±yor
- Ã–ÄŸÃ¼nlerin `calories` ve `macros` alanlarÄ± DB'de var ama UI'da bu deÄŸerler kullanÄ±lmÄ±yor

### AdÄ±m SayacÄ± â€“ Yok

- Apple HealthKit / Google Fit entegrasyonu yok

---

## 10. State Management YapÄ±sÄ± NasÄ±l KurulmuÅŸ?

### Genel Strateji: React Context API + Local State

```
App.js
  â””â”€â”€ MealsProvider (MealsContext)
        â”œâ”€â”€ completedMeals: {} â†’ {mealId: {completed: true, photoUri: 'file://...'}}
        â””â”€â”€ toggleMealCompletion(mealId, photoUri)
```

### Feature BazlÄ± State (ViewModel Hook'larÄ±)

Her ekranÄ±n kendi ViewModel hook'u var. Supabase'den veri Ã§ekme, local state yÃ¶netimi ve iÅŸ mantÄ±ÄŸÄ± burada toplanÄ±yor.

#### `useDashboardViewModel` â€“ State Listesi
| State | Tip | Kaynak | Persist |
|-------|-----|--------|---------|
| `water` | number | Supabase `daily_logs` | âœ… DB |
| `weight` | number | Supabase `daily_logs` | âœ… DB |
| `meals` | array | Supabase `meal_plans` + `meals` | âœ… DB |
| `userName` | string | Supabase `profiles` | âœ… DB |
| `avatarUrl` | string | Supabase `profiles` | âœ… DB |
| `dailyQuote` | string | Mock (statik array) | âŒ |
| `waterInput` | string | Local (TextInput) | âŒ |
| `weightInput` | string | Local (TextInput) | âŒ |
| `focusedMealId` | string | Local (meal focus) | âŒ |
| `isSidebarVisible` | boolean | Local (modal state) | âŒ |
| `selectedMeal` | object | Local (modal state) | âŒ |
| `completedMeals` | object | MealsContext (local) | âŒ Not persisted! |

#### `useProfileViewModel` â€“ State Listesi
| State | Tip | Kaynak | Persist |
|-------|-----|--------|---------|
| `userName` | string | Supabase | âœ… DB |
| `clientData` | object | Supabase (profiles + client_profiles + JOINs) | âœ… DB |
| `isEditing` | boolean | Local | âŒ |
| `editForm` | object | Local (form state) | âŒ |
| `editingField` | string | Local (inline edit) | âŒ |
| `editingValue` | any | Local (inline edit) | âŒ |
| `catalogs` | object | Supabase (blood_types, conditions, medications) | âœ… DB |

#### `useMealsViewModel` â€“ State Listesi
| State | Tip | Kaynak | Persist |
|-------|-----|--------|---------|
| `mealsList` | array | Supabase `meal_plans` + `meals` | âœ… DB |
| `selectedDay` | number | Local (gÃ¼n seÃ§imi) | âŒ |
| `isLoadingMeals` | boolean | Local | âŒ |
| `requestSelectedMeals` | array | Local (modal form) | âŒ |
| `requestMessage` | string | Local (modal form) | âŒ |

#### `useAnalyticsViewModel` â€“ State Listesi
| State | Tip | Kaynak | Persist |
|-------|-----|--------|---------|
| `monthlyWeightTrend` | array | Supabase `daily_logs` | âœ… DB |
| `measurements` | array | Supabase `body_measurements` | âœ… DB |
| `waterHistory` | array | Supabase `daily_logs` | âœ… DB |
| `badges` | array | Mock (statik) | âŒ |
| `measurementForm` | object | Local (edit form) | âŒ |
| `isEditingMeasurements` | boolean | Local | âŒ |

### Veri Yenileme Stratejisi

- `useFocusEffect` kullanÄ±lÄ±yor (tab/ekran focus olduÄŸunda veri yenileniyor)
- Dashboard ve Analytics ekranlarÄ± focus'ta otomatik reload yapar
- Profile ekranÄ± `useEffect` ile ilk mount'ta yÃ¼kler, `getProfile()` ile manual reload yapar
- Meals ekranÄ± `selectedDay` deÄŸiÅŸtiÄŸinde otomatik fetch yapar

> [!WARNING]
> `MealsContext`'teki `completedMeals` verisi **persist edilmiyor**! Uygulama kapanÄ±p aÃ§Ä±ldÄ±ÄŸÄ±nda tÃ¼m Ã¶ÄŸÃ¼n tamamlama iÅŸaretleri sÄ±fÄ±rlanÄ±r. Bu, Supabase `meals.is_eaten` ile sync edilmelidir.

---

## 11. Kurulum ve Ã‡alÄ±ÅŸtÄ±rma KomutlarÄ±

### Ã–n KoÅŸullar

- Node.js (LTS Ã¶nerilir)
- npm
- Expo CLI (`npx expo` ile kullanÄ±labilir)
- iOS Simulator veya Android Emulator veya Expo Go uygulamasÄ±

### Kurulum

```bash
# Proje dizinine git
cd "c:\Users\drsam\Desktop\Yeni klasÃ¶r\dietBridge - Kopya"

# BaÄŸÄ±mlÄ±lÄ±klarÄ± yÃ¼kle
npm install
```

### Ã‡alÄ±ÅŸtÄ±rma

```bash
# Expo dev server'Ä± baÅŸlat
npx expo start

# Veya npm script ile
npm start

# Platform seÃ§enekleri
npm run android    # Android emÃ¼latÃ¶r
npm run ios        # iOS simulator
npm run web        # Web tarayÄ±cÄ± (kÄ±sÄ±tlÄ± destek)
```

### Environment Variables

`.env` dosyasÄ± zaten mevcut ve konfigÃ¼re edilmiÅŸ:
```
EXPO_PUBLIC_SUPABASE_URL=https://kagvxhyvxxypspdxcuxz.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

> [!NOTE]
> Expo `EXPO_PUBLIC_` prefix'i ile baÅŸlayan env deÄŸiÅŸkenlerini otomatik olarak client tarafÄ±nda kullanÄ±ma sunar. `.env` dosyasÄ± deÄŸiÅŸtirilirse Expo dev server yeniden baÅŸlatÄ±lmalÄ±dÄ±r.

---

## 12. Bilinen Hatalar ve Dikkat Edilmesi Gerekenler

### ğŸ”´ Kritik

| # | Sorun | Detay |
|---|-------|-------|
| 1 | **Ã–ÄŸÃ¼n tamamlama DB sync yok** | `completedMeals` sadece React Context'te (RAM'de) tutuluyor. Uygulama kapanÄ±nca sÄ±fÄ±rlanÄ±r. `meals.is_eaten` gÃ¼ncellenmeli. |
| 2 | **RLS kurallarÄ± belirsiz** | Supabase'de RLS kurallarÄ±nÄ±n tanÄ±mlÄ± olup olmadÄ±ÄŸÄ± bilinmiyor. Kontrol edilmeli. |
| 3 | **FotoÄŸraf yÃ¼kleme yok** | `expo-image-picker` ile fotoÄŸraf seÃ§iliyor ama Supabase Storage'a yÃ¼klenmiyor. `meals.photo_url` gÃ¼ncellenmeli. |
| 4 | **`ingredients` ve `steps` alanlarÄ± DB'de yok** | `meals` tablosunda bu alanlar tanÄ±mlÄ± deÄŸil. `mealService.js` fallback olarak boÅŸ array dÃ¶nÃ¼yor. Ã–ÄŸÃ¼n detay modal'Ä± bu yÃ¼zden boÅŸ gelir. |

### ğŸŸ¡ Orta

| # | Sorun | Detay |
|---|-------|-------|
| 5 | **`styles.js` Ã§ok bÃ¼yÃ¼k** | ~15KB tek dosyada tÃ¼m ekranlarÄ±n stilleri. ModÃ¼lerleÅŸtirilmeli. |
| 6 | **`Text.defaultProps` override** | `fonts.js` iÃ§inde global override. React 19'da deprecated olabilir. |
| 7 | **DashboardScreen'deki iÅŸ mantÄ±ÄŸÄ±** | `handleAddPhoto` ve `handleToggleMealCompletion` View iÃ§inde tanÄ±mlÄ±, ViewModel'e taÅŸÄ±nmalÄ±. |
| 8 | **Context re-render sorunu** | `MealsProvider` her state deÄŸiÅŸiminde tÃ¼m consumer'larÄ± re-render eder. `useMemo` ile optimize edilmemiÅŸ. |
| 9 | **ScrollView yerine FlatList** | `MealsScreen` iÃ§inde Ã¶ÄŸÃ¼n listesi ScrollView ile render ediliyor. BÃ¼yÃ¼k listeler iÃ§in FlatList kullanÄ±lmalÄ±. |
| 10 | **Inline style objeler** | BirÃ§ok yerde `style={{ ... }}` kullanÄ±lÄ±yor, her render'da yeni obje oluÅŸturuluyor. |
| 11 | **Console.log/warn temizliÄŸi** | Production build'de loglar kaldÄ±rÄ±lmalÄ±. |
| 12 | **KarÅŸÄ±lama mesajÄ± statik** | Saate gÃ¶re "GÃ¼naydÄ±n/Ä°yi gÃ¼nler/Ä°yi akÅŸamlar" yapÄ±lmalÄ±. |

### ğŸŸ¢ DÃ¼ÅŸÃ¼k

| # | Sorun | Detay |
|---|-------|-------|
| 13 | **Backup dizinleri** | `src_backup/` ve `lib_backup/` temizlenmeli. |
| 14 | **Asset path'leri Ã§ok derin** | `../../../../../../assets/` gibi derin relative path'ler. Babel module resolver ile alias Ã¶nerilir. |
| 15 | **`app.json` minimal** | Icon, splash screen, permissions, schema, version tanÄ±mlarÄ± eksik. |
| 16 | **TECHNICAL_REPORT.md outdated** | 8 Mart 2026 tarihli rapor artÄ±k gÃ¼ncel deÄŸil. Bu dokÃ¼man gÃ¼ncel durumu yansÄ±tÄ±yor. |
| 17 | **`useMealsViewModel.js` yorum satÄ±rlarÄ±** | `meal_slot` ile ilgili uzun inline yorum bÄ±rakÄ±lmÄ±ÅŸ (satÄ±r 76). |

---

## 13. Bundan Sonra GeliÅŸtirilmesi Gereken Ã–ncelikli Ä°ÅŸler

### ğŸ”´ Ã–ncelik 1 â€“ Kritik (Temel Ä°ÅŸlevsellik)

| # | GÃ¶rev | Detay | Efor |
|---|-------|-------|------|
| 1.1 | **Ã–ÄŸÃ¼n tamamlama DB sync** | `meals.is_eaten` flag'ini Supabase'de gÃ¼ncelleyen fonksiyon yazÄ±lmalÄ±. `MealsContext` â†’ `mealService` baÄŸlantÄ±sÄ± kurulmalÄ±. | Orta |
| 1.2 | **FotoÄŸraf yÃ¼kleme (Supabase Storage)** | `expo-image-picker` â†’ Supabase Storage â†’ `meals.photo_url` gÃ¼ncelleme | Orta |
| 1.3 | **Ã–ÄŸÃ¼n detay verisi (ingredients/steps)** | `meals` tablosuna `ingredients` (jsonb) ve `steps` (jsonb) alanlarÄ± eklenmeli veya alternatif yapÄ± kurulmalÄ± | Orta |
| 1.4 | **Kalori/makro hesaplama** | Tamamlanan Ã¶ÄŸÃ¼nlerin `calories` ve `macros` alanlarÄ±ndan otomatik gÃ¼nlÃ¼k toplam hesaplama | Orta |
| 1.5 | **RLS kurallarÄ± kontrol/tanÄ±mlama** | Supabase Dashboard'dan tÃ¼m tablolarÄ±n RLS kurallarÄ± kontrol edilmeli ve eksikler tanÄ±mlanmalÄ± | YÃ¼ksek |
| 1.6 | **Fallback Ã¶ÄŸÃ¼n verisi stratejisi** | Supabase'de plan yoksa (diyetisyen henÃ¼z atamadÄ±ysa) kullanÄ±cÄ±ya ne gÃ¶sterilecek? BoÅŸ state UI? VarsayÄ±lan plan? | DÃ¼ÅŸÃ¼k |

### ğŸŸ¡ Ã–ncelik 2 â€“ Ã–nemli (MVP Tamamlama)

| # | GÃ¶rev | Detay | Efor |
|---|-------|-------|------|
| 2.1 | **Chat ekranÄ±** | `chat_messages` tablosu zaten DB'de var. Supabase Realtime ile anlÄ±k mesajlaÅŸma | YÃ¼ksek |
| 2.2 | **Settings ekranÄ±** | Bildirim tercihleri, tema, hesap yÃ¶netimi (ÅŸifre deÄŸiÅŸtirme dahil) | Orta |
| 2.3 | **Support ekranÄ±** | SSS, iletiÅŸim formu | DÃ¼ÅŸÃ¼k |
| 2.4 | **Rozet sistemi gerÃ§ekleÅŸtirme** | `getBadges()` fonksiyonunu gerÃ§ek verilere dayalÄ± hale getirme (su hedefi tutan gÃ¼n sayÄ±sÄ±, toplam kilo kaybÄ±, streak) | Orta |
| 2.5 | **Profil fotoÄŸrafÄ± deÄŸiÅŸtirme** | Image picker â†’ Supabase Storage â†’ `profiles.avatar_url` gÃ¼ncelleme | Orta |
| 2.6 | **Åifre deÄŸiÅŸtirme** | `supabase.auth.updateUser({ password })` | DÃ¼ÅŸÃ¼k |
| 2.7 | **`completedMeals` persistance** | Context'teki veri AsyncStorage veya Supabase ile persist edilmeli | DÃ¼ÅŸÃ¼k |

### ğŸŸ¢ Ã–ncelik 3 â€“ Ä°yileÅŸtirme (Beta/Production)

| # | GÃ¶rev | Detay | Efor |
|---|-------|-------|------|
| 3.1 | **Global styles modÃ¼lerleÅŸtirme** | `styles.js` â†’ feature bazlÄ± stil dosyalarÄ± | Orta |
| 3.2 | **Error boundary** | React Error Boundary component'leri | DÃ¼ÅŸÃ¼k |
| 3.3 | **Loading/Error state UI** | Skeleton loader ve hata gÃ¶sterimi | Orta |
| 3.4 | **Push notification** | expo-notifications ile Ã¶ÄŸÃ¼n/su hatÄ±rlatma | YÃ¼ksek |
| 3.5 | **Offline support** | AsyncStorage ile cache | YÃ¼ksek |
| 3.6 | **Test altyapÄ±sÄ±** | Jest + React Native Testing Library | YÃ¼ksek |
| 3.7 | **Performance** | FlatList, Context memoization, inline style eliminasyonu | Orta |
| 3.8 | **app.json tam konfigÃ¼rasyon** | Icon, splash screen, permissions | Orta |
| 3.9 | **Saate gÃ¶re karÅŸÄ±lama** | "GÃ¼naydÄ±n/Ä°yi gÃ¼nler/Ä°yi akÅŸamlar" | DÃ¼ÅŸÃ¼k |

### ğŸ”µ Ã–ncelik 4 â€“ Gelecek Ã–zellikler

| # | GÃ¶rev |
|---|-------|
| 4.1 | Onboarding flow (ilk kayÄ±t sonrasÄ± bilgi toplama) |
| 4.2 | Randevu sistemi (`appointments` tablosu hazÄ±r) |
| 4.3 | HaftalÄ±k otomatik rapor |
| 4.4 | Gamification geniÅŸletme (daha fazla rozet, streak, puan) |
| 4.5 | Dark mode / tema desteÄŸi |
| 4.6 | Ã‡oklu dil desteÄŸi (i18n â€“ TR/EN) |
| 4.7 | Web panel (diyetisyen tarafÄ±) |
| 4.8 | Apple HealthKit / Google Fit (adÄ±m sayÄ±sÄ±) |

---

## 14. Yeni GeliÅŸtirici/Codex Ä°Ã§in Ã–nerilen GeliÅŸtirme SÄ±rasÄ±

### Faz 1: Temel Eksikleri Gider (1-2 gÃ¼n)

```
1. [HIZLI] Ã–ÄŸÃ¼n tamamlama DB sync â†’ meals.is_eaten gÃ¼ncelleme
2. [HIZLI] KarÅŸÄ±lama mesajÄ±nÄ± saate gÃ¶re dinamikleÅŸtir
3. [ORTA]  Kalori/makro hesaplama â†’ tamamlanan Ã¶ÄŸÃ¼nlerden otomatik toplam
4. [ORTA]  Fallback UX â†’ Supabase'de plan yoksa boÅŸ state tasarla
```

### Faz 2: FotoÄŸraf & Storage (1 gÃ¼n)

```
5. [ORTA]  Supabase Storage bucket oluÅŸtur
6. [ORTA]  FotoÄŸraf yÃ¼kleme â†’ expo-image-picker â†’ Storage â†’ meals.photo_url
7. [DÃœÅÃœK] Profil fotoÄŸrafÄ± deÄŸiÅŸtirme â†’ Storage â†’ profiles.avatar_url
```

### Faz 3: Ã–ÄŸÃ¼n DetaylarÄ±nÄ± ZenginleÅŸtir (1 gÃ¼n)

```
8. [ORTA]  meals tablosuna ingredients/steps alanlarÄ± ekle (jsonb)
9. [ORTA]  mealService.js'i gÃ¼ncelle â†’ bu alanlarÄ± parse et
10. [DÃœÅÃœK] AlÄ±ÅŸveriÅŸ listesini gerÃ§ek ingredient verisiyle Ã§alÄ±ÅŸtÄ±r
```

### Faz 4: Placeholder EkranlarÄ± Tamamla (2-3 gÃ¼n)

```
11. [YÃœKSEK] Chat ekranÄ± â†’ Supabase Realtime + chat_messages
12. [ORTA]   Settings ekranÄ± â†’ bildirimler, ÅŸifre deÄŸiÅŸtirme, tema
13. [DÃœÅÃœK]  Support ekranÄ± â†’ SSS + iletiÅŸim formu
```

### Faz 5: Rozet Sistemi & Gamification (1 gÃ¼n)

```
14. [ORTA]  getBadges() â†’ gerÃ§ek veriye dayalÄ± rozet hesaplama
15. [DÃœÅÃœK] Streak sistemi â†’ art arda gÃ¼n takibi
```

### Faz 6: AltyapÄ± Ä°yileÅŸtirmeleri (1-2 gÃ¼n)

```
16. [ORTA]  styles.js modÃ¼lerleÅŸtirme
17. [DÃœÅÃœK] Error boundary ekleme
18. [ORTA]  Loading/skeleton UI
19. [ORTA]  Context memoization
20. [DÃœÅÃœK] console.log temizliÄŸi
21. [DÃœÅÃœK] Backup dizinlerini silme
```

### âš ï¸ Codex Ä°Ã§in Ã–nemli Notlar

> [!IMPORTANT]
> 1. **MVVM pattern'Ä±nÄ± koru!** TÃ¼m Supabase Ã§aÄŸrÄ±larÄ± sadece `services/` katmanÄ±ndan yapÄ±lmalÄ±. Screen'lere doÄŸrudan DB Ã§aÄŸrÄ±sÄ± yazma.
> 2. **`MOBILE_AI_PROMPT.md` dosyasÄ±nÄ± oku!** Projenin kodlama kurallarÄ±, dosya isimlendirme ve mimari standartlarÄ± orada tanÄ±mlÄ±.
> 3. **`schema.json` dosyasÄ± Supabase ÅŸemasÄ±dÄ±r.** Tablo yapÄ±larÄ±nÄ±, iliÅŸkileri ve enum'larÄ± burada bulabilirsin.
> 4. **JavaScript kullan, TypeScript kullanma!** Proje bilinÃ§li olarak JS ile yazÄ±lmÄ±ÅŸtÄ±r.
> 5. **UI metinleri TÃ¼rkÃ§e, kod ve yorumlar Ä°ngilizce** olmalÄ±.
> 6. **Supabase Anon Key** `.env`'de aÃ§Ä±k duruyor ama bu mobil uygulama iÃ§in normaldir. RLS kurallarÄ±na gÃ¼veniliyor.
> 7. **`config/dietData.js`'deki `meals` array artÄ±k aktif olarak kullanÄ±lmÄ±yor.** Ã–ÄŸÃ¼nler Supabase'den Ã§ekiliyor ama `macros` ve `getDayOptions`/`getDateFromWeekIndex` yardÄ±mcÄ± fonksiyonlarÄ± hÃ¢lÃ¢ kullanÄ±lÄ±yor.

---

## Dosya Ä°statistikleri (GÃ¼ncel â€“ 27 Haziran 2026)

| Metrik | DeÄŸer |
|--------|-------|
| Toplam kaynak dosya sayÄ±sÄ± | 28 dosya |
| Toplam kaynak kodu boyutu | ~170KB+ |
| En bÃ¼yÃ¼k dosya | `ProfileScreen.js` (~33KB) |
| TamamlanmÄ±ÅŸ ekran sayÄ±sÄ± | 4 (Auth, Dashboard, Meals, Analysis) |
| Placeholder ekran sayÄ±sÄ± | 3 (Chat, Settings, Support) |
| Feature modÃ¼lÃ¼ | 4 (auth, clients, meals, analytics) |
| Supabase'e baÄŸlÄ± servis | 6 (authService, clientService, dailyLogService, mealService, mealChangeRequestService, analyticsService) |
| Mock fonksiyon sayÄ±sÄ± | 2 (getDailyQuote, getBadges) |
| ViewModel dosyasÄ± | 5 (useAuth, useDashboard, useProfile, useMeals, useAnalytics) |
| DB tablosu (aktif kullanÄ±lan) | 11/16 |
| DB tablosu (kullanÄ±lmayan) | 5 (dietitian_profiles, measurements, chat_messages, appointments, dietitian_clients kÄ±smen) |

---

*Bu dokÃ¼man, projenin 27 Haziran 2026 tarihindeki **gÃ¼ncel durumunu** yansÄ±tmaktadÄ±r. 8 Mart 2026 tarihli `TECHNICAL_REPORT.md` artÄ±k outdated'tÄ±r â€“ bu dokÃ¼man onu supersede eder.*

