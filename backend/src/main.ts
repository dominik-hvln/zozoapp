import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
    app.enableCors({
        origin: 'https://zozoapp-dlcovl3uo-hvln.vercel.app/',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    });
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
