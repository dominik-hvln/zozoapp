/** Odczyt env po stronie serwera Next (runtime przy deploy/restart). */
export function isAppStoreReviewModeServer(): boolean {
    return process.env.APP_STORE_REVIEW_MODE === 'true';
}
