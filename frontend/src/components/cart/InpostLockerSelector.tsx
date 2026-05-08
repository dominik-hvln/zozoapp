'use client';

import Script from 'next/script';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
};

export function InpostLockerSelector({ value, onChange }: Props) {
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [widgetContainer, setWidgetContainer] = useState<HTMLDivElement | null>(null);
  const geowidgetToken = process.env.NEXT_PUBLIC_INPOST_GEOWIDGET_TOKEN ?? '';

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

  useEffect(() => {
    if (!widgetContainer) {
      return;
    }

    if (!isWidgetOpen || !geowidgetToken) {
      widgetContainer.innerHTML = '';
      return;
    }

    widgetContainer.innerHTML = '';
    const widget = document.createElement('inpost-geowidget');
    widget.setAttribute('onpoint', 'onpointselect');
    widget.setAttribute('token', geowidgetToken);
    widget.setAttribute('language', 'pl');
    widget.setAttribute('config', 'parcelCollect');
    widgetContainer.appendChild(widget);
  }, [isWidgetOpen, geowidgetToken, widgetContainer]);

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
            onClick={() => setIsWidgetOpen(true)}
            disabled={!geowidgetToken}
          >
            Wybierz na mapie
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

        <Dialog open={isWidgetOpen} onOpenChange={setIsWidgetOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-5xl">
            <DialogHeader>
              <DialogTitle>Wybierz Paczkomat InPost</DialogTitle>
            </DialogHeader>
            <div className="rounded-md border p-2">
              <div ref={setWidgetContainer} className="h-[75vh] min-h-[560px] w-full" />
            </div>
          </DialogContent>
        </Dialog>

        <style jsx global>{`
          inpost-geowidget {
            display: block;
            width: 100%;
            height: 100%;
            min-height: 560px;
          }
        `}</style>
      </CardContent>
    </Card>
  );
}
