import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
} from '@mui/material';
import { Restaurant as RestaurantIcon } from '@mui/icons-material';
import { createCode } from 'supertokens-auth-react/recipe/passwordless';
import { useSnackbar } from '../../contexts/SnackbarContext';
import logger from '../../utils/logger';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      showSnackbar('Please enter a valid email address', 'error');
      return;
    }

    setLoading(true);
    logger.info('Attempting to send OTP', { email });

    try {
      const response = await createCode({
        email,
      });

      if (response.status === 'OK') {
        logger.info('OTP sent successfully', { email });
        showSnackbar('Verification code sent to your email!', 'success');
        // Navigate to OTP verification page with email
        navigate('/auth/verify-otp', { state: { email } });
      } else if (response.status === 'SIGN_IN_UP_NOT_ALLOWED') {
        logger.error('Sign in not allowed', { email, reason: response.reason });
        showSnackbar('Authentication is currently not available. Please try again later.', 'error');
      } else {
        logger.error('Failed to send OTP', { email });
        showSnackbar('Failed to send verification code. Please try again.', 'error');
      }
    } catch (error) {
      logger.error('Error sending OTP', {
        email,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      showSnackbar('An error occurred. Please try again.', 'error');
    } finally {
      setLoading(false);
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
          {/* Logo and Title */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <RestaurantIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
              Welcome to RecipeAI
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sign in or create an account with your email
            </Typography>
          </Box>

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoFocus
              autoComplete="email"
              sx={{ mb: 3 }}
              placeholder="you@example.com"
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
                'Continue with Email'
              )}
            </Button>
          </form>

          {/* Info Text */}
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
            We'll send you a verification code to sign in
          </Typography>
        </Paper>

        {/* Footer Note */}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Typography>
      </Box>
    </Container>
  );
};

export default Login;
