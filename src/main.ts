import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

let cachedServer: any;

async function bootstrap() {
  if (!cachedServer) {
    const app = await NestFactory.create(AppModule);
    app.setGlobalPrefix('api/v1');
    app.enableCors();
    await app.init();
    cachedServer = app.getHttpAdapter().getInstance();
  }
  return cachedServer;
}

// Export a handler for Vercel
export default async (req: any, res: any) => {
  const server = await bootstrap();
  return server(req, res);
};

// Local development support
if (process.env.NODE_ENV !== 'production') {
  const startLocal = async () => {
    const app = await NestFactory.create(AppModule);
    app.setGlobalPrefix('api/v1');
    app.enableCors();
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    console.log(`Server running on http://localhost:${port}/api/v1`);
  };
  startLocal();
}
