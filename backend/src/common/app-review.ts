import { ConfigService } from '@nestjs/config';

export function isAppStoreReviewMode(config: ConfigService): boolean {
    return config.get<string>('APP_STORE_REVIEW_MODE') === 'true';
}

/** Na czas review App Store — bez trialu, bez blokady, JWT zawsze ACTIVE. */
export function effectiveAccountStatus(
    config: ConfigService,
    accountStatus: string,
): 'TRIAL' | 'ACTIVE' | 'BLOCKED' {
    if (isAppStoreReviewMode(config)) {
        return 'ACTIVE';
    }
    return accountStatus as 'TRIAL' | 'ACTIVE' | 'BLOCKED';
}
