# Storage System

**Path:** `apps/api/src/common/storage/`

## Architecture

The storage system supports two modes, switched automatically based on environment variables:

```
┌───────────────────────────────────┐
│          StorageService           │
│                                   │
│  OCI_S3_ENDPOINT set?             │
│  ┌─────┐          ┌──────┐       │
│  │ Yes │──> S3    │  No  │──> FS │
│  └─────┘  Client  └──────┘ local │
└───────────────────────────────────┘
```

- **Cloud mode:** When `OCI_S3_ENDPOINT` + `OCI_S3_ACCESS_KEY` + `OCI_S3_SECRET_KEY` are set
- **Local fallback:** When cloud vars are absent — files stored in `uploads/` directory

## StorageService

**File:** `common/storage/storage.service.ts`

### Configuration

On construction, checks for OCI environment variables and initializes an S3Client if available:

```typescript
// Cloud mode
this.s3 = new S3Client({
  endpoint: OCI_S3_ENDPOINT,
  region: OCI_S3_REGION || 'eu-frankfurt-1',
  credentials: { accessKeyId, secretAccessKey },
  forcePathStyle: true,
});
```

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `isCloudEnabled()` | `boolean` | Whether S3 client is configured |
| `buildKey(sessionId, imageType, ext)` | `string` | Build S3 key: `scans/{sessionId}/{imageType}-{timestamp}.{ext}` |
| `generateUploadUrl(key, contentType)` | `Promise<string>` | Presigned PUT URL, 15-minute expiry |
| `generateDownloadUrl(key)` | `Promise<string>` | Presigned GET URL, 1-hour expiry |
| `putObject(key, body, contentType)` | `Promise<void>` | Upload buffer to S3 |
| `deleteObject(key)` | `Promise<void>` | Delete from S3 |
| `getObject(key)` | `Promise<Buffer>` | Download object as Buffer |

All methods throw `Error('Cloud storage is not configured')` when called without cloud credentials.

### Key Format

```
scans/{sessionId}/{imageType}-{timestamp}.{extension}
```

Example: `scans/clx1abc123/FRONT-1706745600000.jpg`

Thumbnails: `scans/clx1abc123/FRONT-1706745600000-thumb.webp`

### StorageModule

```typescript
@Global()
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
```

Registered globally — available in all modules without imports.

---

## Upload Flow

### Cloud Upload (Presigned URL)

```
Browser                     API                          S3/OCI
  │                          │                              │
  │  POST /upload/upload-url │                              │
  │  { sessionId, imageType }│                              │
  │─────────────────────────>│                              │
  │                          │  buildKey()                  │
  │                          │  generateUploadUrl()         │
  │  { url, key }            │                              │
  │<─────────────────────────│                              │
  │                          │                              │
  │  PUT url (binary file)   │                              │
  │─────────────────────────────────────────────────────────>
  │  200 OK                  │                              │
  │<─────────────────────────────────────────────────────────
  │                          │                              │
  │  POST /upload/confirm    │                              │
  │  { sessionId, imageType, │                              │
  │    key }                 │                              │
  │─────────────────────────>│                              │
  │                          │  Create ScanImage record     │
  │                          │  Increment imageCount        │
  │                          │  Generate thumbnail          │
  │  ScanImage               │                              │
  │<─────────────────────────│                              │
```

### Local Upload (Multipart Fallback)

When cloud storage is not configured:

```
Browser                     API
  │                          │
  │  POST /upload            │
  │  (multipart/form-data)   │
  │  file + sessionId +      │
  │  imageType               │
  │─────────────────────────>│
  │                          │  Save to uploads/{key}
  │                          │  Create ScanImage (localPath)
  │                          │  Generate thumbnail locally
  │  ScanImage               │
  │<─────────────────────────│
```

### Download Flow

```
Browser                     API                          S3/OCI
  │                          │                              │
  │  GET /images/:id/url     │                              │
  │─────────────────────────>│                              │
  │                          │  Find ScanImage              │
  │                          │  generateDownloadUrl(s3Key)  │
  │  { url }                 │                              │
  │<─────────────────────────│                              │
  │                          │                              │
  │  GET url (presigned)     │                              │
  │─────────────────────────────────────────────────────────>
  │  Image binary            │                              │
  │<─────────────────────────────────────────────────────────
```

For local storage, the API serves the file directly from `uploads/`.

---

## Thumbnail Service

**File:** `apps/api/src/scans/thumbnail.service.ts`

### Purpose
Generates 300x300 WebP thumbnails for scan images, stored alongside the original.

### Methods

| Method | Description |
|--------|-------------|
| `generateThumbnail(buffer)` | Resize to 300x300 max, WebP quality 75, returns Buffer |
| `buildThumbnailKey(originalKey)` | Converts `.jpg` → `-thumb.webp` |
| `generateAndStoreCloud(originalKey)` | Download original from S3, generate thumbnail, upload to S3 |
| `generateAndStoreFromBuffer(buffer, s3Key, localPath)` | Generate from buffer, store to cloud or local |

### Thumbnail Key Convention

| Original Key | Thumbnail Key |
|-------------|---------------|
| `scans/abc/FRONT-123.jpg` | `scans/abc/FRONT-123-thumb.webp` |
| `scans/abc/LEFT-456.png` | `scans/abc/LEFT-456-thumb.webp` |

### Error Handling
Thumbnail generation is **non-fatal**. If Sharp fails or storage fails, the error is logged but the upload still succeeds. The `thumbnailKey` field will be `null`.

### Local Filesystem

When cloud is disabled, thumbnails are saved alongside the original file:
- Original: `uploads/scans/{sessionId}/FRONT-123.jpg`
- Thumbnail: `uploads/scans/{sessionId}/FRONT-123-thumb.webp`

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OCI_S3_ENDPOINT` | For cloud | — | S3-compatible endpoint |
| `OCI_S3_REGION` | No | `eu-frankfurt-1` | Storage region |
| `OCI_S3_BUCKET` | No | `orthomonitor-scans` | Bucket name |
| `OCI_S3_ACCESS_KEY` | For cloud | — | Access key |
| `OCI_S3_SECRET_KEY` | For cloud | — | Secret key |
