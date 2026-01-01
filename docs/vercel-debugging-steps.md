# Vercel FUNCTION_INVOCATION_FAILED - Debugging Steps

## What We've Fixed

1. ✅ **Async/Promise handling** - Wrapped Express handler in Promise
2. ✅ **App initialization** - Added `app.init()` call
3. ✅ **Module resolution** - Dynamic import that works in both dev and production
4. ✅ **Error handling** - Better error logging and diagnostics
5. ✅ **Database connection** - Optimized for serverless (lazy connection)
6. ✅ **Environment variable logging** - Logs which env vars are set/missing

## Next Steps to Debug

### Step 1: Check Vercel Function Logs

1. Go to **Vercel Dashboard** → Your Project
2. Click on **Functions** tab
3. Click on `api/index`
4. Click on **Logs** tab
5. Look for these messages:
   - "Bootstrapping NestJS for Vercel..."
   - "Environment check: ..." (shows which env vars are set)
   - Any error messages

**What to look for:**
- If you see "DATABASE_URL: MISSING" → Set it in Vercel environment variables
- If you see "JWT_SECRET: MISSING" → Set it in Vercel environment variables
- If you see a module import error → Build might have failed
- If you see a Prisma error → Database connection issue

### Step 2: Check Build Logs

1. Go to **Vercel Dashboard** → Your Project
2. Click on **Deployments** tab
3. Click on the latest deployment
4. Check the **Build Logs** tab

**What to look for:**
- ✅ "Build completed successfully"
- ❌ Any TypeScript compilation errors
- ❌ "Prisma Client not generated" errors
- ❌ Missing dependency errors

### Step 3: Verify Environment Variables

1. Go to **Vercel Dashboard** → Your Project → **Settings**
2. Click on **Environment Variables**
3. Verify these are set for **Production**, **Preview**, and **Development**:
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `JWT_SECRET` - Any random secret string (e.g., "your-secret-key-123")
   - `DIRECT_URL` - (Optional) If using connection pooling

**Important:** After adding/changing environment variables, you must **redeploy**!

### Step 4: Test the Build Locally

Before deploying, test that the build works locally:

```bash
# Make sure you're in the project directory
cd naija-merit

# Install dependencies
pnpm install

# Generate Prisma client
pnpm prisma generate

# Build the project
pnpm run build

# Check if dist folder was created
ls dist/src/main.js
```

If this fails locally, it will fail on Vercel too.

### Step 5: Check the Exact Error Message

The error message in Vercel logs will tell us exactly what's wrong:

**Common errors and solutions:**

1. **"Cannot find module '../dist/src/main'"**
   - **Cause:** Build didn't complete or output is in wrong location
   - **Fix:** Check build logs, ensure `vercel-build` script runs successfully

2. **"DATABASE_URL is not defined"**
   - **Cause:** Environment variable not set
   - **Fix:** Set `DATABASE_URL` in Vercel environment variables and redeploy

3. **"Prisma Client not generated"**
   - **Cause:** `prisma generate` didn't run during build
   - **Fix:** Ensure `vercel-build` script includes `prisma generate`

4. **"Connection timeout"**
   - **Cause:** Database connection taking too long
   - **Fix:** Already handled with lazy connection, but check database URL format

5. **"JWT_SECRET is not defined"**
   - **Cause:** Environment variable not set
   - **Fix:** Set `JWT_SECRET` in Vercel environment variables

### Step 6: About Multiple Projects on Free Tier

**Having multiple projects on Vercel free tier should NOT cause this error.**

Each project is completely isolated. However, free tier has these limits:
- 100GB bandwidth/month (total across all projects)
- 100 serverless function invocations/day per project
- 10 second function timeout

If you hit these limits, you'll see different errors (not FUNCTION_INVOCATION_FAILED).

### Step 7: Share the Error Details

If the error persists, please share:

1. **The exact error message** from Vercel function logs
2. **The "Environment check" output** from the logs (shows which env vars are set)
3. **Any build errors** from the build logs
4. **The first few lines of the error stack trace**

This will help identify the exact issue.

## Quick Test Endpoint

To verify Vercel is working at all, you can create a simple test:

Create `api/test.ts`:
```typescript
export default async (req: any, res: any) => {
  res.json({ 
    message: 'Vercel is working!',
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'MISSING',
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'MISSING',
    }
  });
};
```

Then visit: `https://your-project.vercel.app/api/test`

If this works, Vercel is fine and the issue is with NestJS integration.
If this fails, there's a more fundamental Vercel configuration issue.

## Most Likely Causes (In Order)

1. **Missing environment variables** (DATABASE_URL or JWT_SECRET)
2. **Build not completing** (TypeScript compilation or Prisma generation failing)
3. **Module resolution issue** (import path not resolving correctly)
4. **Database connection issue** (wrong DATABASE_URL format or database not accessible)

The updated code now handles #3 better and logs information about #1 and #4.

