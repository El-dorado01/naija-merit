# Vercel Read-Only Filesystem Error - Fix

## The Real Issue

The error you were seeing:
```
Error: EROFS: read-only file system, mkdir '/var/task/uploads'
```

This was **NOT** about async handling or module resolution. The actual problem was that your code was trying to create directories on the filesystem, which is **read-only in serverless environments** like Vercel.

## Root Cause

Your file upload controllers (`student.controller.ts` and `profile.controller.ts`) were using `diskStorage` from multer, which tries to:
1. Create directories (`./uploads/avatars`)
2. Save files to disk

In serverless environments:
- The filesystem is **read-only**
- You **cannot** create directories
- You **cannot** write files to disk
- Each function invocation is **stateless** and **ephemeral**

## The Fix

### 1. Updated Controllers to Use Memory Storage in Serverless

**Before:**
```typescript
const uploadOptions = {
  storage: diskStorage({
    destination: './uploads/avatars',
    filename: (req, file, cb) => { ... }
  }),
};
```

**After:**
```typescript
const uploadOptions = {
  storage: process.env.VERCEL
    ? memoryStorage() // Serverless: files in memory
    : diskStorage({
        // Local development: save to disk
        destination: './uploads/avatars',
        filename: (req, file, cb) => { ... }
      }),
};
```

### 2. Updated Services to Handle Both Storage Types

**Before:**
```typescript
data: { avatar: file.path.replace(/\\/g, '/') }
```

**After:**
```typescript
let avatarPath: string;

if (file.path) {
  // Disk storage (local development)
  avatarPath = file.path.replace(/\\/g, '/');
} else if (file.buffer) {
  // Memory storage (serverless/Vercel)
  const base64 = file.buffer.toString('base64');
  const mimeType = file.mimetype || 'image/jpeg';
  avatarPath = `data:${mimeType};base64,${base64}`;
}
```

### 3. Disabled Static File Serving in Serverless

Updated `app.module.ts` to conditionally load `ServeStaticModule` only in non-serverless environments.

## Current Solution (Temporary)

For now, avatars are stored as **base64 data URLs** in the database when using memory storage. This works but has limitations:
- ✅ Prevents the filesystem error
- ✅ Works in serverless
- ❌ Increases database size
- ❌ Not ideal for large files
- ❌ Not scalable

## Recommended Production Solution

For production, you should upload files to **cloud storage**:

### Option 1: AWS S3
```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({ region: 'us-east-1' });

async function uploadToS3(buffer: Buffer, filename: string) {
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: filename,
    Body: buffer,
    ContentType: 'image/jpeg',
  });
  await s3.send(command);
  return `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${filename}`;
}
```

### Option 2: Cloudinary
```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadToCloudinary(buffer: Buffer) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'avatars' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
}
```

### Option 3: Vercel Blob Storage
```typescript
import { put } from '@vercel/blob';

async function uploadToVercelBlob(buffer: Buffer, filename: string) {
  const blob = await put(filename, buffer, {
    access: 'public',
    contentType: 'image/jpeg',
  });
  return blob.url;
}
```

## Files Changed

1. ✅ `src/student/student.controller.ts` - Switched to memory storage in serverless
2. ✅ `src/profile/profile.controller.ts` - Switched to memory storage in serverless
3. ✅ `src/student/student.service.ts` - Handle both disk and memory storage
4. ✅ `src/profile/profile.service.ts` - Handle both disk and memory storage
5. ✅ `src/app.module.ts` - Disable static file serving in serverless

## Testing

After deploying:
1. ✅ The EROFS error should be gone
2. ✅ File uploads should work (stored as base64 for now)
3. ✅ Local development still uses disk storage
4. ✅ Serverless uses memory storage

## Next Steps

1. **Deploy the fix** - This should resolve the immediate error
2. **Test file uploads** - Verify they work in Vercel
3. **Implement cloud storage** - For production, add S3/Cloudinary/Vercel Blob
4. **Update services** - Modify upload services to use cloud storage URLs

## Key Takeaway

**Serverless environments have read-only filesystems.** You cannot:
- Create directories
- Write files to disk
- Use traditional file storage

You must:
- Use memory storage for file uploads
- Upload to cloud storage (S3, Cloudinary, etc.)
- Store URLs in your database, not file paths

