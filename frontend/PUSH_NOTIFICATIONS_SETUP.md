
# 🔔 Instrukcja konfiguracji powiadomień push na iOS

## Automatyczna konfiguracja

### Dla nowego projektu:
```bash
npm run setup:ios
```

### Dla istniejącego projektu (po zmianach):
```bash
npm run config:ios
```

## Co robi automatyczna konfiguracja:

### 1. AppDelegate.swift
- ✅ Importuje wszystkie niezbędne biblioteki (FirebaseCore, FirebaseMessaging, UserNotifications)
- ✅ Inicjalizuje Firebase w `didFinishLaunchingWithOptions`
- ✅ Ustawia delegaty dla Messaging i UNUserNotificationCenter
- ✅ Automatycznie prosi o zgodę na powiadomienia
- ✅ Obsługuje rejestrację tokenów FCM i APNs
- ✅ Przekazuje tokeny do Capacitor przez NotificationCenter
- ✅ Obsługuje powiadomienia w foreground i background

### 2. Info.plist
- ✅ NSCameraUsageDescription - dostęp do aparatu
- ✅ NSPhotoLibraryUsageDescription - dostęp do galerii
- ✅ CFBundleURLTypes - deep linking (zozoapp://)

### 3. App.entitlements
- ✅ aps-environment: development - uprawnienia do powiadomień push
- ✅ com.apple.developer.push-to-talk - obsługa push-to-talk

### 4. Podfile
- ✅ FirebaseCore - podstawowa biblioteka Firebase
- ✅ FirebaseMessaging - obsługa FCM

### 5. Sprawdzenie plików
- ✅ Weryfikuje obecność GoogleService-Info.plist

## Ręczne kroki do wykonania:

### 1. Firebase Configuration
1. Pobierz `GoogleService-Info.plist` z Firebase Console
2. Umieść go w `ios/App/App/GoogleService-Info.plist`
3. Dodaj go do projektu Xcode (przeciągnij do folderu App)

### 2. Apple Developer Account
1. Włącz "Push Notifications" w App Identifier
