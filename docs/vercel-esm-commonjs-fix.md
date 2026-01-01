# Vercel ESM/CommonJS Module Error - Fix

## The Issue

After fixing the filesystem error, we encountered a new error:

```
Error [ERR_REQUIRE_ESM]: require() of ES Module /var/task/node_modules/uuid/dist-node/index.js from /var/task/src/institution/institution.service.js not supported.
```

## Root Cause

The `uuid` package version 13.x is **ES Module only** (ESM), but your TypeScript is compiled to **CommonJS** (as specified in `tsconfig.json` with `"module": "CommonJS"`).

When the compiled JavaScript tries to use `require()` to import the `uuid` module, it fails because:
- `uuid` v13+ is ESM-only
- CommonJS `require()` cannot import ESM modules
- The error suggests using dynamic `import()`, but that's more complex

## The Solution

Since you're using **Node.js 20.x**, we can use the **built-in `crypto.randomUUID()`** function instead of the `uuid` package. This is:
- ✅ Built into Node.js (no external dependency)
- ✅ Works with CommonJS
- ✅ Same functionality as `uuid.v4()`
- ✅ Available in Node 14.17.0+ (you're on 20.x)

## Changes Made

### 1. `src/institution/institution.service.ts`
**Before:**
```typescript
import { v4 as uuidv4 } from 'uuid';
// ...
const loginId = `admin_${uuidv4().split('-')[0]}@...`;
```

**After:**
```typescript
import { randomUUID } from 'crypto';
// ...
const loginId = `admin_${randomUUID().split('-')[0]}@...`;
```

### 2. `src/auth/auth.service.ts`
**Before:**
```typescript
import { v4 as uuidv4 } from 'uuid';
// ...
const token = uuidv4();
```

**After:**
```typescript
import { randomUUID } from 'crypto';
// ...
const token = randomUUID();
```

## Why This Works

1. **`crypto.randomUUID()`** is part of Node.js core, not an external package
2. It's **CommonJS compatible** - no ESM issues
3. It generates **RFC 4122 version 4 UUIDs** - same as `uuid.v4()`
4. It's **available in Node 20.x** (your runtime)

## Optional: Remove uuid Dependency

Since we're no longer using the `uuid` package, you can optionally remove it:

```bash
pnpm remove uuid @types/uuid
```

However, keeping it won't hurt if you might need it later.

## Testing

After deploying:
1. ✅ The ESM import error should be gone
2. ✅ UUID generation should work the same way
3. ✅ The function should bootstrap successfully

## Alternative Solutions (If Needed)

If you needed to keep using the `uuid` package, you could:

### Option 1: Use Dynamic Import
```typescript
const { v4: uuidv4 } = await import('uuid');
const token = uuidv4();
```

### Option 2: Downgrade to uuid v8.x
```bash
pnpm add uuid@^8.3.2
```
uuid v8.x supports both CommonJS and ESM.

### Option 3: Switch to ES Modules
Change `tsconfig.json` to use ES modules, but this requires more changes.

**The `crypto.randomUUID()` solution is the best** because it's built-in and works perfectly for your use case.

