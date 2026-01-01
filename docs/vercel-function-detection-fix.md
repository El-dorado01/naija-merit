# Vercel Function Detection Error - Fix

## The Issue

```
Invalid export found in module "/var/task/src/main.js".
The default export must be a function or server.
```

Vercel is auto-detecting `src/main.js` as a serverless function, but it's not a function handler - it's just the NestJS bootstrap code.

## Root Cause

Vercel automatically detects serverless functions in:

- The `api/` directory (by default)
- Sometimes other directories depending on configuration

The problem is that Vercel is seeing `src/main.js` (either source or compiled) and trying to use it as a serverless function, but it doesn't have a default export that's a function handler.

## The Fix

Updated `vercel.json` to explicitly:

1. Only treat `api/index.ts` as a serverless function
2. Ignore `src/` and `dist/src/` directories

**Updated vercel.json:**

```json
{
  "version": 2,
  "buildCommand": "pnpm run vercel-build",
  "functions": {
    "api/index.ts": {
      "runtime": "nodejs20.x"
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.ts"
    },
    {
      "source": "/(.*)",
      "destination": "/api/index.ts"
    }
  ],
  "ignore": ["src/**", "dist/src/**"]
}
```

## Why This Works

1. **Explicit function definition**: The `functions` config tells Vercel exactly which file is a serverless function
2. **Ignore patterns**: The `ignore` array tells Vercel to not treat files in `src/` or `dist/src/` as functions
3. **Single entry point**: Only `api/index.ts` is treated as a serverless function

## Testing

After deploying:

1. ✅ Vercel should only detect `api/index.ts` as a function
2. ✅ `src/main.js` should be ignored
3. ✅ The function should bootstrap successfully

## Alternative Solutions (If Needed)

If the issue persists, you could:

### Option 1: Move api/ to root level

Some projects put the serverless function handler at the root, but this is less common.

### Option 2: Use .vercelignore

While `.vercelignore` doesn't prevent function detection, it can help exclude files from deployment.

### Option 3: Check build output

Ensure the build isn't creating files in locations that confuse Vercel's auto-detection.

The explicit `functions` configuration should resolve this issue.
