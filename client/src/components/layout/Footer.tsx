import React from 'react';
import { Box, Container, Typography, Link, Grid } from '@mui/material';
import { Restaurant as RestaurantIcon } from '@mui/icons-material';

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 4,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.grey[100],
        borderTop: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <RestaurantIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" color="primary" fontWeight={700}>
                RecipeAI
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Your personal recipe management platform. Create, share, and discover amazing recipes.
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Features
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="/recipes/search" color="text.secondary" underline="hover">
                Search Recipes
              </Link>
              <Link href="/recipes/create" color="text.secondary" underline="hover">
                Create Recipe
              </Link>
              <Link href="/recipes/my-recipes" color="text.secondary" underline="hover">
                My Recipes
              </Link>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Account
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="/auth" color="text.secondary" underline="hover">
                Sign In
              </Link>
              <Link href="/profile" color="text.secondary" underline="hover">
                Profile
              </Link>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Support
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="#" color="text.secondary" underline="hover">
                Help Center
              </Link>
              <Link href="#" color="text.secondary" underline="hover">
                Contact Us
              </Link>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Legal
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="#" color="text.secondary" underline="hover">
                Privacy Policy
              </Link>
              <Link href="#" color="text.secondary" underline="hover">
                Terms of Service
              </Link>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, pt: 3, borderTop: (theme) => `1px solid ${theme.palette.divider}` }}>
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} RecipeAI. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
