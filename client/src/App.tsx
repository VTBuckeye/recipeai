import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SuperTokensWrapper } from 'supertokens-auth-react';
import { SessionAuth } from 'supertokens-auth-react/recipe/session';

import theme from './theme/theme';
import { initSuperTokens } from './config/supertokens';
import { SnackbarProvider } from './contexts/SnackbarContext';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Login from './pages/Auth/Login';
import VerifyOTP from './pages/Auth/VerifyOTP';
import Dashboard from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { MyRecipes } from './pages/MyRecipes';
import { ExploreRecipes } from './pages/ExploreRecipes';
import { RecipeDetailPage } from './pages/RecipeDetailPage';
import MealPlan from './pages/MealPlan';
import { SessionTimeoutWarning } from './components/SessionTimeoutWarning';
import logger from './utils/logger';

// Initialize SuperTokens
initSuperTokens();

const App: React.FC = () => {
  useEffect(() => {
    logger.info('Application started', {
      timestamp: new Date().toISOString(),
    });
  }, []);

  return (
    <SuperTokensWrapper>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider>
          <Router>
            <SessionTimeoutWarning />
            <Layout>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />

                {/* Auth Routes */}
                <Route path="/auth" element={<Login />} />
                <Route path="/auth/verify-otp" element={<VerifyOTP />} />

                {/* Protected Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <SessionAuth>
                      <Dashboard />
                    </SessionAuth>
                  }
                />

                <Route
                  path="/profile"
                  element={
                    <SessionAuth>
                      <Profile />
                    </SessionAuth>
                  }
                />

                <Route
                  path="/recipes/my-recipes"
                  element={
                    <SessionAuth>
                      <MyRecipes />
                    </SessionAuth>
                  }
                />

                <Route
                  path="/explore"
                  element={
                    <SessionAuth>
                      <ExploreRecipes />
                    </SessionAuth>
                  }
                />

                <Route
                  path="/recipes/:id"
                  element={
                    <SessionAuth>
                      <RecipeDetailPage />
                    </SessionAuth>
                  }
                />

                <Route
                  path="/meal-plan"
                  element={
                    <SessionAuth>
                      <MealPlan />
                    </SessionAuth>
                  }
                />

                {/* 404 - Redirect to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </Router>
        </SnackbarProvider>
      </ThemeProvider>
    </SuperTokensWrapper>
  );
};

export default App;
