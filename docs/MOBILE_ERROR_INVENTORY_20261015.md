# Mobil hata envanteri — değişiklik öncesi

15 Ekim 2026. Aktif başlangıç: App.js → AuthNavigator / RootNavigator → feature ekranları ve ViewModel/service katmanları. Üretim verisine yazılmadan kaynak kodu incelendi.

68 açık sonuç/hata kodu, 194 sabit/dinamik hata açıklaması ve 276 hata üretim/gösterim noktası bulundu. İç sonuç kodları kullanıcıya gösterilen hata kodlarından ayrıdır; başarı veya cihaz yeteneği sonuçları da mevcut kod envanterinde yer alır. Kodsuz ve backend hataları aşağıdaki kaynak listesinde ayrıca yer alır.

## Mevcut açık kodlar

| Kod | Kaynak |
|---|---|
| ACCOUNT_DELETION_CLEANUP_NOT_PENDING | apps/mobile/src/features/auth/services/authService.js:225 |
| ACCOUNT_DELETION_CLEANUP_SESSION_MISMATCH | apps/mobile/src/features/auth/services/authService.js:213 |
| ACCOUNT_DELETION_LOCAL_SIGNOUT_FAILED | apps/mobile/src/features/auth/services/authService.js:248 |
| ACCOUNT_DELETION_MARKER_CLEAR_FAILED | apps/mobile/src/features/auth/services/authService.js:262 |
| ACCOUNT_DELETION_MARKER_MISMATCH | apps/mobile/src/features/auth/services/accountDeletionService.js:130, apps/mobile/src/features/auth/services/accountDeletionStateStore.js:79 |
| ACCOUNT_DELETION_PHASE_INVALID | apps/mobile/src/features/auth/services/accountDeletionStateStore.js:59, apps/mobile/src/features/auth/services/accountDeletionStateStore.js:74 |
| ACCOUNT_DELETION_PHASE_SAVE_FAILED | apps/mobile/src/features/auth/services/accountDeletionService.js:173, apps/mobile/src/features/auth/services/accountDeletionStateStore.js:89 |
| ACCOUNT_DELETION_RESPONSE_INVALID | apps/mobile/src/features/auth/services/accountDeletionService.js:215 |
| ACCOUNT_DELETION_SESSION_MISMATCH | apps/mobile/src/features/auth/services/accountDeletionService.js:98 |
| ACCOUNT_DELETION_STATE_CLEAR_FAILED | apps/mobile/src/features/auth/services/accountDeletionStateStore.js:98 |
| ACCOUNT_DELETION_STATE_INVALID | apps/mobile/src/features/auth/services/accountDeletionService.js:113 |
| ACCOUNT_DELETION_STATE_MALFORMED | apps/mobile/src/features/auth/services/accountDeletionStateStore.js:117, apps/mobile/src/features/auth/services/accountDeletionStateStore.js:136 |
| ACCOUNT_DELETION_STATE_READ_FAILED | apps/mobile/src/features/auth/services/accountDeletionService.js:106, apps/mobile/src/features/auth/services/accountDeletionStateStore.js:77, apps/mobile/src/features/auth/services/accountDeletionStateStore.js:108, apps/mobile/src/features/auth/services/authService.js:136, apps/mobile/src/features/auth/services/authService.js:203 |
| ACCOUNT_DELETION_STATE_SAVE_FAILED | apps/mobile/src/features/auth/services/accountDeletionService.js:143, apps/mobile/src/features/auth/services/accountDeletionStateStore.js:68 |
| ACCOUNT_DELETION_TRANSPORT_FAILED | apps/mobile/src/features/auth/services/accountDeletionService.js:157 |
| ACCOUNT_DELETION_USER_INVALID | apps/mobile/src/features/auth/services/accountDeletionStateStore.js:58, apps/mobile/src/features/auth/services/accountDeletionStateStore.js:73 |
| AMBIGUOUS_FAILURE | apps/mobile/src/features/auth/services/accountDeletionService.js:15 |
| CHANNEL_ERROR | apps/mobile/src/features/chat/utils/chatRealtimePolicy.js:38, apps/mobile/src/features/notifications/utils/notificationRealtimePolicy.cjs:19 |
| CHAT_RATE_LIMIT | apps/mobile/src/features/chat/services/chatMediaService.js:7 |
| DAILY_LOG_ | apps/mobile/src/features/clients/services/dailyLogService.js:102 |
| DAILY_LOG_NETWORK_ERROR | apps/mobile/src/features/clients/services/dailyLogService.js:25 |
| DAILY_LOG_REQUEST_ERROR | apps/mobile/src/features/clients/services/dailyLogService.js:25 |
| EXPO_PUBLIC_ENABLE_CHAT_IMAGES | apps/mobile/src/features/chat/utils/chatImageFeatureFlag.js:11 |
| HEALTH_CONSENT_ | apps/mobile/src/features/clients/services/clientService.js:468 |
| HEALTH_CONSENT_REQUIRED | apps/mobile/src/features/chat/utils/chatImageError.js:65, apps/mobile/src/features/healthConsent/services/healthConsentClient.cjs:53, apps/mobile/src/features/healthConsent/services/healthConsentClient.cjs:59 |
| HEALTH_CONSENT_UNAVAILABLE | apps/mobile/src/features/chat/utils/chatImageError.js:68, apps/mobile/src/features/healthConsent/services/healthConsentClient.cjs:7 |
| INSTALLATION_ID_INVALID | apps/mobile/src/features/push/utils/pushClientPolicy.cjs:245, apps/mobile/src/features/push/utils/pushLifecycleController.cjs:149 |
| INSTALLATION_ID_UNAVAILABLE | apps/mobile/src/features/push/utils/pushClientPolicy.cjs:238 |
| INVALID_INPUT | apps/mobile/src/features/chat/services/chatService.js:32, apps/mobile/src/features/notifications/context/NotificationContext.js:109, apps/mobile/src/features/notifications/context/NotificationContext.js:204, apps/mobile/src/features/notifications/services/notificationService.js:19 |
| LOCAL_CLEANUP_PENDING | apps/mobile/src/features/auth/services/accountDeletionService.js:16 |
| MALFORMED_ROW | apps/mobile/src/features/notifications/services/notificationService.js:24 |
| NOT_FOUND | apps/mobile/src/features/chat/services/chatService.js:35 |
| PASSWORD_CHANGE_FAILED | apps/mobile/src/features/auth/services/authService.js:309, apps/mobile/src/features/auth/services/authService.js:317, apps/mobile/src/features/auth/services/authService.js:361 |
| PASSWORD_CURRENT_INVALID | apps/mobile/src/features/auth/services/authService.js:314, apps/mobile/src/features/auth/services/authService.js:344 |
| PASSWORD_RECOVERY | apps/mobile/src/features/auth/services/authService.js:422 |
| PASSWORD_RECOVERY_CALLBACK_ERROR | apps/mobile/src/features/auth/utils/passwordRecoveryContract.cjs:19 |
| PASSWORD_RECOVERY_FLOW_UNSUPPORTED | apps/mobile/src/features/auth/utils/passwordRecoveryContract.cjs:23 |
| PASSWORD_RECOVERY_LINK_UNRELATED | apps/mobile/src/features/auth/services/authService.js:582, apps/mobile/src/features/auth/services/authService.js:588, apps/mobile/src/features/auth/utils/passwordRecoveryContract.cjs:17 |
| PASSWORD_RECOVERY_PAYLOAD_MALFORMED | apps/mobile/src/features/auth/utils/passwordRecoveryContract.cjs:18 |
| PASSWORD_RECOVERY_SESSION_INVALID | apps/mobile/src/features/auth/services/authService.js:685, apps/mobile/src/features/auth/services/authService.js:704 |
| PASSWORD_RECOVERY_SESSION_MISMATCH | apps/mobile/src/features/auth/services/authService.js:674 |
| PASSWORD_RECOVERY_SESSION_MISSING | apps/mobile/src/features/auth/services/authService.js:669 |
| PASSWORD_RECOVERY_SESSION_READ_FAILED | apps/mobile/src/features/auth/services/authService.js:663 |
| PASSWORD_RECOVERY_SESSION_REJECTED | apps/mobile/src/features/auth/services/authService.js:608, apps/mobile/src/features/auth/services/authService.js:623 |
| PASSWORD_RECOVERY_STATE_CLEAR_FAILED | apps/mobile/src/features/auth/services/passwordRecoveryStateStore.js:44 |
| PASSWORD_RECOVERY_STATE_MALFORMED | apps/mobile/src/features/auth/services/passwordRecoveryStateStore.js:68, apps/mobile/src/features/auth/services/passwordRecoveryStateStore.js:79 |
| PASSWORD_RECOVERY_STATE_MALFORMED_UNCLEARED | apps/mobile/src/features/auth/services/passwordRecoveryStateStore.js:69, apps/mobile/src/features/auth/services/passwordRecoveryStateStore.js:80 |
| PASSWORD_RECOVERY_STATE_READ_FAILED | apps/mobile/src/features/auth/services/authService.js:644, apps/mobile/src/features/auth/services/passwordRecoveryStateStore.js:54 |
| PASSWORD_RECOVERY_STATE_SAVE_FAILED | apps/mobile/src/features/auth/services/authService.js:616, apps/mobile/src/features/auth/services/passwordRecoveryStateStore.js:35 |
| PASSWORD_RECOVERY_STATE_STALE | apps/mobile/src/features/auth/services/passwordRecoveryStateStore.js:63, apps/mobile/src/features/auth/services/passwordRecoveryStateStore.js:65, apps/mobile/src/features/auth/services/passwordRecoveryStateStore.js:74, apps/mobile/src/features/auth/services/passwordRecoveryStateStore.js:76 |
| PASSWORD_RECOVERY_TOKEN_DUPLICATE | apps/mobile/src/features/auth/utils/passwordRecoveryContract.cjs:21 |
| PASSWORD_RECOVERY_TOKEN_MISSING | apps/mobile/src/features/auth/utils/passwordRecoveryContract.cjs:20 |
| PASSWORD_RECOVERY_TYPE_INVALID | apps/mobile/src/features/auth/utils/passwordRecoveryContract.cjs:22 |
| PASSWORD_RECOVERY_URL_INVALID | apps/mobile/src/features/auth/utils/passwordRecoveryContract.cjs:16 |
| PASSWORD_RECOVERY_USER_INVALID | apps/mobile/src/features/auth/services/passwordRecoveryStateStore.js:22 |
| PASSWORD_SAME | apps/mobile/src/features/auth/services/authService.js:307, apps/mobile/src/features/auth/services/authService.js:320 |
| PASSWORD_SESSION_INVALID | apps/mobile/src/features/auth/services/authService.js:330 |
| PASSWORD_SESSION_MISMATCH | apps/mobile/src/features/auth/services/authService.js:335, apps/mobile/src/features/auth/services/authService.js:349, apps/mobile/src/features/auth/services/authService.js:356 |
| PASSWORD_UPDATE_FAILED | apps/mobile/src/features/auth/services/authService.js:714, apps/mobile/src/features/auth/services/authService.js:723 |
| PASSWORD_WEAK | apps/mobile/src/features/auth/services/authService.js:304 |
| PROJECT_ID_INVALID | apps/mobile/src/features/push/utils/pushClientPolicy.cjs:78 |
| PROJECT_ID_MISSING | apps/mobile/src/features/push/services/pushTokenService.js:11, apps/mobile/src/features/push/utils/pushClientPolicy.cjs:69, apps/mobile/src/features/push/utils/pushLifecycleController.cjs:134 |
| PUSH_RECONCILIATION_FAILED | apps/mobile/src/features/push/utils/pushLifecycleController.cjs:213 |
| SIGNED_OUT | apps/mobile/src/features/auth/services/authService.js:422 |
| TIMED_OUT | apps/mobile/src/features/chat/utils/chatRealtimePolicy.js:39, apps/mobile/src/features/notifications/utils/notificationRealtimePolicy.cjs:20 |
| email_not_confirmed | apps/mobile/src/features/auth/utils/emailConfirmationPolicy.cjs:6 |
| same_password | apps/mobile/src/features/auth/services/authService.js:306 |
| weak_password | apps/mobile/src/features/auth/services/authService.js:303 |

## Mevcut açıklamalar

| Açıklama | Kaynak |
|---|---|
| Geçersiz ölçüm değeri: ${değer} | apps/mobile/src/features/analytics/services/analyticsService.js:123 |
| Aksiyon için oturum açmalısınız. | apps/mobile/src/features/analytics/services/analyticsService.js:130, apps/mobile/src/features/meals/services/mealChangeRequestService.js:11 |
| Analiz verileri yüklenemedi. Lütfen tekrar deneyin. | apps/mobile/src/features/analytics/viewmodels/useAnalyticsViewModel.js:130 |
| Kaydetmek için en az bir ölçü giriniz. | apps/mobile/src/features/analytics/viewmodels/useAnalyticsViewModel.js:200 |
| Lütfen 0 ile 500 cm arasında geçerli ölçüler giriniz. | apps/mobile/src/features/analytics/viewmodels/useAnalyticsViewModel.js:204 |
| Ölçüler kaydedilirken bir sorun oluştu. | apps/mobile/src/features/analytics/viewmodels/useAnalyticsViewModel.js:222 |
| Lütfen 20 ile 500 kg arasında geçerli bir kilo giriniz. | apps/mobile/src/features/analytics/viewmodels/useAnalyticsViewModel.js:265 |
| Kilonuz kaydedilemedi. Lütfen tekrar deneyin. | apps/mobile/src/features/analytics/viewmodels/useAnalyticsViewModel.js:283, apps/mobile/src/features/clients/viewmodels/useDashboardViewModel.js:570 |
| Randevular yüklenemedi. Lütfen tekrar deneyin. | apps/mobile/src/features/appointments/services/appointmentService.js:7 |
| Invalid appointment id | apps/mobile/src/features/appointments/services/appointmentService.js:66 |
| Geçersiz randevu tarih/saat bilgisi. | apps/mobile/src/features/appointments/utils/appointmentContract.cjs:55 |
| Geçerli bir tarih bulunamadı. | apps/mobile/src/features/appointments/utils/appointmentContract.cjs:69, apps/mobile/src/shared/utils/istanbulDateContract.cjs:7 |
| Geçersiz randevu tarihi. | apps/mobile/src/features/appointments/utils/appointmentContract.cjs:96, apps/mobile/src/features/appointments/utils/appointmentContract.cjs:218 |
| Geçersiz randevu saati. | apps/mobile/src/features/appointments/utils/appointmentContract.cjs:102 |
| Geçersiz randevu kaydı. | apps/mobile/src/features/appointments/utils/appointmentContract.cjs:117 |
| Randevu sahipliği doğrulanamadı. | apps/mobile/src/features/appointments/utils/appointmentContract.cjs:119, apps/mobile/src/features/appointments/utils/appointmentContract.cjs:122 |
| Randevu sahibi doğrulanamadı. | apps/mobile/src/features/appointments/utils/appointmentContract.cjs:124 |
| Geçersiz randevu başlığı. | apps/mobile/src/features/appointments/utils/appointmentContract.cjs:125 |
| Geçersiz randevu durumu. | apps/mobile/src/features/appointments/utils/appointmentContract.cjs:128 |
| Geçersiz randevu süresi. | apps/mobile/src/features/appointments/utils/appointmentContract.cjs:133 |
| Hesap silme işlemi için geçerli bir oturum bulunamadı. | apps/mobile/src/features/auth/services/accountDeletionService.js:20 |
| Hesap doğrulanamadı. Lütfen tekrar giriş yapın. | apps/mobile/src/features/auth/services/accountDeletionService.js:21, apps/mobile/src/features/auth/services/authService.js:49 |
| Hesap silme durumu doğrulanamadı. Lütfen tekrar deneyin. | apps/mobile/src/features/auth/services/accountDeletionService.js:22, apps/mobile/src/features/auth/services/authService.js:51 |
| Hesap silme isteği doğrulanamadı. Lütfen tekrar giriş yapın. | apps/mobile/src/features/auth/services/accountDeletionService.js:23 |
| Hesap silme işlemi henüz tamamlanamadı. Lütfen tekrar deneyin. | apps/mobile/src/features/auth/services/accountDeletionService.js:25 |
| Hesap silme işlemi doğrulanamadı. Lütfen tekrar deneyin. | apps/mobile/src/features/auth/services/accountDeletionService.js:26 |
| Bu uygulama danışan kullanımı içindir. Diyetisyen paneline web uygulamasından giriş yapabilirsiniz. | apps/mobile/src/features/auth/services/authService.js:30 |
| Kullanıcı profili bulunamadı. | apps/mobile/src/features/auth/services/authService.js:32 |
| E-posta veya şifre hatalı. | apps/mobile/src/features/auth/services/authService.js:33 |
| Bir sorun oluştu. Lütfen tekrar deneyin. | apps/mobile/src/features/auth/services/authService.js:34 |
| Şifreniz güncellenemedi. Lütfen yeni bir sıfırlama bağlantısı isteyin. | apps/mobile/src/features/auth/services/authService.js:35 |
| Şifreniz güncellenemedi. Lütfen tekrar deneyin. | apps/mobile/src/features/auth/services/authService.js:37, apps/mobile/src/features/auth/viewmodels/useResetPasswordViewModel.js:7 |
| Mevcut şifreniz hatalı. | apps/mobile/src/features/auth/services/authService.js:39 |
| Yeni şifreniz yeterince güçlü değil. Lütfen daha güçlü bir şifre deneyin. | apps/mobile/src/features/auth/services/authService.js:41 |
| Yeni şifreniz mevcut şifrenizden farklı olmalıdır. | apps/mobile/src/features/auth/services/authService.js:43 |
| Oturum doğrulanamadı. Lütfen tekrar giriş yapın. | apps/mobile/src/features/auth/services/authService.js:45 |
| Bekleyen hesap silme işlemi tamamlanmadan uygulamaya devam edilemez. | apps/mobile/src/features/auth/services/authService.js:47 |
| Hesap silme işlemi henüz tamamlanamadı. Aynı hesapla tekrar giriş yaparak yeniden deneyebilirsiniz. | apps/mobile/src/features/auth/services/authService.js:53 |
| Hesabınız silindi ancak bu cihazdaki oturum temizliği tamamlanamadı. | apps/mobile/src/features/auth/services/authService.js:55 |
| E-posta adresin henüz doğrulanmadı. Gelen kutundaki doğrulama bağlantısına dokunup ardından tekrar giriş yap. E-postayı bulamazsan spam veya gereksiz klasörünü kontrol et. | apps/mobile/src/features/auth/utils/emailConfirmationPolicy.cjs:4 |
| Devam etmek için Kullanım Koşulları’nı kabul edin ve KVKK Aydınlatma Metni’ni okuduğunuzu belirtin. | apps/mobile/src/features/auth/utils/legalAcceptancePolicy.cjs:1 |
| Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş. Lütfen yeni bir bağlantı isteyin. | apps/mobile/src/features/auth/utils/passwordRecoveryContract.cjs:4 |
| Lütfen tüm alanları doldurun. | apps/mobile/src/features/auth/viewmodels/useAuthViewModel.js:121 |
| Lütfen ad soyad alanını doldurun. | apps/mobile/src/features/auth/viewmodels/useAuthViewModel.js:148 |
| Şifreler eşleşmiyor. | apps/mobile/src/features/auth/viewmodels/useAuthViewModel.js:153, apps/mobile/src/features/auth/viewmodels/useResetPasswordViewModel.js:6, apps/mobile/src/features/clients/viewmodels/useSettingsViewModel.js:31 |
| Bir hata oluştu. Lütfen tekrar deneyin. | apps/mobile/src/features/auth/viewmodels/useForgotPasswordViewModel.js:6 |
| Lütfen geçerli bir e-posta adresi girin. | apps/mobile/src/features/auth/viewmodels/useForgotPasswordViewModel.js:7 |
| Lütfen e-posta adresinizi girin. | apps/mobile/src/features/auth/viewmodels/useForgotPasswordViewModel.js:8 |
| Acceptance could not be confirmed. | apps/mobile/src/features/auth/viewmodels/useLegalAcceptanceViewModel.js:25 |
| Sağlık verisi tercihlerin henüz kaydedilmedi. Seçimlerini kontrol edip Tercihleri kaydet’e dokun, ardından tekrar devam et. Rıza vermeden devam etmek için kutuları boş bırakarak kaydedebilirsin. | apps/mobile/src/features/auth/viewmodels/useLegalAcceptanceViewModel.js:28 |
| Bilgiler kaydedilemedi. Lütfen tekrar deneyin. | apps/mobile/src/features/auth/viewmodels/useLegalAcceptanceViewModel.js:33, apps/mobile/src/features/clients/services/clientService.js:13, apps/mobile/src/features/onboarding/viewmodels/useOnboardingSetupViewModel.js:18 |
| Sign out failed. | apps/mobile/src/features/auth/viewmodels/useLegalAcceptanceViewModel.js:47 |
| Çıkış yapılamadı. Lütfen tekrar deneyin. | apps/mobile/src/features/auth/viewmodels/useLegalAcceptanceViewModel.js:49, apps/mobile/src/features/clients/viewmodels/useSettingsViewModel.js:33 |
| Lütfen yeni şifrenizi girin. | apps/mobile/src/features/auth/viewmodels/useResetPasswordViewModel.js:4 |
| Lütfen yeni şifrenizi tekrar girin. | apps/mobile/src/features/auth/viewmodels/useResetPasswordViewModel.js:5 |
| Teslim durumu şu anda güncellenemedi. | apps/mobile/src/features/chat/hooks/useChatDeliveryState.js:11 |
| Dosya seçilemedi. Video en fazla 20 MB, belge en fazla 10 MB olabilir. | apps/mobile/src/features/chat/hooks/useChatMediaUpload.js:33 |
| Okunma durumu şu anda güncellenemedi. | apps/mobile/src/features/chat/hooks/useChatReadState.js:15 |
| Dosya seçilemedi. | apps/mobile/src/features/chat/services/chatMediaService.js:19 |
| Dosya veya açıklama bilgisi geçersiz. | apps/mobile/src/features/chat/services/chatMediaService.js:36 |
| Dosya yükleme izni doğrulanamadı. | apps/mobile/src/features/chat/services/chatMediaService.js:49 |
| Seçilen dosya değişti. Yeniden seçin. | apps/mobile/src/features/chat/services/chatMediaService.js:56 |
| Dosya okunamadı. | apps/mobile/src/features/chat/services/chatMediaService.js:58 |
| Mesaj sonucu doğrulanamadı. | apps/mobile/src/features/chat/services/chatMediaService.js:79 |
| Bu dosya kullanılamıyor. | apps/mobile/src/features/chat/services/chatMediaService.js:98 |
| Dosya açılamadı. Erişiminizi kontrol edip tekrar deneyin. | apps/mobile/src/features/chat/services/chatMediaService.js:101 |
| Sohbet işlemi şu anda tamamlanamadı. Lütfen tekrar deneyin. | apps/mobile/src/features/chat/services/chatService.js:57, apps/mobile/src/features/chat/viewmodels/useChatViewModel.js:37 |
| Invalid chat field: ${değer} | apps/mobile/src/features/chat/services/chatService.js:105 |
| Unexpected ${değer} payload | apps/mobile/src/features/chat/services/chatService.js:134 |
| Multiple chat conversations for one relation | apps/mobile/src/features/chat/services/chatService.js:176 |
| Invalid meal activity field: ${değer} | apps/mobile/src/features/chat/services/mealActivityService.js:19 |
| Görsel okunamadı. Lütfen başka bir dosya deneyin. | apps/mobile/src/features/chat/utils/chatImageError.js:14 |
| Görsel boyutları geçersiz. Lütfen başka bir dosya deneyin. | apps/mobile/src/features/chat/utils/chatImageError.js:15 |
| Görsel çok büyük. Lütfen daha küçük bir görsel seçin. | apps/mobile/src/features/chat/utils/chatImageError.js:16, apps/mobile/src/features/chat/utils/chatImageError.js:28 |
| Görsellere erişim izni verilmedi. Lütfen izin verin ve tekrar deneyin. | apps/mobile/src/features/chat/utils/chatImageError.js:17 |
| Görsel bilgisi geçersiz. Lütfen tekrar deneyin. | apps/mobile/src/features/chat/utils/chatImageError.js:18 |
| Çok fazla bekleyen görsel var. Lütfen biraz sonra tekrar deneyin. | apps/mobile/src/features/chat/utils/chatImageError.js:20 |
| Görsel gönderim süresi doldu. Lütfen görseli yeniden seçin. | apps/mobile/src/features/chat/utils/chatImageError.js:21 |
| Görsel doğrulaması tamamlanamadı. Lütfen daha sonra tekrar deneyin. | apps/mobile/src/features/chat/utils/chatImageError.js:22 |
| Görsel gönderim kaydı bulunamadı. | apps/mobile/src/features/chat/utils/chatImageError.js:24 |
| Yüklenen görsel bulunamadı. Lütfen yeniden deneyin. | apps/mobile/src/features/chat/utils/chatImageError.js:26 |
| Görsel güvenli biçimde doğrulanamadı. Lütfen başka bir görsel seçin. | apps/mobile/src/features/chat/utils/chatImageError.js:27 |
| Görsel boyutları izin verilen sınırı aşıyor. | apps/mobile/src/features/chat/utils/chatImageError.js:29 |
| Görsel doğrulanırken geçici bir sorun oluştu. Lütfen tekrar deneyin. | apps/mobile/src/features/chat/utils/chatImageError.js:30 |
| Görsel doğrulaması şu anda tamamlanamadı. Lütfen tekrar deneyin. | apps/mobile/src/features/chat/utils/chatImageError.js:31 |
| Görsel yüklenemedi. Lütfen tekrar deneyin. | apps/mobile/src/features/chat/utils/chatImageError.js:33 |
| Görsel işlemi beklenmeyen bir yanıt döndürdü. Lütfen tekrar deneyin. | apps/mobile/src/features/chat/utils/chatImageError.js:34 |
| Bağlantı kurulamadı. İnternet bağlantınızı kontrol edip tekrar deneyin. | apps/mobile/src/features/chat/utils/chatImageError.js:35 |
| Görsel işlemi şu anda tamamlanamadı. Lütfen tekrar deneyin. | apps/mobile/src/features/chat/utils/chatImageError.js:37 |
| Görsel göndermek için önce bir metin mesajı gönderin. | apps/mobile/src/features/chat/utils/chatImageUiState.js:9 |
| Görsel gönderme özelliği henüz kullanıma açık değil. | apps/mobile/src/features/chat/utils/chatImageUiState.js:10 |
| canonicalizing | apps/mobile/src/features/chat/utils/chatImageUploadReducer.js:73 |
| finalizing | apps/mobile/src/features/chat/utils/chatImageUploadReducer.js:89 |
| Dosya adı okunamadı. | apps/mobile/src/features/chat/utils/chatMediaPolicy.js:17 |
| MP4, MOV, WebM, PDF, DOCX, XLSX, TXT veya CSV dosyası seçin. | apps/mobile/src/features/chat/utils/chatMediaPolicy.js:25 |
| ${değer} en fazla ${değer} MB olabilir. | apps/mobile/src/features/chat/utils/chatMediaPolicy.js:28 |
| Mesaj metni geçersiz. | apps/mobile/src/features/chat/utils/chatMessageUtils.js:26 |
| Mesaj metni boş olamaz. | apps/mobile/src/features/chat/utils/chatMessageUtils.js:27 |
| Mesaj en fazla ${değer} karakter olabilir. | apps/mobile/src/features/chat/utils/chatMessageUtils.js:28 |
| Güvenli mesaj kimliği oluşturulamadı. Lütfen tekrar deneyin. | apps/mobile/src/features/chat/viewmodels/useChatViewModel.js:38 |
| Bu besin zaten listede. | apps/mobile/src/features/clients/components/DislikedFoodsModal.js:54 |
| Lütfen eklemek istediğiniz bilgiyi girin. | apps/mobile/src/features/clients/components/MultiSelectProfileModal.js:94 |
| Bu bilgi zaten seçili. | apps/mobile/src/features/clients/components/MultiSelectProfileModal.js:99 |
| DietBridge hesabınız ve danışan hesabınıza bağlı veriler kalıcı olarak silinecek. Bu işlem geri alınamaz. | apps/mobile/src/features/clients/screens/SettingsScreen.js:25 |
| DietBridge hesabından çıkış yapmak istiyor musunuz? | apps/mobile/src/features/clients/screens/SettingsScreen.js:26 |
| Profil bilgileri bulunamadı. | apps/mobile/src/features/clients/services/clientService.js:9 |
| Danışan profil bilgileri bulunamadı. | apps/mobile/src/features/clients/services/clientService.js:10 |
| Kullanıcı oturumu bulunamadı. | apps/mobile/src/features/clients/services/clientService.js:11, apps/mobile/src/features/clients/services/dailyLogService.js:12 |
| Bu uygulama yalnızca danışan profilleri içindir. | apps/mobile/src/features/clients/services/clientService.js:12 |
| Profil bilgilerine ulaşılamadı. | apps/mobile/src/features/clients/services/clientService.js:14 |
| Profil fotoğrafı kaydedilemedi. Lütfen tekrar deneyin. | apps/mobile/src/features/clients/services/clientService.js:18 |
| ${değer} boş bırakılamaz. | apps/mobile/src/features/clients/services/clientService.js:46 |
| ${değer} sayısal olmalıdır. | apps/mobile/src/features/clients/services/clientService.js:62 |
| ${değer} en az ${değer} olmalıdır. | apps/mobile/src/features/clients/services/clientService.js:65 |
| ${değer} en fazla ${değer} olmalıdır. | apps/mobile/src/features/clients/services/clientService.js:68 |
| ${değer} için geçerli bir seçenek seçiniz. | apps/mobile/src/features/clients/services/clientService.js:95 |
| ${değer} YYYY-AA-GG biçiminde olmalıdır. | apps/mobile/src/features/clients/services/clientService.js:127 |
| ${değer} geçerli bir tarih olmalıdır. | apps/mobile/src/features/clients/services/clientService.js:132 |
| ${değer} gelecekte olamaz. | apps/mobile/src/features/clients/services/clientService.js:135 |
| Uyku süresi sayısal olmalıdır. | apps/mobile/src/features/clients/services/clientService.js:150 |
| Minimum uyku maksimum uykudan büyük olamaz. | apps/mobile/src/features/clients/services/clientService.js:154, apps/mobile/src/features/clients/services/clientService.js:161 |
| Lütfen 0.5 ile 10 litre arasında geçerli bir değer girin. | apps/mobile/src/features/clients/services/clientService.js:517 |
| Lütfen 0 ile 24 saat arasında geçerli bir değer girin. | apps/mobile/src/features/clients/services/clientService.js:534 |
| Güncel kilo boş bırakılamaz. | apps/mobile/src/features/clients/services/clientService.js:547 |
| Avatar file could not be read. | apps/mobile/src/features/clients/services/clientService.js:581, apps/mobile/src/features/clients/services/clientService.js:590, apps/mobile/src/features/clients/services/clientService.js:593 |
| Yüklenecek profil fotoğrafı bulunamadı. | apps/mobile/src/features/clients/services/clientService.js:599 |
| Profil fotoğrafı JPEG, PNG veya WebP olmalıdır. | apps/mobile/src/features/clients/services/clientService.js:603 |
| Profil fotoğrafı en fazla 5 MB olabilir. | apps/mobile/src/features/clients/services/clientService.js:606, apps/mobile/src/features/clients/services/clientService.js:622 |
| Profil fotoğrafı silinemedi. Lütfen tekrar deneyin. | apps/mobile/src/features/clients/services/clientService.js:686 |
| Günlük kayıt bilgilerine ulaşılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin. | apps/mobile/src/features/clients/services/dailyLogService.js:10 |
| Günlük kayıt bilgileri şu anda yüklenemedi. | apps/mobile/src/features/clients/services/dailyLogService.js:11 |
| Su miktarı kaydedilemedi. Lütfen tekrar deneyin. | apps/mobile/src/features/clients/viewmodels/useDashboardViewModel.js:474 |
| Geçerli öğün ID bulunamadı. | apps/mobile/src/features/clients/viewmodels/useDashboardViewModel.js:496, apps/mobile/src/features/clients/viewmodels/useDashboardViewModel.js:548, apps/mobile/src/features/meals/context/MealsContext.js:90, apps/mobile/src/features/meals/services/mealService.js:10 |
| Öğün durumu güncellenemedi. Lütfen internet bağlantınızı kontrol edip tekrar deneyin. | apps/mobile/src/features/clients/viewmodels/useDashboardViewModel.js:537 |
| Lütfen geçerli bir kilo giriniz. | apps/mobile/src/features/clients/viewmodels/useDashboardViewModel.js:560 |
| Kaydetme işlemi devam ediyor. | apps/mobile/src/features/clients/viewmodels/useProfileViewModel.js:320 |
| Profil fotoğrafı seçilemedi. Lütfen tekrar deneyin. | apps/mobile/src/features/clients/viewmodels/useProfileViewModel.js:443 |
| Profil bilgileri yüklenemedi. Lütfen tekrar deneyin. | apps/mobile/src/features/clients/viewmodels/useProfileViewModel.js:515 |
| Bazı profil seçenekleri yüklenemedi. Lütfen tekrar deneyin. | apps/mobile/src/features/clients/viewmodels/useProfileViewModel.js:517 |
| Lütfen tüm şifre alanlarını doldurun. | apps/mobile/src/features/clients/viewmodels/useSettingsViewModel.js:30 |
| Ayarlar yüklenemedi. Lütfen tekrar deneyin. | apps/mobile/src/features/clients/viewmodels/useSettingsViewModel.js:32 |
| Bu özelliği kullanmak için aktif bir diyetisyen bağlantınız olmalı. | apps/mobile/src/features/dietitianConnection/services/dietitianConnectionService.js:4 |
| İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin. | apps/mobile/src/features/dietitianConnection/services/dietitianConnectionService.js:5 |
| Bu bağlantı isteği artık geçerli değil. | apps/mobile/src/features/dietitianConnection/services/dietitianConnectionService.js:6 |
| Zaten aktif bir diyetisyen bağlantınız var. | apps/mobile/src/features/dietitianConnection/services/dietitianConnectionService.js:7 |
| Kod bulunamadı. Diyetisyeninizden kodu kontrol etmesini isteyin. | apps/mobile/src/features/dietitianConnection/utils/inviteCodeContract.cjs:2 |
| Çok fazla deneme yaptınız. Lütfen daha sonra tekrar deneyin. | apps/mobile/src/features/dietitianConnection/utils/inviteCodeContract.cjs:4 |
| Diyetisyeninizin danışan kontenjanı şu anda dolu. | apps/mobile/src/features/dietitianConnection/utils/inviteCodeContract.cjs:7 |
| İşlem tamamlanamadı. Lütfen tekrar deneyin. | apps/mobile/src/features/dietitianConnection/utils/inviteCodeContract.cjs:8 |
| Oturumunuz doğrulanamadı. Lütfen tekrar giriş yapın. | apps/mobile/src/features/grocery/services/groceryService.js:13, apps/mobile/src/features/grocery/viewmodels/useGroceryListViewModel.js:179 |
| Invalid grocery item id | apps/mobile/src/features/grocery/services/groceryService.js:96 |
| Invalid completion state | apps/mobile/src/features/grocery/services/groceryService.js:103 |
| Ürün adı 1–120 karakter olmalıdır. | apps/mobile/src/features/grocery/utils/groceryContract.cjs:5 |
| Alışveriş listesi yüklenemedi. Lütfen tekrar deneyin. | apps/mobile/src/features/grocery/utils/groceryContract.cjs:6 |
| Alışveriş listesi güncellenemedi. Lütfen tekrar deneyin. | apps/mobile/src/features/grocery/utils/groceryContract.cjs:7 |
| Alışveriş listesi veri sözleşmesi doğrulanamadı. | apps/mobile/src/features/grocery/utils/groceryContract.cjs:32 |
| Bu bilgiyi diyetisyenine göndermek için Ayarlar’daki sağlık verisi paylaşım tercihini onayla. | apps/mobile/src/features/healthConsent/services/healthConsentClient.cjs:4 |
| Sağlık verisi tercihlerini kontrol edin. | apps/mobile/src/features/healthConsent/services/registrationHealthConsent.cjs:13 |
| Invalid meal completion photo identity. | apps/mobile/src/features/meals/services/mealCompletionPhotoContract.cjs:19 |
| Meal completion photo picker failed. | apps/mobile/src/features/meals/services/mealCompletionPhotoPicker.js:12 |
| Meal completion photo operation failed. | apps/mobile/src/features/meals/services/mealCompletionPhotoUploadLifecycle.cjs:14 |
| Öğün durumu güncellenemedi. | apps/mobile/src/features/meals/services/mealService.js:11 |
| Lütfen en az bir öğün seçiniz. | apps/mobile/src/features/meals/viewmodels/useMealsViewModel.js:284 |
| Lütfen bir mesaj veya talep yazınız. | apps/mobile/src/features/meals/viewmodels/useMealsViewModel.js:288 |
| Bildirim görünümü geçersiz. | apps/mobile/src/features/notifications/context/NotificationContext.js:109, apps/mobile/src/features/notifications/context/NotificationContext.js:204 |
| Bildirim okunamadı. Lütfen tekrar deneyin. | apps/mobile/src/features/notifications/screens/NotificationCenterScreen.js:202 |
| Bildirim açılamadı. Lütfen tekrar deneyin. | apps/mobile/src/features/notifications/screens/NotificationCenterScreen.js:230 |
| Bildirimler okunamadı. Lütfen tekrar deneyin. | apps/mobile/src/features/notifications/screens/NotificationCenterScreen.js:265 |
| Notification realtime session mismatch | apps/mobile/src/features/notifications/services/notificationRealtimeService.js:55 |
| Invalid authenticated notification user id | apps/mobile/src/features/notifications/services/notificationRealtimeService.js:60 |
| Malformed notification realtime payload | apps/mobile/src/features/notifications/services/notificationRealtimeService.js:72 |
| Bildirimler şu anda yüklenemedi. Lütfen tekrar deneyin. | apps/mobile/src/features/notifications/services/notificationService.js:29 |
| Oturumunuz doğrulanamadı. Lütfen yeniden giriş yapın. | apps/mobile/src/features/notifications/services/notificationService.js:30 |
| Bildirim bilgisi geçersiz. Lütfen tekrar deneyin. | apps/mobile/src/features/notifications/services/notificationService.js:31 |
| Invalid notification field: ${değer} | apps/mobile/src/features/notifications/services/notificationService.js:46 |
| Notification list payload is not an array | apps/mobile/src/features/notifications/services/notificationService.js:115 |
| Malformed notification row | apps/mobile/src/features/notifications/services/notificationService.js:121 |
| Notification recipient mismatch | apps/mobile/src/features/notifications/services/notificationService.js:139 |
| Invalid mark_notifications_seen result | apps/mobile/src/features/notifications/services/notificationService.js:284 |
| Invalid mark_all_notifications_read result | apps/mobile/src/features/notifications/services/notificationService.js:303 |
| Push registration input is invalid. | apps/mobile/src/features/push/services/pushRegistrationService.js:19 |
| Push registration requires an authenticated session. | apps/mobile/src/features/push/services/pushRegistrationService.js:26 |
| Push registration failed. | apps/mobile/src/features/push/services/pushRegistrationService.js:41 |
| Push revoke failed. | apps/mobile/src/features/push/services/pushRegistrationService.js:69 |
| Push project configuration is missing. | apps/mobile/src/features/push/services/pushTokenService.js:10 |
| Push token is currently unavailable. | apps/mobile/src/features/push/services/pushTokenService.js:19, apps/mobile/src/features/push/services/pushTokenService.js:26 |
| Push installation identity is unavailable. | apps/mobile/src/features/push/utils/pushClientPolicy.cjs:237 |
| Push installation identity was malformed. | apps/mobile/src/features/push/utils/pushClientPolicy.cjs:244 |
| Bu bağlantı cihazınızda açılamadı. Lütfen daha sonra tekrar deneyin. | apps/mobile/src/shared/utils/externalLinking.js:8 |
| External target is not supported on this device. | apps/mobile/src/shared/utils/externalLinkPolicy.cjs:32 |
| Geçerli bir gün farkı bulunamadı. | apps/mobile/src/shared/utils/istanbulDateContract.cjs:36 |
| Geçerli bir hafta günü bulunamadı. | apps/mobile/src/shared/utils/localDate.js:22 |
| 1–9999 ml arasında geçerli bir miktar girin. | apps/mobile/src/shared/utils/waterTrackingContract.cjs:4 |
| Günlük su kaydı geçersiz. | apps/mobile/src/shared/utils/waterTrackingContract.cjs:5 |

## Hata gösterim ve üretim noktaları

| Kaynak | İfade |
|---|---|
| apps/mobile/src/features/analytics/services/analyticsService.js:123 | `Geçersiz ölçüm değeri: ${key}` |
| apps/mobile/src/features/analytics/services/analyticsService.js:130 | "Aksiyon için oturum açmalısınız." |
| apps/mobile/src/features/analytics/services/analyticsService.js:132 | CONNECTION_REQUIRED_MESSAGE |
| apps/mobile/src/features/analytics/services/analyticsService.js:197 | INVALID_PERSISTED_WATER_MESSAGE |
| apps/mobile/src/features/analytics/viewmodels/useAnalyticsViewModel.js:130 | 'Analiz verileri yüklenemedi. Lütfen tekrar deneyin.' |
| apps/mobile/src/features/analytics/viewmodels/useAnalyticsViewModel.js:200 | 'Kaydetmek için en az bir ölçü giriniz.' |
| apps/mobile/src/features/analytics/viewmodels/useAnalyticsViewModel.js:204 | 'Lütfen 0 ile 500 cm arasında geçerli ölçüler giriniz.' |
| apps/mobile/src/features/analytics/viewmodels/useAnalyticsViewModel.js:222 | 'Ölçüler kaydedilirken bir sorun oluştu.' |
| apps/mobile/src/features/analytics/viewmodels/useAnalyticsViewModel.js:265 | 'Lütfen 20 ile 500 kg arasında geçerli bir kilo giriniz.' |
| apps/mobile/src/features/analytics/viewmodels/useAnalyticsViewModel.js:283 | 'Kilonuz kaydedilemedi. Lütfen tekrar deneyin.' |
| apps/mobile/src/features/appointments/services/appointmentService.js:66 | 'Invalid appointment id' |
| apps/mobile/src/features/appointments/utils/appointmentContract.cjs:55 | 'Geçersiz randevu tarih/saat bilgisi.' |
| apps/mobile/src/features/appointments/utils/appointmentContract.cjs:69 | 'Geçerli bir tarih bulunamadı.' |
| apps/mobile/src/features/appointments/utils/appointmentContract.cjs:96 | 'Geçersiz randevu tarihi.' |
| apps/mobile/src/features/appointments/utils/appointmentContract.cjs:102 | 'Geçersiz randevu saati.' |
| apps/mobile/src/features/appointments/utils/appointmentContract.cjs:117 | 'Geçersiz randevu kaydı.' |
| apps/mobile/src/features/appointments/utils/appointmentContract.cjs:119 | 'Randevu sahipliği doğrulanamadı.' |
| apps/mobile/src/features/appointments/utils/appointmentContract.cjs:122 | 'Randevu sahipliği doğrulanamadı.' |
| apps/mobile/src/features/appointments/utils/appointmentContract.cjs:124 | 'Randevu sahibi doğrulanamadı.' |
| apps/mobile/src/features/appointments/utils/appointmentContract.cjs:125 | 'Geçersiz randevu başlığı.' |
| apps/mobile/src/features/appointments/utils/appointmentContract.cjs:128 | 'Geçersiz randevu durumu.' |
| apps/mobile/src/features/appointments/utils/appointmentContract.cjs:133 | 'Geçersiz randevu süresi.' |
| apps/mobile/src/features/appointments/utils/appointmentContract.cjs:218 | 'Geçersiz randevu tarihi.' |
| apps/mobile/src/features/appointments/viewmodels/useAppointmentsViewModel.js:39 | loadError?.message \|\| APPOINTMENT_LOAD_ERROR |
| apps/mobile/src/features/auth/services/authService.js:145 | ACCOUNT_DELETION_STATE_ERROR_MESSAGE |
| apps/mobile/src/features/auth/services/authService.js:152 | ACCOUNT_DELETION_SESSION_MISMATCH_MESSAGE |
| apps/mobile/src/features/auth/services/authService.js:156 | ACCOUNT_DELETION_CLEANUP_ERROR_MESSAGE |
| apps/mobile/src/features/auth/services/authService.js:159 | ACCOUNT_DELETION_PENDING_ERROR_MESSAGE |
| apps/mobile/src/features/auth/services/authService.js:374 | PROFILE_NOT_FOUND_ERROR_MESSAGE |
| apps/mobile/src/features/auth/services/authService.js:391 | CLIENT_ONLY_ERROR_MESSAGE |
| apps/mobile/src/features/auth/services/authService.js:434 | ACCOUNT_DELETION_STATE_ERROR_MESSAGE |
| apps/mobile/src/features/auth/services/authService.js:439 | ACCOUNT_DELETION_CLEANUP_ERROR_MESSAGE |
| apps/mobile/src/features/auth/services/authService.js:449 | isEmailNotConfirmedError(error) ? EMAIL_NOT_CONFIRMED_MESSAGE : LOGIN_FAILED_ERROR_MESSAGE |
| apps/mobile/src/features/auth/services/authService.js:454 | GENERIC_AUTH_ERROR_MESSAGE |
| apps/mobile/src/features/auth/services/authService.js:460 | ACCOUNT_DELETION_STATE_ERROR_MESSAGE |
| apps/mobile/src/features/auth/services/authService.js:466 | ACCOUNT_DELETION_CLEANUP_ERROR_MESSAGE |
| apps/mobile/src/features/auth/services/authService.js:471 | ACCOUNT_DELETION_SESSION_MISMATCH_MESSAGE |
| apps/mobile/src/features/auth/services/authService.js:485 | ACCOUNT_DELETION_CLEANUP_ERROR_MESSAGE |
| apps/mobile/src/features/auth/services/authService.js:491 | retryableDeletionFailure                 ? ACCOUNT_DELETION_RETRY_MESSAGE                 : (deletionResult.message \|\| ACCOUNT_DELETION_MESSAGES.AMBIGUOUS_FAILURE) |
| apps/mobile/src/features/auth/services/authService.js:532 | GENERIC_AUTH_ERROR_MESSAGE |
| apps/mobile/src/features/auth/services/authService.js:541 | GENERIC_AUTH_ERROR_MESSAGE |
| apps/mobile/src/features/auth/utils/legalAcceptancePolicy.cjs:5 | LEGAL_ACCEPTANCE_MESSAGE |
| apps/mobile/src/features/auth/viewmodels/useAuthViewModel.js:79 | cleanupRetryAvailable ? ACCOUNT_DELETION_CLEANUP_ERROR_MESSAGE : null |
| apps/mobile/src/features/auth/viewmodels/useAuthViewModel.js:121 | 'Lütfen tüm alanları doldurun.' |
| apps/mobile/src/features/auth/viewmodels/useAuthViewModel.js:138 | result.accountDeletionCleanupMessage \|\| ACCOUNT_DELETION_CLEANUP_ERROR_MESSAGE |
| apps/mobile/src/features/auth/viewmodels/useAuthViewModel.js:148 | 'Lütfen ad soyad alanını doldurun.' |
| apps/mobile/src/features/auth/viewmodels/useAuthViewModel.js:153 | 'Şifreler eşleşmiyor.' |
| apps/mobile/src/features/auth/viewmodels/useAuthViewModel.js:173 | getDisplayErrorMessage(error) |
| apps/mobile/src/features/auth/viewmodels/useAuthViewModel.js:193 | result?.message \|\| ACCOUNT_DELETION_CLEANUP_ERROR_MESSAGE |
| apps/mobile/src/features/auth/viewmodels/useForgotPasswordViewModel.js:34 | EMPTY_EMAIL_MESSAGE |
| apps/mobile/src/features/auth/viewmodels/useForgotPasswordViewModel.js:39 | INVALID_EMAIL_MESSAGE |
| apps/mobile/src/features/auth/viewmodels/useForgotPasswordViewModel.js:49 | GENERIC_ERROR_MESSAGE |
| apps/mobile/src/features/auth/viewmodels/useLegalAcceptanceViewModel.js:25 | 'Acceptance could not be confirmed.' |
| apps/mobile/src/features/auth/viewmodels/useLegalAcceptanceViewModel.js:28 | 'Sağlık verisi tercihlerin henüz kaydedilmedi. Seçimlerini kontrol edip Tercihleri kaydet’e dokun, ardından tekrar devam et. Rıza vermeden devam etmek için kutuları boş bırakarak kaydedebilirsin.' |
| apps/mobile/src/features/auth/viewmodels/useLegalAcceptanceViewModel.js:33 | 'Bilgiler kaydedilemedi. Lütfen tekrar deneyin.' |
| apps/mobile/src/features/auth/viewmodels/useLegalAcceptanceViewModel.js:47 | 'Sign out failed.' |
| apps/mobile/src/features/auth/viewmodels/useLegalAcceptanceViewModel.js:49 | 'Çıkış yapılamadı. Lütfen tekrar deneyin.' |
| apps/mobile/src/features/auth/viewmodels/useResetPasswordViewModel.js:39 | EMPTY_PASSWORD_MESSAGE |
| apps/mobile/src/features/auth/viewmodels/useResetPasswordViewModel.js:44 | EMPTY_CONFIRMATION_MESSAGE |
| apps/mobile/src/features/auth/viewmodels/useResetPasswordViewModel.js:49 | PASSWORD_MISMATCH_MESSAGE |
| apps/mobile/src/features/auth/viewmodels/useResetPasswordViewModel.js:58 | result?.message \|\| GENERIC_ERROR_MESSAGE |
| apps/mobile/src/features/auth/viewmodels/useResetPasswordViewModel.js:65 | GENERIC_ERROR_MESSAGE |
| apps/mobile/src/features/chat/components/ChatMediaBubble.js:20 | failure.message \|\| 'Dosya açılamadı.' |
| apps/mobile/src/features/chat/hooks/useChatDeliveryState.js:68 | DELIVERY_ERROR_MESSAGE |
| apps/mobile/src/features/chat/hooks/useChatMediaUpload.js:33 | 'Dosya seçilemedi. Video en fazla 20 MB, belge en fazla 10 MB olabilir.' |
| apps/mobile/src/features/chat/hooks/useChatMediaUpload.js:52 | failure.message \|\| 'Dosya gönderilemedi.' |
| apps/mobile/src/features/chat/hooks/useChatReadState.js:133 | READ_ERROR_MESSAGE |
| apps/mobile/src/features/chat/hooks/useChatReadState.js:143 | READ_ERROR_MESSAGE |
| apps/mobile/src/features/chat/services/chatMediaService.js:7 | String(error?.message \|\| '').includes('CHAT_RATE_LIMIT')     ? 'Çok sık veya çok fazla dosya gönderildi. Biraz bekleyip tekrar deneyin.'     : error?.code === '42501' ? 'Dosya gönderimi için erişim veya sağlık paylaşım izni bulunmuyor.'         : 'Dosya gönderilemedi. Dosya türünü ve bağlantınızı kontrol edip tekrar deneyin.' |
| apps/mobile/src/features/chat/services/chatMediaService.js:19 | 'Dosya seçilemedi.' |
| apps/mobile/src/features/chat/services/chatMediaService.js:36 | 'Dosya veya açıklama bilgisi geçersiz.' |
| apps/mobile/src/features/chat/services/chatMediaService.js:49 | 'Dosya yükleme izni doğrulanamadı.' |
| apps/mobile/src/features/chat/services/chatMediaService.js:56 | 'Seçilen dosya değişti. Yeniden seçin.' |
| apps/mobile/src/features/chat/services/chatMediaService.js:58 | 'Dosya okunamadı.' |
| apps/mobile/src/features/chat/services/chatMediaService.js:79 | 'Mesaj sonucu doğrulanamadı.' |
| apps/mobile/src/features/chat/services/chatMediaService.js:98 | 'Bu dosya kullanılamıyor.' |
| apps/mobile/src/features/chat/services/chatMediaService.js:101 | 'Dosya açılamadı. Erişiminizi kontrol edip tekrar deneyin.' |
| apps/mobile/src/features/chat/services/chatService.js:105 | `Invalid chat field: ${field}` |
| apps/mobile/src/features/chat/services/chatService.js:134 | `Unexpected ${resource} payload` |
| apps/mobile/src/features/chat/services/chatService.js:176 | 'Multiple chat conversations for one relation' |
| apps/mobile/src/features/chat/services/mealActivityService.js:19 | `Invalid meal activity field: ${field}` |
| apps/mobile/src/features/chat/utils/chatMediaPolicy.js:17 | 'Dosya adı okunamadı.' |
| apps/mobile/src/features/chat/utils/chatMediaPolicy.js:25 | 'MP4, MOV, WebM, PDF, DOCX, XLSX, TXT veya CSV dosyası seçin.' |
| apps/mobile/src/features/chat/utils/chatMediaPolicy.js:28 | `${policy.kind === 'video' ? 'Video' : 'Dosya'} en fazla ${policy.maxBytes / MIB} MB olabilir.` |
| apps/mobile/src/features/chat/utils/chatMessageUtils.js:95 | CHAT_BODY_INVALID_MESSAGE |
| apps/mobile/src/features/chat/utils/chatMessageUtils.js:100 | CHAT_BODY_EMPTY_MESSAGE |
| apps/mobile/src/features/chat/utils/chatMessageUtils.js:103 | CHAT_BODY_TOO_LONG_MESSAGE |
| apps/mobile/src/features/chat/viewmodels/useChatViewModel.js:53 | UUID_ERROR |
| apps/mobile/src/features/chat/viewmodels/useChatViewModel.js:57 | UUID_ERROR |
| apps/mobile/src/features/chat/viewmodels/useChatViewModel.js:242 | getSafeErrorMessage(activityResult.reason, 'Öğün aktiviteleri şu anda yüklenemiyor.') |
| apps/mobile/src/features/chat/viewmodels/useChatViewModel.js:252 | getSafeErrorMessage(error) |
| apps/mobile/src/features/chat/viewmodels/useChatViewModel.js:313 | getSafeErrorMessage(error) |
| apps/mobile/src/features/chat/viewmodels/useChatViewModel.js:383 | getSafeErrorMessage(error) |
| apps/mobile/src/features/chat/viewmodels/useChatViewModel.js:408 | safeMessage |
| apps/mobile/src/features/chat/viewmodels/useChatViewModel.js:421 | UUID_ERROR |
| apps/mobile/src/features/chat/viewmodels/useChatViewModel.js:464 | messageText |
| apps/mobile/src/features/chat/viewmodels/useChatViewModel.js:616 | getSafeErrorMessage(activityResult.reason, 'Öğün aktiviteleri şu anda yüklenemiyor.') |
| apps/mobile/src/features/clients/components/DislikedFoodsModal.js:54 | 'Bu besin zaten listede.' |
| apps/mobile/src/features/clients/components/DislikedFoodsModal.js:101 | error?.message \|\| 'Bilgiler kaydedilemedi. Lütfen tekrar deneyin.' |
| apps/mobile/src/features/clients/components/MultiSelectProfileModal.js:94 | 'Lütfen eklemek istediğiniz bilgiyi girin.' |
| apps/mobile/src/features/clients/components/MultiSelectProfileModal.js:99 | 'Bu bilgi zaten seçili.' |
| apps/mobile/src/features/clients/components/MultiSelectProfileModal.js:137 | error?.message \|\| 'Bilgiler kaydedilemedi. Lütfen tekrar deneyin.' |
| apps/mobile/src/features/clients/components/NumericProfileInputModal.js:87 | validationMessage                 \|\| `Lütfen ${minimum} ile ${maximum} ${unit} arasında geçerli bir değer girin.` |
| apps/mobile/src/features/clients/components/NumericProfileInputModal.js:102 | error?.message \|\| 'Bilgiler kaydedilemedi. Lütfen tekrar deneyin.' |
| apps/mobile/src/features/clients/services/clientService.js:32 | SESSION_REQUIRED_MESSAGE |
| apps/mobile/src/features/clients/services/clientService.js:46 | `${label} boş bırakılamaz.` |
| apps/mobile/src/features/clients/services/clientService.js:62 | `${label} sayısal olmalıdır.` |
| apps/mobile/src/features/clients/services/clientService.js:65 | `${label} en az ${min} olmalıdır.` |
| apps/mobile/src/features/clients/services/clientService.js:68 | `${label} en fazla ${max} olmalıdır.` |
| apps/mobile/src/features/clients/services/clientService.js:95 | `${label} için geçerli bir seçenek seçiniz.` |
| apps/mobile/src/features/clients/services/clientService.js:127 | `${label} YYYY-AA-GG biçiminde olmalıdır.` |
| apps/mobile/src/features/clients/services/clientService.js:132 | `${label} geçerli bir tarih olmalıdır.` |
| apps/mobile/src/features/clients/services/clientService.js:135 | `${label} gelecekte olamaz.` |
| apps/mobile/src/features/clients/services/clientService.js:150 | 'Uyku süresi sayısal olmalıdır.' |
| apps/mobile/src/features/clients/services/clientService.js:154 | 'Minimum uyku maksimum uykudan büyük olamaz.' |
| apps/mobile/src/features/clients/services/clientService.js:161 | 'Minimum uyku maksimum uykudan büyük olamaz.' |
| apps/mobile/src/features/clients/services/clientService.js:349 | PROFILE_NOT_FOUND_MESSAGE |
| apps/mobile/src/features/clients/services/clientService.js:350 | CLIENT_ONLY_MESSAGE |
| apps/mobile/src/features/clients/services/clientService.js:351 | CLIENT_PROFILE_NOT_FOUND_MESSAGE |
| apps/mobile/src/features/clients/services/clientService.js:427 | PROFILE_UPDATE_FAILED_MESSAGE |
| apps/mobile/src/features/clients/services/clientService.js:429 | PROFILE_UNAVAILABLE_MESSAGE |
| apps/mobile/src/features/clients/services/clientService.js:447 | PROFILE_UPDATE_FAILED_MESSAGE |
| apps/mobile/src/features/clients/services/clientService.js:449 | PROFILE_UNAVAILABLE_MESSAGE |
| apps/mobile/src/features/clients/services/clientService.js:482 | PROFILE_UNAVAILABLE_MESSAGE |
| apps/mobile/src/features/clients/services/clientService.js:486 | PROFILE_UPDATE_FAILED_MESSAGE |
| apps/mobile/src/features/clients/services/clientService.js:517 | 'Lütfen 0.5 ile 10 litre arasında geçerli bir değer girin.' |
| apps/mobile/src/features/clients/services/clientService.js:534 | 'Lütfen 0 ile 24 saat arasında geçerli bir değer girin.' |
| apps/mobile/src/features/clients/services/clientService.js:547 | 'Güncel kilo boş bırakılamaz.' |
| apps/mobile/src/features/clients/services/clientService.js:581 | 'Avatar file could not be read.' |
| apps/mobile/src/features/clients/services/clientService.js:590 | 'Avatar file could not be read.' |
| apps/mobile/src/features/clients/services/clientService.js:593 | 'Avatar file could not be read.' |
| apps/mobile/src/features/clients/services/clientService.js:599 | 'Yüklenecek profil fotoğrafı bulunamadı.' |
| apps/mobile/src/features/clients/services/clientService.js:603 | 'Profil fotoğrafı JPEG, PNG veya WebP olmalıdır.' |
| apps/mobile/src/features/clients/services/clientService.js:606 | 'Profil fotoğrafı en fazla 5 MB olabilir.' |
| apps/mobile/src/features/clients/services/clientService.js:622 | 'Profil fotoğrafı en fazla 5 MB olabilir.' |
| apps/mobile/src/features/clients/services/clientService.js:661 | AVATAR_UPLOAD_FAILED_MESSAGE |
| apps/mobile/src/features/clients/services/clientService.js:686 | 'Profil fotoğrafı silinemedi. Lütfen tekrar deneyin.' |
| apps/mobile/src/features/clients/services/dailyLogService.js:24 | message |
| apps/mobile/src/features/clients/services/dailyLogService.js:35 | SESSION_REQUIRED_MESSAGE |
| apps/mobile/src/features/clients/services/dailyLogService.js:65 | SESSION_REQUIRED_MESSAGE |
| apps/mobile/src/features/clients/services/dailyLogService.js:84 | INVALID_PERSISTED_WATER_MESSAGE |
| apps/mobile/src/features/clients/services/dailyLogService.js:111 | INVALID_PERSISTED_WATER_MESSAGE |
| apps/mobile/src/features/clients/viewmodels/useDashboardViewModel.js:221 | error?.message \|\| CONNECTION_GENERIC_ERROR_MESSAGE |
| apps/mobile/src/features/clients/viewmodels/useDashboardViewModel.js:281 | INVALID_PERSISTED_WATER_MESSAGE |
| apps/mobile/src/features/clients/viewmodels/useDashboardViewModel.js:295 | error?.message \|\| 'Günlük kayıt bilgileri yüklenemedi.' |
| apps/mobile/src/features/clients/viewmodels/useDashboardViewModel.js:372 | WATER_INPUT_VALIDATION_MESSAGE |
| apps/mobile/src/features/clients/viewmodels/useDashboardViewModel.js:420 | INVALID_PERSISTED_WATER_MESSAGE |
| apps/mobile/src/features/clients/viewmodels/useDashboardViewModel.js:444 | INVALID_PERSISTED_WATER_MESSAGE |
| apps/mobile/src/features/clients/viewmodels/useDashboardViewModel.js:458 | INVALID_PERSISTED_WATER_MESSAGE |
| apps/mobile/src/features/clients/viewmodels/useDashboardViewModel.js:472 | rollbackState.error |
| apps/mobile/src/features/clients/viewmodels/useDashboardViewModel.js:474 | 'Su miktarı kaydedilemedi. Lütfen tekrar deneyin.' |
| apps/mobile/src/features/clients/viewmodels/useDashboardViewModel.js:496 | 'Geçerli öğün ID bulunamadı.' |
| apps/mobile/src/features/clients/viewmodels/useDashboardViewModel.js:537 | 'Öğün durumu güncellenemedi. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.' |
| apps/mobile/src/features/clients/viewmodels/useDashboardViewModel.js:548 | 'Geçerli öğün ID bulunamadı.' |
| apps/mobile/src/features/clients/viewmodels/useDashboardViewModel.js:560 | 'Lütfen geçerli bir kilo giriniz.' |
| apps/mobile/src/features/clients/viewmodels/useDashboardViewModel.js:570 | 'Kilonuz kaydedilemedi. Lütfen tekrar deneyin.' |
| apps/mobile/src/features/clients/viewmodels/useDashboardViewModel.js:586 | error.message \|\| 'Bağlantı isteği kabul edilemedi. Lütfen tekrar deneyin.' |
| apps/mobile/src/features/clients/viewmodels/useDashboardViewModel.js:598 | error.message \|\| 'Bağlantı isteği reddedilemedi. Lütfen tekrar deneyin.' |
| apps/mobile/src/features/clients/viewmodels/useProfileViewModel.js:202 | message |
| apps/mobile/src/features/clients/viewmodels/useProfileViewModel.js:211 | referenceError?.message \|\| 'Referans veriler yüklenemedi.' |
| apps/mobile/src/features/clients/viewmodels/useProfileViewModel.js:312 | message |
| apps/mobile/src/features/clients/viewmodels/useProfileViewModel.js:320 | 'Kaydetme işlemi devam ediyor.' |
| apps/mobile/src/features/clients/viewmodels/useProfileViewModel.js:335 | message |
| apps/mobile/src/features/clients/viewmodels/useProfileViewModel.js:397 | message |
| apps/mobile/src/features/clients/viewmodels/useProfileViewModel.js:443 | 'Profil fotoğrafı seçilemedi. Lütfen tekrar deneyin.' |
| apps/mobile/src/features/clients/viewmodels/useProfileViewModel.js:474 | uploadError?.message \|\| 'Profil fotoğrafı kaydedilemedi. Lütfen tekrar deneyin.' |
| apps/mobile/src/features/clients/viewmodels/useProfileViewModel.js:492 | removeError?.message \|\| 'Profil fotoğrafı silinemedi.' |
| apps/mobile/src/features/clients/viewmodels/useProfileViewModel.js:515 | 'Profil bilgileri yüklenemedi. Lütfen tekrar deneyin.' |
| apps/mobile/src/features/clients/viewmodels/useProfileViewModel.js:517 | 'Bazı profil seçenekleri yüklenemedi. Lütfen tekrar deneyin.' |
| apps/mobile/src/features/clients/viewmodels/useProfileViewModel.js:534 | actionError?.message \|\| 'Bağlantı isteği kabul edilemedi. Lütfen tekrar deneyin.' |
| apps/mobile/src/features/clients/viewmodels/useProfileViewModel.js:544 | actionError?.message \|\| 'Bağlantı isteği reddedilemedi. Lütfen tekrar deneyin.' |
| apps/mobile/src/features/clients/viewmodels/useSettingsViewModel.js:95 | authUser?.message \|\| SETTINGS_LOAD_ERROR_MESSAGE |
| apps/mobile/src/features/clients/viewmodels/useSettingsViewModel.js:104 | ACCOUNT_DELETION_STATE_ERROR_MESSAGE |
| apps/mobile/src/features/clients/viewmodels/useSettingsViewModel.js:113 | ACCOUNT_DELETION_SESSION_MISMATCH_MESSAGE |
| apps/mobile/src/features/clients/viewmodels/useSettingsViewModel.js:125 | ACCOUNT_DELETION_CLEANUP_ERROR_MESSAGE |
| apps/mobile/src/features/clients/viewmodels/useSettingsViewModel.js:128 | ACCOUNT_DELETION_MESSAGES.RETRYABLE |
| apps/mobile/src/features/clients/viewmodels/useSettingsViewModel.js:143 | SETTINGS_LOAD_ERROR_MESSAGE |
| apps/mobile/src/features/clients/viewmodels/useSettingsViewModel.js:165 | validationError |
| apps/mobile/src/features/clients/viewmodels/useSettingsViewModel.js:178 | result?.message \|\| PASSWORD_CHANGE_ERROR_MESSAGE |
| apps/mobile/src/features/clients/viewmodels/useSettingsViewModel.js:188 | PASSWORD_CHANGE_ERROR_MESSAGE |
| apps/mobile/src/features/clients/viewmodels/useSettingsViewModel.js:217 | ACCOUNT_DELETION_CLEANUP_ERROR_MESSAGE |
| apps/mobile/src/features/clients/viewmodels/useSettingsViewModel.js:223 | ACCOUNT_DELETION_CLEANUP_ERROR_MESSAGE |
| apps/mobile/src/features/clients/viewmodels/useSettingsViewModel.js:235 | getDeletionMessage(result) |
| apps/mobile/src/features/clients/viewmodels/useSettingsViewModel.js:239 | ACCOUNT_DELETION_MESSAGES.AMBIGUOUS_FAILURE |
| apps/mobile/src/features/clients/viewmodels/useSettingsViewModel.js:267 | ACCOUNT_DELETION_CLEANUP_ERROR_MESSAGE |
| apps/mobile/src/features/clients/viewmodels/useSettingsViewModel.js:285 | LOGOUT_ERROR_MESSAGE |
| apps/mobile/src/features/clients/viewmodels/useSettingsViewModel.js:289 | LOGOUT_ERROR_MESSAGE |
| apps/mobile/src/features/dietitianConnection/context/DietitianConnectionContext.js:70 | message |
| apps/mobile/src/features/dietitianConnection/context/DietitianConnectionContext.js:126 | CONNECTION_GENERIC_ERROR_MESSAGE |
| apps/mobile/src/features/dietitianConnection/context/DietitianConnectionContext.js:138 | message |
| apps/mobile/src/features/dietitianConnection/context/DietitianConnectionContext.js:139 | message |
| apps/mobile/src/features/dietitianConnection/context/InviteFlowContext.js:19 | INVITE_MESSAGES.error |
| apps/mobile/src/features/dietitianConnection/context/InviteFlowContext.js:32 | INVITE_MESSAGES.error |
| apps/mobile/src/features/dietitianConnection/context/InviteFlowContext.js:40 | INVITE_MESSAGES.error |
| apps/mobile/src/features/dietitianConnection/services/dietitianConnectionService.js:38 | CONNECTION_GENERIC_ERROR_MESSAGE |
| apps/mobile/src/features/dietitianConnection/services/dietitianConnectionService.js:215 | CONNECTION_GENERIC_ERROR_MESSAGE |
| apps/mobile/src/features/dietitianConnection/services/dietitianConnectionService.js:236 | CONNECTION_GENERIC_ERROR_MESSAGE |
| apps/mobile/src/features/dietitianConnection/services/dietitianConnectionService.js:255 | CONNECTION_GENERIC_ERROR_MESSAGE |
| apps/mobile/src/features/dietitianConnection/services/dietitianConnectionService.js:259 | CONNECTION_STALE_REQUEST_MESSAGE |
| apps/mobile/src/features/dietitianConnection/services/dietitianConnectionService.js:264 | CONNECTION_ACTIVE_EXISTS_MESSAGE |
| apps/mobile/src/features/dietitianConnection/services/dietitianConnectionService.js:281 | CONNECTION_GENERIC_ERROR_MESSAGE |
| apps/mobile/src/features/dietitianConnection/services/dietitianConnectionService.js:285 | CONNECTION_STALE_REQUEST_MESSAGE |
| apps/mobile/src/features/dietitianConnection/services/dietitianConnectionService.js:308 | CONNECTION_GENERIC_ERROR_MESSAGE |
| apps/mobile/src/features/dietitianConnection/services/dietitianConnectionService.js:312 | CONNECTION_STALE_REQUEST_MESSAGE |
| apps/mobile/src/features/dietitianConnection/services/inviteCodeService.js:10 | INVITE_MESSAGES.not_found |
| apps/mobile/src/features/dietitianConnection/services/inviteCodeService.js:19 | INVITE_MESSAGES.error |
| apps/mobile/src/features/dietitianConnection/services/inviteCodeService.js:21 | INVITE_MESSAGES.error |
| apps/mobile/src/features/dietitianConnection/services/inviteCodeService.js:29 | INVITE_MESSAGES.error |
| apps/mobile/src/features/dietitianConnection/services/inviteCodeService.js:31 | INVITE_MESSAGES.error |
| apps/mobile/src/features/dietitianConnection/services/inviteCodeService.js:36 | INVITE_MESSAGES.error |
| apps/mobile/src/features/dietitianConnection/services/inviteCodeService.js:44 | INVITE_MESSAGES.error |
| apps/mobile/src/features/dietitianConnection/services/inviteCodeService.js:50 | INVITE_MESSAGES.error |
| apps/mobile/src/features/grocery/services/groceryService.js:96 | 'Invalid grocery item id' |
| apps/mobile/src/features/grocery/services/groceryService.js:103 | 'Invalid completion state' |
| apps/mobile/src/features/grocery/utils/groceryContract.cjs:32 | 'Alışveriş listesi veri sözleşmesi doğrulanamadı.' |
| apps/mobile/src/features/grocery/viewmodels/useGroceryListViewModel.js:139 | loadError?.message \|\| GROCERY_LOAD_ERROR_MESSAGE |
| apps/mobile/src/features/grocery/viewmodels/useGroceryListViewModel.js:175 | GROCERY_NAME_VALIDATION_MESSAGE |
| apps/mobile/src/features/grocery/viewmodels/useGroceryListViewModel.js:179 | 'Oturumunuz doğrulanamadı. Lütfen tekrar giriş yapın.' |
| apps/mobile/src/features/grocery/viewmodels/useGroceryListViewModel.js:217 | addError?.message \|\| GROCERY_MUTATION_ERROR_MESSAGE |
| apps/mobile/src/features/grocery/viewmodels/useGroceryListViewModel.js:273 | toggleError?.message \|\| GROCERY_MUTATION_ERROR_MESSAGE |
| apps/mobile/src/features/grocery/viewmodels/useGroceryListViewModel.js:329 | deleteError?.message \|\| GROCERY_MUTATION_ERROR_MESSAGE |
| apps/mobile/src/features/healthConsent/services/healthConsentClient.cjs:8 | message |
| apps/mobile/src/features/healthConsent/services/registrationHealthConsent.cjs:13 | 'Sağlık verisi tercihlerini kontrol edin.' |
| apps/mobile/src/features/healthConsent/viewmodels/useHealthConsentViewModel.js:30 | failure.message |
| apps/mobile/src/features/healthConsent/viewmodels/useHealthConsentViewModel.js:55 | failure.message |
| apps/mobile/src/features/meals/context/MealsContext.js:90 | 'Geçerli öğün ID bulunamadı.' |
| apps/mobile/src/features/meals/services/mealChangeRequestService.js:11 | 'Aksiyon için oturum açmalısınız.' |
| apps/mobile/src/features/meals/services/mealChangeRequestService.js:14 | CONNECTION_REQUIRED_MESSAGE |
| apps/mobile/src/features/meals/services/mealChangeRequestService.js:34 | CONNECTION_GENERIC_ERROR_MESSAGE |
| apps/mobile/src/features/meals/services/mealCompletionPhotoContract.cjs:19 | 'Invalid meal completion photo identity.' |
| apps/mobile/src/features/meals/services/mealCompletionPhotoPicker.js:12 | 'Meal completion photo picker failed.' |
| apps/mobile/src/features/meals/services/mealCompletionPhotoUploadLifecycle.cjs:14 | 'Meal completion photo operation failed.' |
| apps/mobile/src/features/meals/services/mealService.js:156 | INVALID_MEAL_ID_MESSAGE |
| apps/mobile/src/features/meals/services/mealService.js:160 | MEAL_COMPLETION_UPDATE_ERROR_MESSAGE |
| apps/mobile/src/features/meals/services/mealService.js:172 | MEAL_COMPLETION_UPDATE_ERROR_MESSAGE |
| apps/mobile/src/features/meals/services/mealService.js:181 | MEAL_COMPLETION_UPDATE_ERROR_MESSAGE |
| apps/mobile/src/features/meals/viewmodels/useMealsViewModel.js:130 | error?.message \|\| CONNECTION_GENERIC_ERROR_MESSAGE |
| apps/mobile/src/features/meals/viewmodels/useMealsViewModel.js:248 | error?.message \|\| CONNECTION_GENERIC_ERROR_MESSAGE |
| apps/mobile/src/features/meals/viewmodels/useMealsViewModel.js:284 | 'Lütfen en az bir öğün seçiniz.' |
| apps/mobile/src/features/meals/viewmodels/useMealsViewModel.js:288 | 'Lütfen bir mesaj veya talep yazınız.' |
| apps/mobile/src/features/meals/viewmodels/useMealsViewModel.js:305 | error.message \|\| CONNECTION_GENERIC_ERROR_MESSAGE |
| apps/mobile/src/features/notifications/context/NotificationContext.js:109 | { code: 'INVALID_INPUT', message: 'Bildirim görünümü geçersiz.' } |
| apps/mobile/src/features/notifications/context/NotificationContext.js:148 | normalizeContextError(requestError) |
| apps/mobile/src/features/notifications/context/NotificationContext.js:192 | normalizeContextError(requestError) |
| apps/mobile/src/features/notifications/context/NotificationContext.js:204 | { code: 'INVALID_INPUT', message: 'Bildirim görünümü geçersiz.' } |
| apps/mobile/src/features/notifications/context/NotificationContext.js:228 | normalizeContextError(mutationError) |
| apps/mobile/src/features/notifications/context/NotificationContext.js:239 | normalizeContextError(mutationError) |
| apps/mobile/src/features/notifications/context/NotificationContext.js:250 | normalizeContextError(mutationError) |
| apps/mobile/src/features/notifications/context/NotificationContext.js:261 | normalizeContextError(mutationError) |
| apps/mobile/src/features/notifications/context/NotificationContext.js:300 | normalizeContextError(subscriptionError) |
| apps/mobile/src/features/notifications/screens/NotificationCenterScreen.js:202 | 'Bildirim okunamadı. Lütfen tekrar deneyin.' |
| apps/mobile/src/features/notifications/screens/NotificationCenterScreen.js:230 | 'Bildirim açılamadı. Lütfen tekrar deneyin.' |
| apps/mobile/src/features/notifications/screens/NotificationCenterScreen.js:265 | 'Bildirimler okunamadı. Lütfen tekrar deneyin.' |
| apps/mobile/src/features/notifications/services/notificationRealtimeService.js:55 | 'Notification realtime session mismatch' |
| apps/mobile/src/features/notifications/services/notificationRealtimeService.js:60 | 'Invalid authenticated notification user id' |
| apps/mobile/src/features/notifications/services/notificationRealtimeService.js:72 | 'Malformed notification realtime payload' |
| apps/mobile/src/features/notifications/services/notificationService.js:46 | `Invalid notification field: ${field}` |
| apps/mobile/src/features/notifications/services/notificationService.js:115 | 'Notification list payload is not an array' |
| apps/mobile/src/features/notifications/services/notificationService.js:121 | 'Malformed notification row' |
| apps/mobile/src/features/notifications/services/notificationService.js:139 | 'Notification recipient mismatch' |
| apps/mobile/src/features/notifications/services/notificationService.js:284 | 'Invalid mark_notifications_seen result' |
| apps/mobile/src/features/notifications/services/notificationService.js:303 | 'Invalid mark_all_notifications_read result' |
| apps/mobile/src/features/onboarding/viewmodels/useOnboardingSetupViewModel.js:172 | saveError?.message \|\| SAVE_FAILED_MESSAGE |
| apps/mobile/src/features/push/services/pushRegistrationService.js:19 | 'Push registration input is invalid.' |
| apps/mobile/src/features/push/services/pushRegistrationService.js:26 | 'Push registration requires an authenticated session.' |
| apps/mobile/src/features/push/services/pushRegistrationService.js:41 | 'Push registration failed.' |
| apps/mobile/src/features/push/services/pushRegistrationService.js:69 | 'Push revoke failed.' |
| apps/mobile/src/features/push/services/pushTokenService.js:10 | 'Push project configuration is missing.' |
| apps/mobile/src/features/push/services/pushTokenService.js:19 | 'Push token is currently unavailable.' |
| apps/mobile/src/features/push/services/pushTokenService.js:26 | 'Push token is currently unavailable.' |
| apps/mobile/src/features/push/utils/pushClientPolicy.cjs:237 | 'Push installation identity is unavailable.' |
| apps/mobile/src/features/push/utils/pushClientPolicy.cjs:244 | 'Push installation identity was malformed.' |
| apps/mobile/src/shared/utils/externalLinkPolicy.cjs:32 | 'External target is not supported on this device.' |
| apps/mobile/src/shared/utils/istanbulDateContract.cjs:7 | 'Geçerli bir tarih bulunamadı.' |
| apps/mobile/src/shared/utils/istanbulDateContract.cjs:36 | 'Geçerli bir gün farkı bulunamadı.' |
| apps/mobile/src/shared/utils/localDate.js:22 | 'Geçerli bir hafta günü bulunamadı.' |

## İnceleme sonucu

Kayıtta Supabase zayıf şifre, e-posta biçimi, tekrarlanan hesap, hız sınırı ve ağ hataları genel mesaja dönüşüyor. Şifre uzunluğu kayıttan önce doğrulanmıyor; kayıt ekranında şifre kuralı yok. Onboarding ekranda geri oku içeriyor, Android donanım geri davranışı adımlar için yönetilmiyor. Sağlık tercihleri kayıt sırasında isteğe bağlı; son kullanıcı talebiyle başlangıç onayları zorunlu hale getirilecek. Ayarlar’da rızayı geri alma korunacak. Şifre sıfırlama/değiştirme ve diğer modüllerde kullanıcıya gösterilen hatalar güvenli açıklama ve destek kodu ile eşlenecek. Bilinmeyen teknik mesaj, SQL, token, e-posta veya özel kullanıcı verisi gösterilmeyecek.
