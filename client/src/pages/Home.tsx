import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  Grid,
  Card,
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  Search as SearchIcon,
  Share as ShareIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useSessionContext } from 'supertokens-auth-react/recipe/session';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const session = useSessionContext();

  // Check if session is authenticated (handle loading state)
  const isAuthenticated = session.loading === false && 'doesSessionExist' in session && session.doesSessionExist;

  const features = [
    {
      icon: <RestaurantIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
      title: 'Create Recipes',
      description: 'Easily create and manage your favorite recipes with detailed instructions and ingredients.',
    },
    {
      icon: <SearchIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
      title: 'Search & Discover',
      description: 'Find recipes by ingredients, tags, or keywords. Discover new dishes to try.',
    },
    {
      icon: <ShareIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
      title: 'Share with Others',
      description: 'Make your recipes public to share with the community or keep them private.',
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
      title: 'Secure & Private',
      description: 'Your data is secure with passwordless authentication and encrypted storage.',
    },
  ];

  return (
    <Container maxWidth="xl">
      {/* Hero Section */}
      <Box
        sx={{
          textAlign: 'center',
          py: { xs: 6, md: 10 },
          px: 2,
        }}
      >
        <Typography
          variant="h1"
          component="h1"
          gutterBottom
          sx={{
            fontSize: { xs: '2rem', sm: '2.5rem', md: '3.5rem' },
            fontWeight: 800,
            color: 'primary.main',
          }}
        >
          Welcome to RecipeAI
        </Typography>
        <Typography
          variant="h5"
          color="text.secondary"
          paragraph
          sx={{
            maxWidth: '800px',
            mx: 'auto',
            mb: 4,
            fontSize: { xs: '1rem', sm: '1.25rem' },
          }}
        >
          Your personal recipe management platform. Create, organize, and share your favorite recipes with ease.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          {isAuthenticated ? (
            <>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/recipes/create')}
                sx={{ minWidth: 150 }}
              >
                Create Recipe
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/recipes/my-recipes')}
                sx={{ minWidth: 150 }}
              >
                My Recipes
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/auth')}
                sx={{ minWidth: 150 }}
              >
                Get Started
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/recipes/search')}
                sx={{ minWidth: 150 }}
              >
                Explore Recipes
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Hero Image */}
      <Box
        sx={{
          mb: 8,
          borderRadius: 2,
          overflow: 'hidden',
          height: { xs: 200, sm: 300, md: 400 },
          bgcolor: 'grey.200',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h6" color="text.secondary">
          [Hero Image Placeholder]
        </Typography>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 6 }}>
        <Typography
          variant="h2"
          component="h2"
          textAlign="center"
          gutterBottom
          sx={{ mb: 6, fontSize: { xs: '1.75rem', md: '2.5rem' } }}
        >
          Why Choose RecipeAI?
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  p: 3,
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                <Typography variant="h5" component="h3" gutterBottom fontWeight={600}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          py: 8,
          px: 4,
          textAlign: 'center',
          bgcolor: 'primary.main',
          color: 'white',
          borderRadius: 2,
          my: 6,
        }}
      >
        <Typography variant="h3" component="h2" gutterBottom sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
          Ready to Get Started?
        </Typography>
        <Typography variant="h6" paragraph sx={{ mb: 4, opacity: 0.9 }}>
          Join RecipeAI today and start organizing your recipes.
        </Typography>
        {!isAuthenticated && (
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/auth')}
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              '&:hover': {
                bgcolor: 'grey.100',
              },
            }}
          >
            Sign Up Now
          </Button>
        )}
      </Box>
    </Container>
  );
};

export default Home;
