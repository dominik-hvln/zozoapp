import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Odczyt w runtime — wystarczy restart kontenera frontendu, bez rebuildu iOS. */
export async function GET() {
    return NextResponse.json({
        appStoreReviewMode: process.env.APP_STORE_REVIEW_MODE === 'true',
    });
}
