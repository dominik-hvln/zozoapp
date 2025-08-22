import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
    private readonly resend = new Resend(process.env.RESEND_API_KEY);

    async sendScanNotification(
        parentEmail: string,
        parentName: string,
        childName: string,
    ) {
        try {
            await this.resend.emails.send({
                from: 'ZozoApp <powiadomienia@zozoapp.pl>',
                to: parentEmail,
                subject: `Ważny alert: Ktoś zeskanował tatuaż Twojego dziecka ${childName}!`,
                html: `
          <h1>Cześć ${parentName},</h1>
          <p>Mamy ważną informację! Ktoś właśnie zeskanował tatuaż przypisany do <strong>${childName}</strong>.</p>
          <p>Otrzymasz osobne powiadomienie, jeśli znalazca udostępni swoją lokalizację.</p>
          <p>Pozdrawiamy,</p>
          <p><strong>Zespół ZozoApp</strong></p>
        `,
            });
            console.log('Wysłano e-mail z powiadomieniem.');
        } catch (error) {
            console.error('Błąd podczas wysyłania e-maila:', error);
        }
    }

    async sendWelcomeEmail(userEmail: string, userName: string) {
        try {
            await this.resend.emails.send({
                from: 'ZozoApp <powiadomienia@zozoapp.pl>',
                to: userEmail,
                subject: 'Witaj w ZozoApp! Twoje konto jest gotowe.',
                html: `
          <h1>Cześć ${userName},</h1>
          <p>Dziękujemy za dołączenie do ZozoApp! Twoje konto zostało pomyślnie utworzone.</p>
          <p>Twoje darmowe, 14-dniowe konto próbne jest już aktywne. Zaloguj się, aby zacząć dodawać profile swoich dzieci i aktywować tatuaże.</p>
          <p>Pozdrawiamy,</p>
          <p><strong>Zespół ZozoApp</strong></p>
        `,
            });
            console.log('Wysłano e-mail powitalny.');
        } catch (error) {
            console.error('Błąd podczas wysyłania e-maila powitalnego:', error);
        }
    }

    async sendPasswordResetEmail(userEmail: string, resetLink: string) {
        try {
            await this.resend.emails.send({
                from: 'ZozoApp <powiadomienia@zozoapp.pl>',
                to: userEmail,
                subject: 'Resetowanie hasła w ZozoApp',
                html: `
          <h1>Cześć,</h1>
          <p>Otrzymaliśmy prośbę o zresetowanie hasła dla Twojego konta. Kliknij w poniższy link, aby ustawić nowe hasło:</p>
          <a href="${resetLink}">Ustaw nowe hasło</a>
          <p>Link jest ważny przez 1 godzinę.</p>
          <p>Jeśli nie prosiłeś/aś o zmianę hasła, zignoruj tę wiadomość.</p>
          <p>Pozdrawiamy, Zespół ZozoApp</p>
        `,
            });
        } catch (error) {
            console.error('Błąd podczas wysyłania e-maila resetującego hasło:', error);
            throw error;
        }
    }

    async sendOrderConfirmationEmail(userEmail: string, orderDetails: any) {
        const productListHtml = orderDetails.order_items.map((item: any) =>
            `<li>${item.product_variants?.products?.name || 'Nazwa produktu niedostępna'} (Wariant: ${item.product_variants?.quantity} szt.) x ${item.quantity} - <strong>${(item.price / 100).toFixed(2)} zł</strong></li>`
        ).join('');

        try {
            await this.resend.emails.send({
                from: 'ZozoApp <powiadomienia@zozoapp.pl>', // Pamiętaj o zmianie na produkcyjną domenę
                to: userEmail,
                subject: `Potwierdzenie zamówienia nr ${orderDetails.id}`,
                html: `
          <h1>Dziękujemy za Twoje zamówienie!</h1>
          <p>Cześć, właśnie otrzymaliśmy płatność za Twoje zamówienie. Poniżej znajdują się jego szczegóły:</p>
          <ul>${productListHtml}</ul>
          <p><strong>Suma: ${(orderDetails.total_amount / 100).toFixed(2)} zł</strong></p>
          <p>Wkrótce rozpoczniemy jego realizację.</p>
          <p>Pozdrawiamy, Zespół ZozoApp</p>
        `,
            });
            console.log(`[MAIL] Wysłano potwierdzenie zamówienia nr ${orderDetails.id} na adres ${userEmail}`);
        } catch (error) {
            console.error('[MAIL BŁĄD] Nie udało się wysłać potwierdzenia zamówienia:', error);
        }
    }
}