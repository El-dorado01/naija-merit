# Vercel FUNCTION_INVOCATION_FAILED - Troubleshooting Guide

## Quick Checklist

### 1. Environment Variables
**CRITICAL**: Make sure these are set in Vercel Dashboard → Settings → Environment Variables:

- ✅ `DATABASE_URL` - Your PostgreSQL connection string
- ✅ `JWT_SECRET` - A secret key for JWT tokens (any random string)
- ✅ `DIRECT_URL` - (Optional) Direct database URL if using connection pooling

**How to check:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify all required variables are set for **Production**, **Preview**, and **Development**
3. Redeploy after adding variables

### 2. Build Configuration

Verify your `package.json` has:
```json
{
  "scripts": {
    "vercel-build": "pnpm run build"
  }
}
```

And `vercel.json` exists with:
```json
{
  "version": 2,
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.ts"
    }
  ]
}
```

### 3. Check Build Logs

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on the latest deployment
3. Check the **Build Logs** tab
4. Look for errors like:
   - "Cannot find module"
   - "Prisma client not generated"
   - "Missing environment variable"

### 4. Check Function Logs

1. Go to Vercel Dashboard → Your Project → Functions
2. Click on `api/index`
3. Check the **Logs** tab
4. Look for the console.log messages we added:
   - "Bootstrapping NestJS for Vercel..."
   - "Environment check: ..."
   - Any error messages

### 5. Common Issues & Solutions

#### Issue: "Cannot find module '../src/main'"

**Solution**: The build might not be completing. Check:
- Build logs show "Build completed successfully"
- `dist/` folder exists in build output
- TypeScript compilation succeeded

**Fix**: Ensure `vercel-build` script runs `prisma generate && nest build`

#### Issue: "Prisma Client not generated"

**Solution**: Prisma client must be generated during build.

**Fix**: Your `vercel-build` script should include `prisma generate`:
```json
{
  "scripts": {
    "vercel-build": "prisma generate && nest build"
  }
}
```

#### Issue: "DATABASE_URL is not defined"

**Solution**: Environment variable not set in Vercel.

**Fix**: 
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add `DATABASE_URL` with your connection string
3. Redeploy

#### Issue: Timeout errors

**Solution**: Cold starts can be slow. The Prisma connection optimization should help.

**Fix**: Already implemented in `prisma.service.ts` - it skips connection on module init in serverless.

#### Issue: Multiple projects on free tier

**Note**: Having multiple projects on free tier should NOT cause this error. Each project is isolated.

However, free tier has limits:
- 100GB bandwidth/month
- 100 serverless function invocations/day per project
- 10s function timeout (Hobby plan)

If you hit limits, you'll see different errors (not FUNCTION_INVOCATION_FAILED).

### 6. Testing Locally

Before deploying, test the build locally:

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm prisma generate

# Build the project
pnpm run build

# Test the built output
node dist/src/main.js
```

If this fails locally, it will fail on Vercel too.

### 7. Debugging Steps

1. **Check the exact error message** in Vercel function logs
2. **Verify environment variables** are set correctly
3. **Check build logs** for compilation errors
4. **Test locally** with the same Node.js version (20.x)
5. **Check Prisma client** is generated (`node_modules/.prisma/client` exists)

### 8. Getting More Information

The updated `api/index.ts` now logs:
- Environment variable status
- Bootstrap progress
- Detailed error messages

Check Vercel function logs to see these messages and identify where it's failing.

### 9. If Still Failing

If the error persists after checking all above:

1. **Share the exact error message** from Vercel function logs
2. **Share the build logs** (especially any errors)
3. **Verify the deployment** shows "Ready" status
4. **Check function invocations** in Vercel dashboard to see if it's being called

### 10. Alternative: Test with Minimal Endpoint

Create a simple test endpoint to verify Vercel is working:

```typescript
// api/test.ts
export default async (req: any, res: any) => {
  res.json({ 
    message: 'Vercel is working!',
    env: {
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'MISSING',
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'MISSING',
    }
  });
};
```

If this works, the issue is with NestJS integration, not Vercel itself.

