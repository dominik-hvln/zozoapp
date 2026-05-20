/**
 * Tryb review App Store — sterowany z serwera frontendu (APP_STORE_REVIEW_MODE).
 * Aplikacja iOS ładuje UI z https://app.zozoapp.pl — wystarczy env + restart/redeploy
 * frontendu, bez nowego builda w Xcode.
 */
export { useAppStoreReviewMode } from '@/contexts/app-review-context';
