import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // KROK 1: Ustawiamy globalny prefix dla wszystkich tras API
    app.setGlobalPrefix('api');

    // KROK 2: Ustawiamy jawną i szczegółową konfigurację CORS
    app.enableCors({
        origin: process.env.FRONTEND_URL, // Pobieramy URL frontendu ze zmiennych środowiskowych
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });

    await app.listen(3001);
}
bootstrap();