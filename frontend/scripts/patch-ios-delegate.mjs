import fs from 'fs';
import path from 'path';

// --- KONFIGURACJA ---
const delegatePath = path.resolve('ios/App/App/AppDelegate.swift');

const userNotificationsImport = 'import UserNotifications';

const extensionTag = '// CAPACITOR-NOTIFICATION-EXTENSION-TAG';
const extensionCode = `
${extensionTag}
// Rozszerzenie dodane automatycznie w celu definicji nazw powiadomień Capacitor
extension NSNotification.Name {
    static let capacitorDidRegisterForRemoteNotifications = Notification.Name("capacitorDidRegisterForRemoteNotifications")
    static let capacitorDidFailToRegisterForRemoteNotifications = Notification.Name("capacitorDidFailToRegisterForRemoteNotifications")
    static let capacitorHandlePushNotification = Notification.Name("capacitorHandlePushNotification")
}
`;

const handlerTag = '// CAPACITOR-NOTIFICATION-HANDLER-TAG';
const handlerCode = `
    ${handlerTag}
    // Metody dodane automatycznie do obsługi powiadomień push
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        NotificationCenter.default.post(name: .capacitorHandlePushNotification, object: notification.request.content.userInfo)
        completionHandler([.banner, .sound, .badge])
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        NotificationCenter.default.post(name: .capacitorHandlePushNotification, object: response.notification.request.content.userInfo)
        completionHandler()
    }
`;

// --- GŁÓWNA LOGIKA ---
function patchAppDelegate() {
    try {
        let content = fs.readFileSync(delegatePath, 'utf8');
        let changesMade = false;

        const capacitorImport = 'import Capacitor';
        if (!content.includes(capacitorImport)) {
            throw new Error('Nie znaleziono "import Capacitor" w AppDelegate.swift. Czy to poprawny plik?');
        }

        // 1. Upewnij się, że 'import UserNotifications' istnieje
        if (!content.includes(userNotificationsImport)) {
            content = content.replace(capacitorImport, `${capacitorImport}\n${userNotificationsImport}`);
            changesMade = true;
            console.log('✅ Dodano brakujący "import UserNotifications".');
        }

        // 2. Sprawdź i dodaj rozszerzenie (extension)
        if (!content.includes(extensionTag)) {
            content = content.replace(userNotificationsImport, `${userNotificationsImport}${extensionCode}`);
            changesMade = true;
            console.log('✅ Dodano rozszerzenie NSNotification.Name.');
        } else {
            console.log('ℹ️ Rozszerzenie NSNotification.Name już istnieje. Pomijam.');
        }

        // 3. Sprawdź i dodaj funkcje obsługi (handlers)
        if (!content.includes(handlerTag)) {
            const lastBraceIndex = content.lastIndexOf('}');
            content = content.slice(0, lastBraceIndex) + handlerCode + content.slice(lastBraceIndex);
            changesMade = true;
            console.log('✅ Dodano funkcje obsługi powiadomień.');
        } else {
            console.log('ℹ️ Funkcje obsługi powiadomień już istnieją. Pomijam.');
        }

        // 4. Zapisz plik, jeśli dokonano zmian
        if (changesMade) {
            fs.writeFileSync(delegatePath, content, 'utf8');
            console.log('🎉 Pomyślnie zaktualizowano AppDelegate.swift!');
        } else {
            console.log('👍 Plik AppDelegate.swift nie wymagał żadnych zmian.');
        }

    } catch (error) {
        console.error('❌ Błąd podczas aktualizacji AppDelegate.swift:', error.message);
    }
}

patchAppDelegate();