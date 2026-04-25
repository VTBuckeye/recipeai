# Session Timeout Implementation

## Overview
Implemented automatic session timeout with inactivity warning to enhance security.

## Configuration

### Backend (SuperTokens)

**File**: `server/src/config/supertokens.ts`

```typescript
Session.init({
  sessionExpiredStatusCode: 401,
  cookieSameSite: 'lax',
  cookieSecure: config.NODE_ENV === 'production',
  antiCsrf: 'VIA_TOKEN',
  // Access token lifetime: 30 minutes
  accessTokenValidity: 30 * 60, // seconds
  // Refresh token lifetime: 7 days
  refreshTokenValidity: 7 * 24 * 60 * 60, // seconds
})
```

**Key Settings:**
- **Access Token Validity**: 30 minutes - Token expires if no activity
- **Refresh Token Validity**: 7 days - Allows returning users to stay logged in
- **Session Expired Status**: 401 - Triggers client-side logout

### Frontend (React Component)

**File**: `client/src/components/SessionTimeoutWarning.tsx`

**Features:**
1. **Activity Tracking**: Monitors user activity (mouse, keyboard, scroll, touch)
2. **Inactivity Detection**: Checks every second for 25+ minutes of inactivity
3. **Warning Dialog**: Shows countdown popup at 25 minutes
4. **Auto Sign-out**: Signs out user after 30 minutes total inactivity

## How It Works

### Timeline:

```
0 min                  25 min                      30 min
|----------------------|---------------------------|
User Active            Warning Popup Shows        Auto Sign-Out
                       (5 min countdown)
```

### Activity Events Monitored:
- `mousedown` - Mouse clicks
- `keydown` - Keyboard input
- `scroll` - Page scrolling
- `touchstart` - Touch/mobile interactions
- `mousemove` - Mouse movement

### Warning Dialog Behavior:

**At 25 minutes of inactivity:**
1. Dialog appears with countdown timer
2. Shows time remaining (5:00 → 0:00)
3. Progress bar visualizes time remaining
4. User has two options:
   - **"Stay Signed In"** - Resets inactivity timer
   - **"Sign Out Now"** - Immediately signs out

**At 30 minutes of inactivity:**
- Automatic sign-out
- Redirect to `/auth` login page
- Session cleared from SuperTokens

### User Activity Resets Timer:
Any user activity while **NOT** in warning state resets the inactivity timer:
- Moving the mouse
- Clicking anywhere
- Typing
- Scrolling
- Touch interactions

**During Warning State:**
Activity is **ignored** - user must explicitly click "Stay Signed In"

## User Experience

### Normal Usage:
1. User logs in
2. Uses application normally
3. Activity keeps session alive indefinitely
4. Session persists across page refreshes
5. Can close tab and return (within 7 days)

### Inactive User:
1. User logs in
2. Leaves computer/browser idle for 25 minutes
3. Warning popup appears with 5-minute countdown
4. User clicks "Stay Signed In" → Timer resets, session continues
5. OR user does nothing → Auto sign-out at 30 minutes

### Returning User:
1. User logged in yesterday
2. Returns within 7 days
3. Session still valid (refresh token)
4. Inactivity timer starts fresh

## Security Features

✅ **Automatic Sign-out**: Prevents unauthorized access to abandoned sessions
✅ **Activity Monitoring**: Only genuine user activity resets timer
✅ **Warning Period**: Gives active users chance to continue
✅ **CSRF Protection**: Anti-CSRF tokens prevent cross-site attacks
✅ **Secure Cookies**: HttpOnly, SameSite protection
✅ **Session Expiry**: Clear expiration enforced server-side

## Configuration Options

### To Change Timeout Duration:

**Backend** (`server/src/config/supertokens.ts`):
```typescript
accessTokenValidity: 30 * 60, // Change 30 to desired minutes
```

**Frontend** (`client/src/components/SessionTimeoutWarning.tsx`):
```typescript
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // Change 30 to match backend
const WARNING_TIME = 25 * 60 * 1000; // Warning time (suggest 5 min before timeout)
```

### Recommended Settings:

| Use Case | Timeout | Warning |
|----------|---------|---------|
| **High Security** | 15 min | 12 min |
| **Standard** (Current) | 30 min | 25 min |
| **Low Security** | 60 min | 55 min |

## Testing

### Test Inactivity Warning:

**Quick Test (Change timeouts temporarily):**

```typescript
// In SessionTimeoutWarning.tsx (FOR TESTING ONLY)
const INACTIVITY_TIMEOUT = 2 * 60 * 1000; // 2 minutes
const WARNING_TIME = 1 * 60 * 1000; // 1 minute
```

**Steps:**
1. Log in to application
2. Don't touch mouse/keyboard for 1 minute
3. Warning dialog should appear
4. Wait 1 more minute OR click "Sign Out Now"
5. Should redirect to login page

**Reset to normal:**
```typescript
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_TIME = 25 * 60 * 1000; // 25 minutes
```

### Test Activity Reset:

1. Log in
2. Wait 26 minutes (warning should appear)
3. Click "Stay Signed In"
4. Warning should close
5. Timer resets - can stay logged in another 30 minutes

### Test Auto Sign-Out:

1. Log in
2. Don't interact for 25 minutes
3. Warning appears
4. Don't click anything
5. After 5-minute countdown, auto sign-out occurs
6. Should redirect to `/auth`

## Implementation Details

### Component Structure:

```tsx
<SessionTimeoutWarning>
  - Monitors user activity
  - Tracks last activity timestamp
  - Checks inactivity every second
  - Shows dialog at 25 minutes
  - Countdown timer in dialog
  - Handles sign-out at 30 minutes
</SessionTimeoutWarning>
```

### State Management:

- `showWarning`: Boolean - Dialog visibility
- `countdown`: Number - Seconds remaining (300 → 0)
- `lastActivity`: Timestamp - Last user interaction

### Event Listeners:

Added to `window` with `passive: true` for performance:
- Activity events tracked globally
- Automatically cleaned up on unmount
- Don't interfere with normal app functionality

## Browser Behavior

### Multiple Tabs:
Each tab tracks inactivity **independently**:
- User active in Tab A → Tab A timer resets
- User ignores Tab B → Tab B shows warning/signs out
- Sessions are shared (SuperTokens), but timers are per-tab

### Page Refresh:
- Session persists (SuperTokens handles this)
- Inactivity timer **resets** (page reload is activity)
- User stays logged in

### Browser Close/Reopen:
- Session persists for 7 days (refresh token)
- Inactivity timer starts fresh on reopen
- User doesn't need to log in again

## Production Considerations

### Performance:
- Uses `passive` event listeners (no performance impact)
- Interval check every second (negligible CPU usage)
- Dialog only renders when needed

### Accessibility:
- Dialog is keyboard accessible
- Auto-focus on "Stay Signed In" button
- Clear visual countdown and progress bar
- Screen reader friendly

### Mobile:
- Touch events tracked
- Responsive dialog design
- Works on all screen sizes

## Troubleshooting

### Warning Doesn't Appear:
1. Check browser console for errors
2. Verify `SessionTimeoutWarning` is in `App.tsx`
3. Ensure user is authenticated
4. Check timeout configuration values

### Session Expires Too Quickly:
1. Verify `accessTokenValidity` in backend config
2. Check if server was restarted (config applied)
3. Look for errors in server logs

### Activity Not Resetting Timer:
1. Verify activity event listeners are attached
2. Check if warning dialog is currently showing (activity ignored during warning)
3. Open browser console and check for JavaScript errors

## Files Modified/Created

### Created:
1. `client/src/components/SessionTimeoutWarning.tsx` - Main component

### Modified:
1. `server/src/config/supertokens.ts` - Session configuration
2. `client/src/App.tsx` - Added SessionTimeoutWarning component

## Summary

✅ Sessions expire after 30 minutes of inactivity
✅ Warning appears at 25 minutes with 5-minute countdown
✅ User activity resets the timer
✅ Manual "Stay Signed In" option
✅ Automatic sign-out at 30 minutes
✅ Enhanced security for unattended sessions

The implementation balances security with user experience, giving active users unlimited session time while protecting abandoned sessions.
