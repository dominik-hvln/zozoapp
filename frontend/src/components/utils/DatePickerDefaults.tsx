'use client';

import { pl } from 'date-fns/locale';
import { setDefaultOptions } from 'date-fns';
import { useEffect } from 'react';

export function DatePickerDefaults() {
    useEffect(() => {
        // Ta linia ustawia polski jako domyślny język dla całej biblioteki date-fns
        setDefaultOptions({ locale: pl });
    }, []);

    return null; // Ten komponent nic nie renderuje
}