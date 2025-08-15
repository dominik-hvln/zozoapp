import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json } from 'express';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.setGlobalPrefix('api');
    app.use(json({
        verify: (req: any, res, buf) => {
            req.rawBody = buf;
        }
    }));
    app.useGlobalPipes(new ValidationPipe());
    const allowedOrigins = [
        process.env.FRONTEND_URL,
        process.env.ADMIN_URL,
    ];
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });

    await app.listen(3001);
}
bootstrap();