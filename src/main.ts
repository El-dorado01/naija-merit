import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { INestApplication } from '@nestjs/common';

export async function bootstrap(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.enableCors();
  return app;
}

// Local development support
if (require.main === module && !process.env.VERCEL) {
  async function startLocal() {
    const app = await bootstrap();
    const port = process.env.PORT ?? 3030;
    await app.listen(port);
    console.log(`Server running on http://localhost:${port}/api/v1`);
  }
  startLocal().catch((err) => {
    console.error('Error starting server:', err);
  });
}
