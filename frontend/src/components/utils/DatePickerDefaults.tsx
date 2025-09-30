'use client';

import { pl } from 'date-fns/locale';
import { setDefaultOptions } from 'date-fns';
import { useEffect } from 'react';

export function DatePickerDefaults() {
    useEffect(() => {
        setDefaultOptions({ locale: pl });
    }, []);

    return null;
}