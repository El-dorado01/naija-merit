import 'reflect-metadata';
import 'dotenv/config';

// Dynamic import to handle module resolution in both dev and production
// Vercel compiles TypeScript, so we need to handle both source and compiled paths
async function loadBootstrap() {
  // In Vercel serverless environment, files are flattened.
  // We need to check various locations where the compiled main file might be.
  const potentialPaths = [
    '../dist/main', // Standard NestJS build output
    '../src/main', // Source location (for dev)
    './dist/main', // Relative to api folder
    '../../dist/main', // Up two levels
    '../dist/src/main', // Sometimes nested in src
  ];

  for (const path of potentialPaths) {
    try {
      const mod = require(path);
      if (mod && mod.bootstrap) {
        console.log(`Successfully loaded bootstrap from: ${path}`);
        return mod.bootstrap;
      }
    } catch (e) {
      // Continue to next path
    }
  }

  // Last ditch attempt: dynamic import for ESM modules (unlikely for default NestJS but possible)
  for (const path of potentialPaths) {
    try {
      const mod = await import(path);
      if (mod && mod.bootstrap) {
        console.log(`Successfully loaded bootstrap (ESM) from: ${path}`);
        return mod.bootstrap;
      }
    } catch (e) {
      // Continue
    }
  }

  console.error('Failed to load bootstrap. Checked paths:', potentialPaths);
  throw new Error(
    'Cannot load bootstrap function. Ensure the project is built and dist/main.js exists.',
  );
}

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
      console.log('Environment check:', {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'MISSING',
        JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'MISSING',
      });

      console.log('Loading bootstrap function...');
      const bootstrapFn = await loadBootstrap();

      console.log('Creating NestJS app...');
      cachedApp = await bootstrapFn();

      console.log('App created, initializing...');
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
