import 'reflect-metadata';
import 'dotenv/config';
import { bootstrap } from '../src/main';

let cachedApp: any;

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
    // Cache the NestJS app instance across invocations
    if (!cachedApp) {
      console.log('Bootstrapping NestJS for Vercel...');
      cachedApp = await bootstrap();
      await cachedApp.init();
      console.log('NestJS bootstrapped successfully');
    }

    // Get the Express instance from NestJS
    const expressApp = cachedApp.getHttpAdapter().getInstance();
    
    // Wrap Express handler in a Promise to properly handle async operations
    return new Promise((resolve, reject) => {
      expressApp(req, res, (err: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(undefined);
        }
      });
    });
  } catch (error) {
    console.error('Failed to handle request:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
    });
    
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack }),
      });
    }
  }
};
