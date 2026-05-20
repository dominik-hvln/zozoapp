'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type AppReviewContextValue = {
    isReviewMode: boolean;
    isLoaded: boolean;
};

const AppReviewContext = createContext<AppReviewContextValue>({
    isReviewMode: false,
    isLoaded: false,
});

export function AppReviewModeProvider({ children }: { children: React.ReactNode }) {
    const [isReviewMode, setIsReviewMode] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        let cancelled = false;

        fetch('/api/app-config', { cache: 'no-store' })
            .then((res) => res.json())
            .then((data: { appStoreReviewMode?: boolean }) => {
                if (!cancelled) {
                    setIsReviewMode(Boolean(data.appStoreReviewMode));
                    setIsLoaded(true);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setIsReviewMode(false);
                    setIsLoaded(true);
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <AppReviewContext.Provider value={{ isReviewMode, isLoaded }}>
            {children}
        </AppReviewContext.Provider>
    );
}

export function useAppStoreReviewMode(): AppReviewContextValue {
    return useContext(AppReviewContext);
}
