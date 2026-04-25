import React, { useEffect, useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  LinearProgress,
  Box
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { useSessionContext } from 'supertokens-auth-react/recipe/session';
import { signOut } from 'supertokens-auth-react/recipe/passwordless';
import { useNavigate } from 'react-router-dom';

// Configuration
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const WARNING_TIME = 25 * 60 * 1000; // Show warning at 25 minutes
const COUNTDOWN_DURATION = 5 * 60 * 1000; // 5 minute countdown

export const SessionTimeoutWarning: React.FC = () => {
  const session = useSessionContext();
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(5 * 60); // 5 minutes in seconds
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Check if user is authenticated
  const isAuthenticated =
    session.loading === false &&
    'doesSessionExist' in session &&
    session.doesSessionExist;

  // Reset activity timer
  const resetActivity = useCallback(() => {
    setLastActivity(Date.now());
    setShowWarning(false);
  }, []);

  // Handle user activity
  useEffect(() => {
    if (!isAuthenticated) return;

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];

    const handleActivity = () => {
      if (!showWarning) {
        resetActivity();
      }
    };

    // Add event listeners for user activity
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isAuthenticated, showWarning, resetActivity]);

  // Check for inactivity and show warning
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkInactivity = setInterval(() => {
      const now = Date.now();
      const inactiveTime = now - lastActivity;

      // If inactive for 25 minutes, show warning
      if (inactiveTime >= WARNING_TIME && !showWarning) {
        setShowWarning(true);
        setCountdown(Math.floor(COUNTDOWN_DURATION / 1000)); // Start 5 min countdown
      }

      // If inactive for 30 minutes, sign out
      if (inactiveTime >= INACTIVITY_TIMEOUT) {
        handleSignOut();
      }
    }, 1000); // Check every second

    return () => clearInterval(checkInactivity);
  }, [isAuthenticated, lastActivity, showWarning]);

  // Countdown timer for warning dialog
  useEffect(() => {
    if (!showWarning) return;

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          handleSignOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [showWarning]);

  const handleSignOut = async () => {
    setShowWarning(false);
    await signOut();
    navigate('/auth');
  };

  const handleStaySignedIn = () => {
    resetActivity();
    setShowWarning(false);
  };

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Format countdown as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = (countdown / (COUNTDOWN_DURATION / 1000)) * 100;

  return (
    <Dialog
      open={showWarning}
      onClose={() => {}} // Prevent closing by clicking outside
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color="warning" />
        Session Timeout Warning
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" paragraph>
          You've been inactive for a while. For your security, you'll be automatically
          signed out in:
        </Typography>

        <Box sx={{ textAlign: 'center', my: 3 }}>
          <Typography variant="h2" color="error.main" fontWeight="bold">
            {formatTime(countdown)}
          </Typography>
        </Box>

        <LinearProgress
          variant="determinate"
          value={progressPercent}
          color="warning"
          sx={{ height: 8, borderRadius: 4 }}
        />

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Click "Stay Signed In" to continue your session, or you'll be automatically
          signed out when the timer reaches zero.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSignOut} variant="outlined">
          Sign Out Now
        </Button>
        <Button
          onClick={handleStaySignedIn}
          variant="contained"
          color="primary"
          autoFocus
        >
          Stay Signed In
        </Button>
      </DialogActions>
    </Dialog>
  );
};
