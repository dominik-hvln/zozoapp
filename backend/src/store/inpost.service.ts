import { BadGatewayException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { randomUUID } from 'crypto';

type InpostTokenCache = {
  accessToken: string;
  expiresAt: number;
};

@Injectable()
export class InpostService {
  private tokenCache: InpostTokenCache | null = null;

  private getApiBaseUrl() {
    return process.env.INPOST_API_BASE_URL ?? 'https://api-shipx-pl.easypack24.net';
  }

  private getOauthUrl() {
    return process.env.INPOST_OAUTH_URL ?? 'https://api.inpost-group.com/oauth2/token';
  }

  private async getAuthorizationHeader() {
    const apiToken = process.env.INPOST_API_TOKEN;
    if (apiToken) {
      return `Bearer ${apiToken}`;
    }
    const oauthToken = await this.getAccessToken();
    return `Bearer ${oauthToken}`;
  }

  private async getAccessToken() {
    if (this.tokenCache && Date.now() < this.tokenCache.expiresAt) {
      return this.tokenCache.accessToken;
    }

    const clientId = process.env.INPOST_CLIENT_ID;
    const clientSecret = process.env.INPOST_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new InternalServerErrorException('Brak konfiguracji INPOST_CLIENT_ID lub INPOST_CLIENT_SECRET.');
    }

    const scope = process.env.INPOST_SCOPES ?? 'openid api:points:read api:shipments:read api:shipments:write api:tracking:read';
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      scope,
    });

    const response = await fetch(this.getOauthUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new BadGatewayException(`Nie udało się pobrać tokenu InPost: ${text}`);
    }

    const payload = await response.json() as { access_token: string; expires_in: number };
    const ttlMs = Math.max((payload.expires_in - 60) * 1000, 60_000);
    this.tokenCache = {
      accessToken: payload.access_token,
      expiresAt: Date.now() + ttlMs,
    };

    return payload.access_token;
  }

  async getPoints(query: Record<string, string | undefined>) {
    const authorizationHeader = await this.getAuthorizationHeader();
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(query)) {
      if (value) {
        params.set(key, value);
      }
    }

    if (!params.has('type')) {
      params.set('type', 'parcel_locker');
    }

    const response = await fetch(`${this.getApiBaseUrl()}/v1/points?${params.toString()}`, {
      headers: {
        Authorization: authorizationHeader,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new BadGatewayException(`Nie udało się pobrać punktów InPost: ${text}`);
    }

    return response.json();
  }

  async getShipmentById(shipmentId: string) {
    const authorizationHeader = await this.getAuthorizationHeader();
    const response = await fetch(`${this.getApiBaseUrl()}/v1/shipments/${shipmentId}`, {
      headers: {
        Authorization: authorizationHeader,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new BadGatewayException(`Nie udało się pobrać przesyłki ShipX: ${text}`);
    }

    return response.json();
  }

  async getOrganization(organizationId: string) {
    const authorizationHeader = await this.getAuthorizationHeader();
    const response = await fetch(`${this.getApiBaseUrl()}/v1/organizations/${organizationId}`, {
      headers: {
        Authorization: authorizationHeader,
      },
    });
    if (!response.ok) {
      const text = await response.text();
      throw new BadGatewayException(`Nie udało się pobrać danych organizacji ShipX: ${text}`);
    }
    return response.json();
  }

  async createShipment(organizationId: string, payload: unknown) {
    const authorizationHeader = await this.getAuthorizationHeader();
    const response = await fetch(`${this.getApiBaseUrl()}/v1/organizations/${organizationId}/shipments`, {
      method: 'POST',
      headers: {
        Authorization: authorizationHeader,
        'Content-Type': 'application/json',
        'X-Request-Id': randomUUID(),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new BadGatewayException(`Nie udało się utworzyć przesyłki ShipX: ${text}`);
    }

    return response.json();
  }

  async getTrackingByNumber(trackingNumber: string) {
    const response = await fetch(`${this.getApiBaseUrl()}/v1/tracking/${trackingNumber}`);
    if (!response.ok) {
      const text = await response.text();
      throw new BadGatewayException(`Nie udało się pobrać trackingu ShipX: ${text}`);
    }
    return response.json();
  }

  async createDispatchOrder(organizationId: string, payload: unknown) {
    const authorizationHeader = await this.getAuthorizationHeader();
    const response = await fetch(`${this.getApiBaseUrl()}/v1/organizations/${organizationId}/dispatch_orders`, {
      method: 'POST',
      headers: {
        Authorization: authorizationHeader,
        'Content-Type': 'application/json',
        'X-Request-Id': randomUUID(),
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new BadGatewayException(`Nie udało się utworzyć zlecenia odbioru ShipX: ${text}`);
    }
    return response.json();
  }

  async getShipmentLabel(shipmentId: string, format = 'Pdf', type = 'A6') {
    const authorizationHeader = await this.getAuthorizationHeader();
    const params = new URLSearchParams({
      format,
      type,
    });
    const response = await fetch(`${this.getApiBaseUrl()}/v1/shipments/${shipmentId}/label?${params.toString()}`, {
      headers: {
        Authorization: authorizationHeader,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new BadGatewayException(`Nie udało się pobrać etykiety ShipX: ${text}`);
    }

    const contentType = response.headers.get('content-type') ?? 'application/pdf';
    const bytes = await response.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    return {
      contentType,
      body: base64,
      parsedJson: null,
    };
  }
}
