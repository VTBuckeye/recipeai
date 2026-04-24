import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
} from '@mui/material';
import {
  LibraryBooks as LibraryBooksIcon,
  Explore as ExploreIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import WelcomeModal from '../components/WelcomeModal';
import logger from '../utils/logger';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Show welcome modal for first-time users
    const isFirstLogin = location.state?.isFirstLogin;
    if (isFirstLogin) {
      setShowWelcome(true);
      logger.info('First-time user login detected, showing welcome modal');
      // Clear the state to prevent showing again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const dashboardCards = [
    {
      title: 'My Recipes',
      description: 'View and manage all your recipes',
      icon: <LibraryBooksIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
      action: () => navigate('/recipes/my-recipes'),
      buttonText: 'View Recipes',
    },
    {
      title: 'Explore Recipes',
      description: 'Discover recipes from the community',
      icon: <ExploreIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
      action: () => navigate('/explore'),
      buttonText: 'Explore',
    },
    {
      title: 'My Profile',
      description: 'Update your profile and settings',
      icon: <PersonIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
      action: () => navigate('/profile'),
      buttonText: 'View Profile',
    },
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight={700}>
          Dashboard
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Welcome back! What would you like to do today?
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          {dashboardCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                  <Box sx={{ mb: 2 }}>{card.icon}</Box>
                  <Typography variant="h5" component="h2" gutterBottom fontWeight={600}>
                    {card.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {card.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                  <Button
                    variant="contained"
                    onClick={card.action}
                    fullWidth
                    sx={{ mx: 2 }}
                  >
                    {card.buttonText}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Quick Stats Section - Placeholder for future implementation */}
        <Box sx={{ mt: 6 }}>
          <Typography variant="h4" gutterBottom fontWeight={600}>
            Quick Stats
          </Typography>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Recipes
                  </Typography>
                  <Typography variant="h3" component="div">
                    0
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Public Recipes
                  </Typography>
                  <Typography variant="h3" component="div">
                    0
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Private Recipes
                  </Typography>
                  <Typography variant="h3" component="div">
                    0
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* Welcome Modal for First-Time Users */}
      <WelcomeModal
        open={showWelcome}
        onClose={() => setShowWelcome(false)}
      />
    </Container>
  );
};

export default Dashboard;
