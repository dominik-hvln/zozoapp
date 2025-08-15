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
                from: 'ZozoApp <onboarding@resend.dev>', // WAŻNE: Użyj domeny zweryfikowanej w Resend
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
                from: 'ZozoApp <onboarding@resend.dev>', // Pamiętaj o zmianie na produkcyjną domenę
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
}