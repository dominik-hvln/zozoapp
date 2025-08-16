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
    const allowedOrigins = [
        process.env.FRONTEND_URL,
        process.env.ADMIN_URL,
    ];
    if (process.env.NODE_ENV !== 'production') {
        allowedOrigins.push('http://localhost:3000');
        allowedOrigins.push('http://localhost:3002');
    }
    app.enableCors({
        origin: (origin, callback) => {
            const aO = allowedOrigins.filter(Boolean);
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