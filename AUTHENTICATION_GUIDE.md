# RecipeAI Authentication Guide

## Overview
RecipeAI uses SuperTokens Passwordless OTP authentication with a fully custom Material-UI interface. Users can sign up and log in using only their email address, receiving a one-time password (OTP) code for verification.

## Authentication Flow

### 1. **Sign In / Sign Up Page** (`/auth`)
- User enters their email address
- System sends a 6-digit OTP code to their email
- Single unified flow - no distinction between sign up and login
- SuperTokens handles email delivery automatically

### 2. **OTP Verification Page** (`/auth/verify-otp`)
- User enters the 6-digit code received via email
- Code verification with attempt tracking
- Resend code functionality with 60-second cooldown
- Automatic user creation in MongoDB on first login

### 3. **Post-Authentication**
- New users: Redirected to Dashboard with Welcome modal
- Returning users: Redirected to Dashboard
- Session managed by SuperTokens

## Components Implemented

### Pages
1. **`/pages/Auth/Login.tsx`**
   - Email input form
   - OTP request handling
   - Error notifications via Snackbar
   - Loading states during API calls

2. **`/pages/Auth/VerifyOTP.tsx`**
   - OTP code input (6-digit numeric)
   - Code verification
   - Resend code with countdown timer
   - Attempt tracking and error messages
   - Back navigation to login

3. **`/pages/Dashboard.tsx`**
   - Main landing page after authentication
   - Quick action cards for navigation
   - Stats placeholders (to be implemented)
   - Welcome modal trigger for first-time users

### Components
1. **`/components/WelcomeModal.tsx`**
   - First-time user onboarding
   - Feature highlights
   - Dismissible modal dialog

2. **`/contexts/SnackbarContext.tsx`**
   - Global notification system
   - Material-UI Snackbar integration
   - Support for success, error, warning, info messages

## User Data Flow

### New User Registration
1. User enters email on `/auth`
2. OTP sent via SuperTokens
3. User verifies OTP on `/auth/verify-otp`
4. SuperTokens creates passwordless user
5. Backend API (via consumeCodePOST override) creates MongoDB user:
   ```javascript
   {
     email: "user@example.com",
     name: "user",  // Default from email prefix
     supertokensUserId: "uuid",
     profilePictureUrl: null,
     createdAt: Date,
     updatedAt: Date
   }
   ```
6. User redirected to Dashboard with `isFirstLogin: true`
7. Welcome modal automatically displays

### Returning User Login
1. User enters email on `/auth`
2. OTP sent via SuperTokens
3. User verifies OTP
4. Session restored
5. User redirected to Dashboard (no welcome modal)

## Backend Configuration

### SuperTokens Setup
Located in: `server/src/config/supertokens.ts`

Key features:
- Passwordless OTP via email
- 6-digit verification code
- User creation hook in `consumeCodePOST`
- Email prefix used as default name
- Automatic MongoDB user document creation

### User Model
Located in: `server/src/models/User.ts`

Schema:
```typescript
{
  email: String (unique, indexed)
  name: String
  supertokensUserId: String (unique, indexed)
  profilePictureUrl: String (optional)
  createdAt: Date
  updatedAt: Date
}
```

## Session Management

- **Session Provider**: SuperTokens Session Recipe
- **Session Storage**: HTTP-only cookies
- **Session Context**: Available via `useSessionContext()` hook
- **Protected Routes**: Wrapped with `<SessionAuth>` component
- **Sign Out**: Available via `signOut()` from `supertokens-auth-react/recipe/passwordless`

## Navigation Structure

### Public Routes
- `/` - Home page
- `/auth` - Login page
- `/auth/verify-otp` - OTP verification
- `/recipes/search` - Public recipe search
- `/recipes/:id` - Recipe detail view

### Protected Routes (Require Authentication)
- `/dashboard` - User dashboard
- `/profile` - User profile
- `/recipes/create` - Create new recipe
- `/recipes/my-recipes` - User's recipe list

## Error Handling

All authentication errors display via Snackbar notifications:

### Login Page Errors
- Invalid email format
- Failed to send OTP
- Authentication not allowed
- Network errors

### OTP Verification Errors
- Incorrect OTP code (with attempts remaining)
- Expired OTP code
- Session restart required
- Maximum attempts exceeded

## Email Configuration

**For Development:**
SuperTokens can be configured to:
- Log OTP codes to console
- Use a test SMTP server
- Integrate with email service providers (SendGrid, AWS SES, etc.)

**Current Setup:**
The application is configured to use SuperTokens' email service. To configure custom email:

1. Update SuperTokens Core configuration
2. Add SMTP settings to environment variables
3. Configure email templates in SuperTokens Dashboard

## Customization Options

### Styling
All authentication pages use Material-UI components matching the app theme:
- Primary color: `#FF6B35`
- Secondary color: `#004E89`
- Custom theme in `/theme/theme.ts`

### Behavior
- OTP code length: 6 digits (configurable in SuperTokens)
- Resend cooldown: 60 seconds
- Code expiration: Default SuperTokens setting
- Max attempts: Default SuperTokens setting

## Testing the Flow

### Manual Testing Steps

1. **New User Registration:**
   ```
   1. Navigate to http://localhost:3000/auth
   2. Enter a valid email address
   3. Click "Continue with Email"
   4. Check email for 6-digit code
   5. Enter code on verification page
   6. Verify redirect to Dashboard
   7. Confirm Welcome modal appears
   ```

2. **Returning User Login:**
   ```
   1. Navigate to http://localhost:3000/auth
   2. Enter registered email
   3. Verify OTP code
   4. Confirm redirect to Dashboard (no modal)
   ```

3. **Error Scenarios:**
   ```
   - Invalid email format
   - Wrong OTP code
   - Expired OTP code
   - Resend code functionality
   ```

## Security Considerations

✅ **Implemented:**
- HTTP-only cookies for session storage
- CSRF protection via SuperTokens
- Email-based verification
- Attempt limiting on OTP verification
- Secure session management

🔒 **Production Recommendations:**
- Configure rate limiting on auth endpoints
- Set up email service with proper SPF/DKIM
- Enable HTTPS in production
- Configure CORS properly
- Set strong session secrets
- Monitor for suspicious authentication patterns

## Troubleshooting

### Common Issues

**1. OTP Not Received:**
- Check email spam folder
- Verify SMTP configuration
- Check SuperTokens logs
- Use resend code feature

**2. Session Not Persisting:**
- Check cookie settings
- Verify CORS configuration
- Ensure SuperTokens Core is running

**3. Welcome Modal Not Showing:**
- Check browser console for errors
- Verify `isFirstLogin` state is passed
- Ensure Welcome modal component is imported

## Future Enhancements

Potential improvements:
- [ ] Social login integration
- [ ] Phone number authentication
- [ ] Remember device functionality
- [ ] Session history tracking
- [ ] Custom email templates
- [ ] Multi-factor authentication (MFA)
- [ ] Account recovery options
- [ ] Login activity logs

## API Endpoints

SuperTokens provides these authentication endpoints:

```
POST /auth/signinup/code
- Request OTP code
- Body: { email: string }

POST /auth/signinup/code/consume
- Verify OTP code
- Body: { userInputCode: string }

POST /auth/signout
- End user session
- No body required
```

## Developer Notes

- Authentication state available via `useSessionContext()` hook
- Check authentication: `session.loading === false && 'doesSessionExist' in session && session.doesSessionExist`
- Snackbar notifications: `useSnackbar()` hook
- All auth pages have loading states and error handling
- Backend automatically creates MongoDB user on first login
- Default user name is email prefix (editable in profile)

## Related Files

```
client/src/
├── pages/
│   ├── Auth/
│   │   ├── Login.tsx                  # Email input page
│   │   └── VerifyOTP.tsx              # OTP verification page
│   └── Dashboard.tsx                  # Post-login dashboard
├── components/
│   ├── WelcomeModal.tsx               # First-time user modal
│   └── layout/
│       └── Navbar.tsx                 # Updated with Dashboard link
├── contexts/
│   └── SnackbarContext.tsx            # Global notifications
└── config/
    └── supertokens.ts                 # SuperTokens configuration

server/src/
├── config/
│   └── supertokens.ts                 # Backend auth configuration
└── models/
    └── User.ts                        # MongoDB user schema
```

---

**Last Updated:** 2026-04-22
**Version:** 1.0.0
