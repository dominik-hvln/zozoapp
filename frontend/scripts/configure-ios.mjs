import fs from 'fs';
import path from 'path';

// --- Szablon poprawnego pliku AppDelegate.swift ---
const appDelegateTemplate = `import UIKit
import Capacitor
import FirebaseCore
import FirebaseMessaging

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

  var window: UIWindow?

  func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    FirebaseApp.configure()
    return true
  }

  func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    Messaging.messaging().apnsToken = deviceToken
    Messaging.messaging().token(completion: { (token, error) in
      if let error = error {
          NotificationCenter.default.post(name: NSNotification.Name("capacitorDidFailToRegisterForRemoteNotifications"), object: error)
      } else if let token = token {
          NotificationCenter.default.post(name: NSNotification.Name("capacitorDidRegisterForRemoteNotifications"), object: token)
      }
    })
  }

  func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    NotificationCenter.default.post(name: NSNotification.Name("capacitorDidFailToRegisterForRemoteNotifications"), object: error)
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
}
`;

// --- Wpisy do Info.plist ---
const plistEntries = [
    { key: 'NSCameraUsageDescription', xml: `\t<key>NSCameraUsageDescription</key>\n\t<string>Potrzebujemy dostępu do aparatu, aby skanować kody QR na tatuażach.</string>` },
    { key: 'NSPhotoLibraryUsageDescription', xml: `\t<key>NSPhotoLibraryUsageDescription</key>\n\t<string>Potrzebujemy dostępu do galerii, abyś mógł/mogła wybrać awatar dla dziecka.</string>` },
    { key: 'CFBundleURLTypes', xml: `\t<key>CFBundleURLTypes</key>\n\t<array>\n\t\t<dict>\n\t\t\t<key>CFBundleURLSchemes</key>\n\t\t\t<array>\n\t\t\t\t<string>zozoapp</string>\n\t\t\t</array>\n\t\t</dict>\n\t</array>` }
];

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

// --- Główne zadania ---
function configureIOS() {
    // 1. Aktualizuj AppDelegate.swift
    patchFile(
        path.resolve('ios/App/App/AppDelegate.swift'),
        'AppDelegate.swift',
        'FirebaseApp.configure()', // Sprawdź, czy już ma kod Firebase
        () => appDelegateTemplate // Po prostu nadpisz cały plik
    );

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

    // 3. Aktualizuj Podfile
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
}

// Uruchomienie skryptu
configureIOS();