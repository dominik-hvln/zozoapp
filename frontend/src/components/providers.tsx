'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { AppReviewModeProvider } from '@/contexts/app-review-context'

export default function Providers({
    children,
    initialReviewMode = false,
}: {
    children: React.ReactNode;
    initialReviewMode?: boolean;
}) {
    const [queryClient] = useState(() => new QueryClient())

    return (
        <QueryClientProvider client={queryClient}>
            <AppReviewModeProvider initialReviewMode={initialReviewMode}>
                {children}
            </AppReviewModeProvider>
        </QueryClientProvider>
    )
}