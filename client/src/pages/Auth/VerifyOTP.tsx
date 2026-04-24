import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Link,
} from '@mui/material';
import { Restaurant as RestaurantIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { consumeCode, createCode } from 'supertokens-auth-react/recipe/passwordless';
import { useSnackbar } from '../../contexts/SnackbarContext';
import logger from '../../utils/logger';

const VerifyOTP: React.FC = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const navigate = useNavigate();
  const location = useLocation();
  const { showSnackbar } = useSnackbar();

  const email = location.state?.email;

  useEffect(() => {
    // Redirect if no email in state
    if (!email) {
      navigate('/auth');
    }
  }, [email, navigate]);

  useEffect(() => {
    // Countdown timer for resend button
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp || otp.length < 4) {
      showSnackbar('Please enter a valid verification code', 'error');
      return;
    }

    setLoading(true);
    logger.info('Attempting to verify OTP', { email });

    try {
      const response = await consumeCode({
        userInputCode: otp,
      });

      if (response.status === 'OK') {
        logger.info('OTP verified successfully', {
          email,
          isNewUser: response.createdNewRecipeUser
        });

        showSnackbar(
          response.createdNewRecipeUser
            ? 'Account created successfully!'
            : 'Welcome back!',
          'success'
        );

        // Redirect to dashboard
        navigate('/dashboard', {
          state: { isFirstLogin: response.createdNewRecipeUser }
        });
      } else if (response.status === 'INCORRECT_USER_INPUT_CODE_ERROR') {
        logger.warn('Incorrect OTP entered', { email, attemptsLeft: response.maximumCodeInputAttempts - response.failedCodeInputAttemptCount });

        const attemptsLeft = response.maximumCodeInputAttempts - response.failedCodeInputAttemptCount;
        showSnackbar(
          `Incorrect code. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining.`,
          'error'
        );
      } else if (response.status === 'EXPIRED_USER_INPUT_CODE_ERROR') {
        logger.warn('OTP expired', { email });
        showSnackbar('Verification code has expired. Please request a new one.', 'error');
        setOtp('');
      } else if (response.status === 'RESTART_FLOW_ERROR') {
        logger.warn('Flow restart required', { email });
        showSnackbar('Session expired. Please start over.', 'error');
        navigate('/auth');
      } else {
        logger.error('Failed to verify OTP', { email, status: response.status });
        showSnackbar('Verification failed. Please try again.', 'error');
      }
    } catch (error) {
      logger.error('Error verifying OTP', {
        email,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      showSnackbar('An error occurred. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResending(true);
    logger.info('Resending OTP', { email });

    try {
      const response = await createCode({
        email: email!,
      });

      if (response.status === 'OK') {
        logger.info('OTP resent successfully', { email });
        showSnackbar('New verification code sent!', 'success');
        setCountdown(60);
        setOtp('');
      } else {
        logger.error('Failed to resend OTP', { email });
        showSnackbar('Failed to resend code. Please try again.', 'error');
      }
    } catch (error) {
      logger.error('Error resending OTP', {
        email,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      showSnackbar('An error occurred. Please try again.', 'error');
    } finally {
      setResending(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 2,
          }}
        >
          {/* Back Button */}
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/auth')}
            sx={{ mb: 2 }}
          >
            Back
          </Button>

          {/* Logo and Title */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <RestaurantIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
              Verify Your Email
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Enter the verification code sent to
            </Typography>
            <Typography variant="body1" color="primary" fontWeight={600}>
              {email}
            </Typography>
          </Box>

          {/* OTP Form */}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Verification Code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              disabled={loading}
              autoFocus
              inputProps={{
                maxLength: 6,
                inputMode: 'numeric',
                pattern: '[0-9]*',
              }}
              sx={{ mb: 3 }}
              placeholder="Enter 6-digit code"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mb: 2, py: 1.5 }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Verify Code'
              )}
            </Button>
          </form>

          {/* Resend Code */}
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Didn't receive the code?
            </Typography>
            {countdown > 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Resend available in {countdown}s
              </Typography>
            ) : (
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={handleResendCode}
                disabled={resending}
                sx={{ mt: 1, cursor: 'pointer' }}
              >
                {resending ? 'Resending...' : 'Resend Code'}
              </Link>
            )}
          </Box>
        </Paper>

        {/* Info Text */}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
          Check your spam folder if you don't see the email
        </Typography>
      </Box>
    </Container>
  );
};

export default VerifyOTP;
