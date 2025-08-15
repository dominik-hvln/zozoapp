import { Controller, Post, Headers, Req, RawBodyRequest, BadRequestException } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import Stripe from 'stripe';

@Controller('webhooks')
export class WebhooksController {
    private stripe: Stripe;
    constructor(private readonly webhooksService: WebhooksService) {
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeSecretKey) { throw new Error('Stripe secret key is not configured.'); }
        this.stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-07-30.basil' });
    }

    @Post('stripe')
    async handleStripeWebhook(@Headers('stripe-signature') sig: string, @Req() req: RawBodyRequest<Request>) {
        if (!req.rawBody) {
            throw new BadRequestException('Brak surowego ciała zapytania dla webhooka Stripe.');
        }

        let event: Stripe.Event;
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!webhookSecret) { throw new Error('Stripe webhook secret is not configured.'); }

        try {
            event = this.stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
        } catch (err) {
            console.error(`Błąd weryfikacji podpisu webhooka Stripe:`, err.message);
            return { received: false, error: `Webhook Error: ${err.message}` };
        }

        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object as Stripe.Checkout.Session;
                await this.webhooksService.handleSuccessfulCheckout(session);
                break;
            default:
                console.log(`Nieobsługiwany typ zdarzenia: ${event.type}`);
        }

        return { received: true };
    }
}