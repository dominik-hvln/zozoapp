import fs from 'fs';
import path from 'path';

// --- Szablon kompletnego pliku AppDelegate.swift z obsługą push notifications ---
const appDelegateTemplate = `import UIKit
import Capacitor
import FirebaseCore
import FirebaseMessaging
import UserNotifications

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

        func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Initialize Firebase
        FirebaseApp.configure()

        // Set messaging delegate
        Messaging.messaging().delegate = self

        // Set UNUserNotificationCenter delegate
        UNUserNotificationCenter.current().delegate = self

        // Request authorization for notifications
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in
        print("Permission granted: \\(granted)")
            if granted {
                DispatchQueue.main.async {
                    UIApplication.shared.registerForRemoteNotifications()
                }
            }
        }

        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {}
    func applicationDidEnterBackground(_ application: UIApplication) {}
    func applicationWillEnterForeground(_ application: UIApplication) {}
    func applicationDidBecomeActive(_ application: UIApplication) {}
    func applicationWillTerminate(_ application: UIApplication) {}

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        print("APNs token retrieved: \\(deviceToken)")

        // Set APNs token for FCM
        Messaging.messaging().apnsToken = deviceToken

        // Get FCM token and forward it properly
        Messaging.messaging().token { token, error in
            if let error = error {
                print("Error fetching FCM registration token: \\(error)")
                NotificationCenter.default.post(
                    name: NSNotification.Name.capacitorDidFailToRegisterForRemoteNotifications,
                    object: error
            )
            } else if let token = token {
                print("FCM registration token from didRegister: \\(token)")

                // Forward token to Capacitor immediately
                DispatchQueue.main.async {
                    print("Posting FCM token to Capacitor from didRegister...")
                    NotificationCenter.default.post(
                        name: NSNotification.Name.capacitorDidRegisterForRemoteNotifications,
                        object: token
                )
                }
            }
        }
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("Failed to register for remote notifications: \\(error)")
        NotificationCenter.default.post(name: NSNotification.Name.capacitorDidFailToRegisterForRemoteNotifications, object: error)
    }
}

// MARK: - MessagingDelegate
extension AppDelegate: MessagingDelegate {
    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        print("Firebase registration token received in delegate: \\(String(describing: fcmToken))")
        if let token = fcmToken {
            print("Forwarding FCM token to Capacitor...")

            // Przekaż token przez wszystkie możliwe kanały
            NotificationCenter.default.post(
                name: NSNotification.Name("capacitorDidRegisterForRemoteNotifications"),
                object: token
        )

            // Dodatkowo, spróbuj przez Capacitor bridge bezpośrednio
            DispatchQueue.main.async {
                NotificationCenter.default.post(
                    name: NSNotification.Name.capacitorDidRegisterForRemoteNotifications,
                    object: token
            )
            }
        }
    }
}

// MARK: - UNUserNotificationCenterDelegate
extension AppDelegate: UNUserNotificationCenterDelegate {
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        let userInfo = notification.request.content.userInfo
        print("Will present notification: \\(userInfo)")

        NotificationCenter.default.post(name: NSNotification.Name("capacitorHandlePushNotification"), object: userInfo)

        // Show notification even when app is in foreground
        completionHandler([.banner, .sound, .badge])
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        let userInfo = response.notification.request.content.userInfo
        print("Did receive notification response: \\(userInfo)")

        NotificationCenter.default.post(name: NSNotification.Name("capacitorHandlePushNotification"), object: userInfo)
        completionHandler()
    }
}
`;

// --- Wpisy do Info.plist ---
const plistEntries = [
    { key: 'NSCameraUsageDescription', xml: `\t<key>NSCameraUsageDescription</key>\n\t<string>Potrzebujemy dostępu do aparatu, aby skanować kody QR na tatuażach.</string>` },
    { key: 'NSPhotoLibraryUsageDescription', xml: `\t<key>NSPhotoLibraryUsageDescription</key>\n\t<string>Potrzebujemy dostępu do galerii, abyś mógł/mogła wybrać awatar dla dziecka.</string>` },
    { key: 'CFBundleURLTypes', xml: `\t<key>CFBundleURLTypes</key>\n\t<array>\n\t\t<dict>\n\t\t\t<key>CFBundleURLSchemes</key>\n\t\t\t<array>\n\t\t\t\t<string>zozoapp</string>\n\t\t\t</array>\n\t\t</dict>\n\t</array>` }
];

// --- Dodanie uprawnień do powiadomień push w App.entitlements ---
const entitlementsContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
    <dict>
\t<key>aps-environment</key>
\t<string>development</string>
\t<key>com.apple.developer.push-to-talk</key>
\t<true/>
</dict>
</plist>
`;

// --- Funkcje pomocnicze ---
const log = (message, type = 'info') => {
    const icons = { info: 'ℹ️', success: '✅', error: '❌', warn: '⚠️' };
    console.log(`${icons[type]} ${message}`);
};

const patchFile = (filePath, patchName, validationContent, patchFunction) => {
    log(`Sprawdzanie ${patchName}...`);
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        if (content.includes(validationContent)) {
            log(`${patchName} nie wymaga zmian.`);
            return;
        }
        const newContent = patchFunction(content);
        fs.writeFileSync(filePath, newContent, 'utf8');
        log(`${patchName} został pomyślnie zaktualizowany!`, 'success');
    } catch (err) {
        log(`Błąd podczas aktualizacji ${patchName}: ${err.message}`, 'error');
    }
};

const createFileIfNotExists = (filePath, content, description) => {
    try {
        if (fs.existsSync(filePath)) {
            log(`${description} już istnieje.`);
            return;
        }
        
        // Upewnij się, że katalog istnieje
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(filePath, content, 'utf8');
        log(`${description} został utworzony!`, 'success');
    } catch (err) {
        log(`Błąd podczas tworzenia ${description}: ${err.message}`, 'error');
    }
};

// --- Główne zadania ---
function configureIOS() {
    log('🔧 Rozpoczynanie automatycznej konfiguracji iOS dla powiadomień push...');

    // 1. Zawsze nadpisz AppDelegate.swift najnowszą wersją
    log('Aktualizowanie AppDelegate.swift...');
    try {
        const appDelegatePath = path.resolve('ios/App/App/AppDelegate.swift');
        fs.writeFileSync(appDelegatePath, appDelegateTemplate, 'utf8');
        log('AppDelegate.swift został pomyślnie zaktualizowany!', 'success');
    } catch (err) {
        log(`Błąd podczas aktualizacji AppDelegate.swift: ${err.message}`, 'error');
    }

    // 2. Aktualizuj Info.plist
    patchFile(
        path.resolve('ios/App/App/Info.plist'),
        'Info.plist',
        'NSCameraUsageDescription', // Sprawdź tylko jeden klucz
        (content) => {
            let contentToInsert = '';
            for (const entry of plistEntries) {
                if (!content.includes(`<key>${entry.key}</key>`)) {
                    contentToInsert += `\n${entry.xml}`;
                }
            }
            const lastClosingDictIndex = content.lastIndexOf('</dict>');
            return content.slice(0, lastClosingDictIndex) + contentToInsert + content.slice(lastClosingDictIndex);
        }
    );

    // 3. Utwórz/zaktualizuj App.entitlements
    createFileIfNotExists(
        path.resolve('ios/App/App/App.entitlements'),
        entitlementsContent,
        'App.entitlements'
    );

    // 4. Aktualizuj Podfile
    patchFile(
        path.resolve('ios/App/Podfile'),
        'Podfile',
        "pod 'FirebaseMessaging'",
        (content) => {
            let newContent = content;
            if (!content.includes("pod 'FirebaseMessaging'")) {
                newContent = content.replace(
                    "target 'App' do",
                    "target 'App' do\n  pod 'FirebaseMessaging'"
                );
            }
            if (!content.includes("pod 'FirebaseCore'")) {
                newContent = newContent.replace(
                    "target 'App' do",
                    "target 'App' do\n  pod 'FirebaseCore'"
                );
            }
            return newContent;
        }
    );

    // 5. Sprawdź obecność GoogleService-Info.plist
    const googleServicePath = path.resolve('ios/App/App/GoogleService-Info.plist');
    if (fs.existsSync(googleServicePath)) {
        log('GoogleService-Info.plist jest obecny.', 'success');
    } else {
        log('UWAGA: GoogleService-Info.plist nie został znaleziony!', 'warn');
        log('Pamiętaj, aby dodać ten plik do projektu iOS.', 'warn');
    }

    log('🎉 Konfiguracja iOS zakończona pomyślnie!', 'success');
    log('Następne kroki:', 'info');
    log('1. Uruchom: npx cap sync ios', 'info');
    log('2. Uruchom: cd ios/App && pod install', 'info');
    log('3. Otwórz projekt w Xcode: npx cap open ios', 'info');
}

// Uruchomienie skryptu
configureIOS();