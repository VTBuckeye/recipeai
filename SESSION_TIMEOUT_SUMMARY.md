# Session Timeout - Implementation Summary ✅

## What Was Implemented

### 1. Session Expiration (30 Minutes)
- **Access tokens expire after 30 minutes** of inactivity
- **Refresh tokens last 7 days** (allows returning users to stay logged in)
- Configured in SuperTokens Core via environment variables

### 2. Inactivity Warning (25 Minutes)
- **Warning popup appears at 25 minutes** of inactivity
- **5-minute countdown timer** displayed to user
- **Visual progress bar** shows time remaining
- Two options: "Stay Signed In" or "Sign Out Now"

### 3. Automatic Sign-Out (30 Minutes)
- **Auto sign-out after 30 minutes** if user doesn't respond to warning
- **Redirect to login page** (`/auth`)
- **Session cleared** from SuperTokens

## Files Modified/Created

### Backend
1. **`server/src/config/supertokens.ts`**
   - Configured session security settings
   - Set CSRF protection

2. **`server/.env`**
   - Added `ACCESS_TOKEN_VALIDITY=1800000` (30 min in ms)
   - Added `REFRESH_TOKEN_VALIDITY=604800000` (7 days in ms)

3. **`docker-compose.dev.yml`**
   - Added session timeout env vars to SuperTokens container

### Frontend
1. **`client/src/components/SessionTimeoutWarning.tsx`** (NEW)
   - Activity tracking component
   - Inactivity detection
   - Warning dialog with countdown
   - Auto sign-out handler

2. **`client/src/App.tsx`**
   - Added `<SessionTimeoutWarning />` component

### Documentation
1. **`SESSION_TIMEOUT_IMPLEMENTATION.md`** - Full technical docs
2. **`SESSION_TIMEOUT_SUMMARY.md`** - This summary

## How It Works

### Timeline
```
┌─────────────────────────┬─────────────┬──────┐
│   User Active           │   Warning   │ Out  │
│   (0-25 min)           │   (25-30)   │ (30) │
└─────────────────────────┴─────────────┴──────┘
                          ↑             ↑
                    Popup appears   Auto sign-out
```

### Activity Tracking
Monitors these events to detect user activity:
- Mouse clicks (`mousedown`)
- Keyboard input (`keydown`)
- Scrolling (`scroll`)
- Touch interactions (`touchstart`)
- Mouse movement (`mousemove`)

Any activity **resets the timer** (except during warning period).

### Warning Dialog
**Shows at 25 minutes:**
- Large countdown timer (5:00 → 0:00)
- Progress bar visualization
- "Stay Signed In" button (resets timer)
- "Sign Out Now" button (immediate logout)

**At 30 minutes total:**
- Automatic sign-out
- Redirect to `/auth`

## User Experience

### Scenario 1: Active User
1. User logs in and uses app normally
2. Activity keeps resetting timer
3. **User stays logged in indefinitely**
4. Session persists even across page refreshes

### Scenario 2: Idle User (Responds to Warning)
1. User logs in, then walks away
2. After 25 minutes, warning popup appears
3. User returns, clicks "Stay Signed In"
4. Timer resets, user continues working
5. **No interruption to workflow**

### Scenario 3: Abandoned Session
1. User logs in, then forgets about open browser
2. After 25 minutes, warning appears
3. No response for 5 minutes
4. **Automatic sign-out at 30 minutes**
5. Session secured, user must log in again

### Scenario 4: Returning User
1. User logged in yesterday, closed browser
2. Returns today (within 7 days)
3. **Still logged in** (refresh token valid)
4. Inactivity timer starts fresh

## Security Benefits

✅ **Protects abandoned sessions** - Unattended computers auto log out
✅ **Configurable timeouts** - Easily adjust for security requirements
✅ **User-friendly** - Warning gives active users time to respond
✅ **Activity tracking** - Only genuine interaction resets timer
✅ **CSRF protection** - Anti-CSRF tokens prevent attacks
✅ **Secure cookies** - HttpOnly, SameSite configuration

## Testing Instructions

### Quick Test (For Development)

To test without waiting 30 minutes, temporarily change these values:

**In `client/src/components/SessionTimeoutWarning.tsx`:**
```typescript
// TEMPORARY FOR TESTING
const INACTIVITY_TIMEOUT = 2 * 60 * 1000; // 2 minutes
const WARNING_TIME = 1 * 60 * 1000; // 1 minute
```

**Test Steps:**
1. Log in to application
2. Don't touch anything for 1 minute
3. Warning dialog should appear
4. Wait 1 more minute or click "Sign Out Now"
5. Should redirect to login

**Remember to change back to production values:**
```typescript
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_TIME = 25 * 60 * 1000; // 25 minutes
```

### Full Test (Production Settings)

1. **Test Activity Reset:**
   - Log in
   - Use app normally
   - Verify no warning appears
   - ✅ Active users stay logged in

2. **Test Warning:**
   - Log in
   - Wait 25 minutes (or set lower for testing)
   - Verify warning appears with countdown
   - Click "Stay Signed In"
   - Verify warning closes and timer resets
   - ✅ Warning works correctly

3. **Test Auto Sign-Out:**
   - Log in
   - Wait for warning (25 min)
   - Don't click anything
   - Wait for countdown to reach 0:00
   - Verify redirect to `/auth`
   - ✅ Auto sign-out works

## Configuration

### Change Timeout Duration

**Backend** (`docker-compose.dev.yml`):
```yaml
ACCESS_TOKEN_VALIDITY: 1800000  # 30 min = 30 * 60 * 1000 ms
```

**Frontend** (`client/src/components/SessionTimeoutWarning.tsx`):
```typescript
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // Must match backend
const WARNING_TIME = 25 * 60 * 1000; // Show warning 5 min before
```

### Recommended Settings

| Environment | Timeout | Warning Time |
|-------------|---------|--------------|
| **High Security** | 15 min | 12 min |
| **Standard** (Current) | 30 min | 25 min |
| **Low Security** | 60 min | 55 min |

**Important:** Always keep warning time 5 minutes before timeout for good UX.

## Production Deployment

For production, ensure:

1. **SSL enabled:**
   ```typescript
   cookieSecure: config.NODE_ENV === 'production', // Already configured
   ```

2. **Appropriate timeout:**
   - Financial apps: 15 minutes
   - Standard apps: 30 minutes
   - Low-security apps: 60 minutes

3. **Monitor session metrics:**
   - Track how often warnings appear
   - Track how often users click "Stay Signed In"
   - Adjust timeouts based on actual usage

## Troubleshooting

### Warning Never Appears
- Verify `<SessionTimeoutWarning />` is in App.tsx
- Check browser console for errors
- Ensure user is logged in
- Verify timeout values are set correctly

### Signed Out Too Quickly
- Check ACCESS_TOKEN_VALIDITY in docker-compose.dev.yml
- Verify SuperTokens container was restarted
- Check SuperTokens logs: `docker logs recipeai-supertokens`

### Activity Doesn't Reset Timer
- Verify event listeners are attached (check console)
- Activity is ignored during warning period (by design)
- Check for JavaScript errors

## Summary

✅ **Sessions expire after 30 minutes of inactivity**
✅ **Warning at 25 minutes with 5-minute countdown**
✅ **Any user activity resets the timer**
✅ **Automatic sign-out at 30 minutes**
✅ **User can manually stay logged in via button**
✅ **Enhanced security for abandoned sessions**
✅ **User-friendly implementation**

The system balances security with usability - active users never interrupted, but abandoned sessions automatically secured.
