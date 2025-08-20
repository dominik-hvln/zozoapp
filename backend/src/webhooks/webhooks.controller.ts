import { Controller, Post, Headers, Req, RawBodyRequest, InternalServerErrorException } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import Stripe from 'stripe';

@Controller('webhooks')
export class WebhooksController {
    private stripe: Stripe;
    constructor(private readonly webhooksService: WebhooksService) {
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeSecretKey) { throw new InternalServerErrorException('Stripe secret key is not configured.'); }
        this.stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-07-30.basil' });
    }

    @Post('stripe')
    async handleStripeWebhook(@Headers('stripe-signature') sig: string, @Req() req: RawBodyRequest<Request>) {
        console.log('[WEBHOOK] Otrzymano nowe żądanie od Stripe...');

        if (!req.rawBody) {
            console.error('[WEBHOOK BŁĄD KRYTYCZNY] Brak surowego ciała zapytania.');
            return { received: false, error: 'Brak surowego ciała zapytania.' };
        }
        if (!sig) {
            console.error('[WEBHOOK BŁĄD KRYTYCZNY] Brak nagłówka stripe-signature.');
            return { received: false, error: 'Brak nagłówka stripe-signature.' };
        }

        let event: Stripe.Event;
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.error('[WEBHOOK BŁĄD KRYTYCZNY] Brak skonfigurowanego STRIPE_WEBHOOK_SECRET.');
            throw new InternalServerErrorException('Stripe webhook secret is not configured.');
        }

        try {
            event = this.stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
            console.log(`[WEBHOOK] Weryfikacja podpisu pomyślna. Typ zdarzenia: ${event.type}`);
        } catch (err) {
            console.error(`[WEBHOOK BŁĄD KRYTYCZNY] Błąd weryfikacji podpisu webhooka Stripe:`, err.message);
            return { received: false, error: `Webhook Error: ${err.message}` };
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;
            await this.webhooksService.handleSuccessfulCheckout(session);
        } else {
            console.log(`[WEBHOOK] Zignorowano nieobsługiwany typ zdarzenia: ${event.type}`);
        }

        return { received: true };
    }
}