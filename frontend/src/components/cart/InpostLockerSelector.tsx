'use client';

import Script from 'next/script';
import { useEffect, useMemo, useState } from 'react';
import type React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'inpost-geowidget': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        token?: string;
        language?: string;
        config?: string;
        onpoint?: string;
      };
    }
  }
}

export type InpostPoint = {
  name: string;
  address?: {
    line1?: string;
    line2?: string;
  };
  address_details?: {
    city?: string;
    post_code?: string;
  };
};

type Props = {
  value: InpostPoint | null;
  onChange: (point: InpostPoint | null) => void;
  postalCode?: string;
};

type InpostPointsResponse = {
  items?: InpostPoint[];
};

export function InpostLockerSelector({ value, onChange, postalCode }: Props) {
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const geowidgetToken = process.env.NEXT_PUBLIC_INPOST_GEOWIDGET_TOKEN ?? '';
  const sanitizedPostalCode = (postalCode ?? '').trim();
  const { data: pointsData, isLoading: isPointsLoading } = useQuery({
    queryKey: ['inpost-points-fallback', sanitizedPostalCode],
    queryFn: async (): Promise<InpostPointsResponse> => {
      const response = await api.get('/store/inpost/points', {
        params: {
          relative_post_code: sanitizedPostalCode,
          functions: 'parcel_collect',
          type: 'parcel_locker',
          sort_by: 'distance_to_relative_point',
          per_page: 20,
        },
      });
      return response.data;
    },
    enabled: /^\d{2}-\d{3}$/.test(sanitizedPostalCode),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<InpostPoint>;
      if (customEvent.detail?.name) {
        onChange(customEvent.detail);
        setIsWidgetOpen(false);
      }
    };

    document.addEventListener('onpointselect', handler);
    return () => {
      document.removeEventListener('onpointselect', handler);
    };
  }, [onChange]);

  const selectedLabel = useMemo(() => {
    if (!value) {
      return 'Nie wybrano paczkomatu.';
    }
    const line1 = value.address?.line1 ?? '';
    const line2 = value.address?.line2 ?? '';
    return `${value.name} - ${line1} ${line2}`.trim();
  }, [value]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Paczkomat InPost</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{selectedLabel}</p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsWidgetOpen((current) => !current)}
            disabled={!geowidgetToken}
          >
            {isWidgetOpen ? 'Ukryj mapę' : 'Wybierz na mapie'}
          </Button>
          {value ? (
            <Button type="button" variant="ghost" onClick={() => onChange(null)}>
              Wyczyść wybór
            </Button>
          ) : null}
        </div>

        {!geowidgetToken ? (
          <p className="text-sm text-red-500">
            Brak konfiguracji mapy InPost. Ustaw `NEXT_PUBLIC_INPOST_GEOWIDGET_TOKEN`.
          </p>
        ) : null}

        <Script src="https://geowidget.inpost-group.com/inpost-geowidget.js" strategy="afterInteractive" />
        <link rel="stylesheet" href="https://geowidget.inpost-group.com/inpost-geowidget.css" />

        {isWidgetOpen && geowidgetToken ? (
          <div className="rounded-md border p-2">
            <inpost-geowidget
              onpoint="onpointselect"
              token={geowidgetToken}
              language="pl"
              config="parcelCollect"
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <p className="text-sm font-medium">Fallback: lista punktów</p>
          {!/^\d{2}-\d{3}$/.test(sanitizedPostalCode) ? (
            <p className="text-xs text-muted-foreground">Wpisz poprawny kod pocztowy, aby załadować listę paczkomatów.</p>
          ) : isPointsLoading ? (
            <p className="text-xs text-muted-foreground">Ładowanie punktów...</p>
          ) : pointsData?.items?.length ? (
            <div className="max-h-56 space-y-2 overflow-auto rounded-md border p-2">
              {pointsData.items.map((point) => (
                <button
                  key={point.name}
                  type="button"
                  className="w-full rounded border p-2 text-left hover:bg-muted"
                  onClick={() => onChange(point)}
                >
                  <p className="text-sm font-semibold">{point.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {point.address?.line1} {point.address?.line2}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Brak punktów dla podanego kodu pocztowego.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
