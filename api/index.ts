import 'reflect-metadata';
import 'dotenv/config';
import { bootstrap } from '../src/main';

let cachedHandler: any;

export default async (req: any, res: any) => {
  // Global CORS handling
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (!cachedHandler) {
      console.log('Bootstrapping NestJS for Vercel...');
      const app = await bootstrap();
      await app.init();
      cachedHandler = app.getHttpAdapter().getInstance();
      console.log('NestJS bootstrapped successfully');
    }
    return cachedHandler(req, res);
  } catch (error) {
    console.error('Failed to handle request:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
