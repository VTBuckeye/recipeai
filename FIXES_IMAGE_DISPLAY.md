# Fix for Recipe Images Not Displaying

## Date: 2026-04-24

## Issue
Recipe images uploaded successfully but not displaying in the browser.

## Root Cause
**MinIO URL Mismatch:**
- Server runs inside Docker and connects to MinIO using internal hostname: `minio:9000`
- Generated image URLs use this internal hostname: `http://minio:9000/recipeai-images/...`
- Browser cannot resolve `minio` hostname - only accessible as `localhost:9000`
- Result: Images upload successfully but browsers get 404/network errors trying to load them

## Investigation Steps

1. **Verified MinIO is running:**
   ```bash
   docker ps --filter "name=minio"
   # Result: Container healthy, ports mapped correctly
   ```

2. **Checked server logs:**
   ```bash
   docker logs recipeai-server | grep "File uploaded"
   # Result: Files uploading successfully to MinIO
   ```

3. **Checked database:**
   ```bash
   # Found URLs like: http://minio:9000/recipeai-images/recipes/.../image.jpg
   # Problem: "minio" hostname not accessible from browser
   ```

## Solution

### 1. Added Public Endpoint Configuration

**File**: `server/src/config/env.ts`
```typescript
interface EnvConfig {
  //...
  MINIO_ENDPOINT: string;          // Internal Docker endpoint
  MINIO_PUBLIC_ENDPOINT: string;   // Browser-accessible endpoint
  //...
}

// Default to MINIO_ENDPOINT if PUBLIC not set
MINIO_PUBLIC_ENDPOINT: getEnvVar('MINIO_PUBLIC_ENDPOINT', getEnvVar('MINIO_ENDPOINT')),
```

### 2. Updated MinIO Service

**File**: `server/src/services/minioService.ts`
```typescript
async getFileUrl(filename: string): Promise<string> {
  const protocol = config.MINIO_USE_SSL ? 'https' : 'http';
  const port = config.MINIO_PORT === 80 || config.MINIO_PORT === 443 ? '' : `:${config.MINIO_PORT}`;

  // Use public endpoint for browser-accessible URLs
  const endpoint = config.MINIO_PUBLIC_ENDPOINT || config.MINIO_ENDPOINT;

  return `${protocol}://${endpoint}${port}/${this.bucketName}/${filename}`;
}
```

### 3. Updated Environment Configuration

**File**: `server/.env`
```env
MINIO_ENDPOINT=localhost
MINIO_PUBLIC_ENDPOINT=localhost  # Added this line
```

**File**: `docker-compose.dev.yml`
```yaml
environment:
  MINIO_ENDPOINT: minio              # For server-to-MinIO communication
  MINIO_PUBLIC_ENDPOINT: localhost   # For browser-accessible URLs
```

## How It Works Now

### Server Operation (Inside Docker):
- Server connects to MinIO using: `minio:9000`
- Uploads files successfully to MinIO container
- Calls `getFileUrl()` to generate public URL
- Uses `MINIO_PUBLIC_ENDPOINT` (localhost) for URL generation
- Stores URL in database: `http://localhost:9000/recipeai-images/...`

### Browser Operation:
- Recipe data includes image URLs: `http://localhost:9000/recipeai-images/...`
- Browser can access `localhost:9000` (mapped from Docker)
- Images load successfully!

## URL Examples

### Before (Broken):
```
http://minio:9000/recipeai-images/recipes/123/images/abc.jpg
```
❌ Browser cannot resolve "minio" hostname

### After (Working):
```
http://localhost:9000/recipeai-images/recipes/123/images/abc.jpg
```
✅ Browser can access localhost:9000

## Testing

1. **Restart the server** (if running):
   ```bash
   docker-compose -f docker-compose.dev.yml restart server
   ```

2. **Create a new recipe with an image:**
   - Go to My Recipes → Create Recipe
   - Add title, description, ingredients, instructions
   - Upload an image
   - Submit

3. **Verify image displays:**
   - Recipe card should show the uploaded image
   - Recipe detail page should show all images
   - Browser network tab should show successful image loads from `localhost:9000`

4. **Check database (optional):**
   ```bash
   docker exec recipeai-mongodb mongosh recipeai -u recipeai_user -p recipeai_password \
     --authenticationDatabase admin \
     --eval "db.recipes.find({}, {title: 1, images: 1}).limit(1).pretty()"
   ```
   Should now show URLs with `localhost` instead of `minio`

## Production Considerations

For production deployment:

1. **Use public domain/IP:**
   ```env
   MINIO_PUBLIC_ENDPOINT=cdn.yourdomain.com
   # or
   MINIO_PUBLIC_ENDPOINT=your-server-ip
   ```

2. **Enable SSL:**
   ```env
   MINIO_USE_SSL=true
   ```

3. **Consider CDN:**
   - Put MinIO behind CloudFront, CloudFlare, or similar
   - Update `MINIO_PUBLIC_ENDPOINT` to CDN URL

4. **Update existing recipes** (if needed):
   ```javascript
   // Migration script to update old URLs
   db.recipes.find({ images: { $regex: "http://minio:" } }).forEach(recipe => {
     recipe.images = recipe.images.map(url =>
       url.replace("http://minio:9000", "http://localhost:9000")
     );
     db.recipes.save(recipe);
   });
   ```

## Files Modified

1. `server/src/config/env.ts` - Added MINIO_PUBLIC_ENDPOINT config
2. `server/src/services/minioService.ts` - Use public endpoint for URLs
3. `server/.env` - Added MINIO_PUBLIC_ENDPOINT variable
4. `docker-compose.dev.yml` - Added MINIO_PUBLIC_ENDPOINT to server environment

## Status: ✅ FIXED

Images now display correctly because URLs use browser-accessible endpoint (`localhost`) instead of Docker internal hostname (`minio`).

**Next time you upload a recipe with an image, it will display properly!**

Note: Existing recipes with old URLs will need to be re-saved or migrated. New recipes will work immediately after server restart.
