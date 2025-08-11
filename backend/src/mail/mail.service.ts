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
                from: 'ZozoApp <powiadomienia@twojadomena.com>', // WAŻNE: Użyj domeny zweryfikowanej w Resend
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
}