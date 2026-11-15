import 'reflect-metadata';
import { taiBienMoiTruong } from './config/moi-truong';

taiBienMoiTruong();

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './tasks/task-01-khoi-tao/ung-dung.module';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigin = process.env.WEB_ORIGIN || 'http://localhost:3000';
  app.enableCors({origin: allowedOrigin.split(',').map(v => v.trim()), credentials: true});
  app.useGlobalPipes(new ValidationPipe({whitelist:true, transform:true}));

  // Logger theo dõi trực tiếp giao tiếp từ Frontend tới Backend
  app.use((req: any, res: any, next: any) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[GIAO TIẾP FRONTEND -> BACKEND] ${req.method} ${req.path || req.url.split('?')[0]} -> ${res.statusCode} (${duration}ms)`);
    });
    next();
  });
  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`BrewLite API listening on ${port}`);
}
bootstrap();
