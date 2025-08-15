import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json } from 'express';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.use(json({
        verify: (req: any, res, buf) => {
            req.rawBody = buf;
        }
    }));
    app.useGlobalPipes(new ValidationPipe());
    app.enableCors({
        origin: process.env.FRONTEND_URL,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });

    await app.listen(3001);
}
bootstrap();