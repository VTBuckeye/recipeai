import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Container,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Restaurant as RestaurantIcon,
  Home as HomeIcon,
  Search as SearchIcon,
  Dashboard as DashboardIcon,
  LibraryBooks as LibraryBooksIcon,
  Explore as ExploreIcon,
} from '@mui/icons-material';
import { useSessionContext } from 'supertokens-auth-react/recipe/session';
import { signOut } from 'supertokens-auth-react/recipe/passwordless';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const session = useSessionContext();
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);

  // Check if session is authenticated (handle loading state)
  const isAuthenticated = session.loading === false && 'doesSessionExist' in session && session.doesSessionExist;

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    handleCloseUserMenu();
  };

  return (
    <AppBar position="sticky" color="default" elevation={1}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Logo */}
          <RestaurantIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontWeight: 700,
              color: 'primary.main',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/')}
          >
            RecipeAI
          </Typography>

          {/* Mobile menu */}
          {isMobile && (
            <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
              <IconButton size="large" onClick={handleOpenNavMenu} color="inherit">
                <MenuIcon />
              </IconButton>
              <Menu
                anchorEl={anchorElNav}
                open={Boolean(anchorElNav)}
                onClose={handleCloseNavMenu}
                sx={{ display: { xs: 'block', md: 'none' } }}
              >
                <MenuItem onClick={() => { navigate('/'); handleCloseNavMenu(); }}>
                  <HomeIcon sx={{ mr: 1 }} /> Home
                </MenuItem>
                {isAuthenticated && (
                  <>
                    <MenuItem onClick={() => { navigate('/dashboard'); handleCloseNavMenu(); }}>
                      <DashboardIcon sx={{ mr: 1 }} /> Dashboard
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/recipes/my-recipes'); handleCloseNavMenu(); }}>
                      <LibraryBooksIcon sx={{ mr: 1 }} /> My Recipes
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/explore'); handleCloseNavMenu(); }}>
                      <ExploreIcon sx={{ mr: 1 }} /> Explore
                    </MenuItem>
                  </>
                )}
              </Menu>
            </Box>
          )}

          {/* Mobile logo */}
          <RestaurantIcon sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }} />
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              flexGrow: 1,
              display: { xs: 'flex', md: 'none' },
              fontWeight: 700,
              color: 'primary.main',
            }}
          >
            RecipeAI
          </Typography>

          {/* Desktop menu */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, ml: 3 }}>
            <Button color="inherit" startIcon={<HomeIcon />} onClick={() => navigate('/')}>
              Home
            </Button>
            {isAuthenticated && (
              <>
                <Button color="inherit" startIcon={<DashboardIcon />} onClick={() => navigate('/dashboard')}>
                  Dashboard
                </Button>
                <Button color="inherit" startIcon={<LibraryBooksIcon />} onClick={() => navigate('/recipes/my-recipes')}>
                  My Recipes
                </Button>
                <Button color="inherit" startIcon={<ExploreIcon />} onClick={() => navigate('/explore')}>
                  Explore
                </Button>
              </>
            )}
          </Box>

          {/* User menu */}
          <Box sx={{ flexGrow: 0 }}>
            {isAuthenticated ? (
              <>
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar alt="User" src="/placeholder-avatar.png" />
                </IconButton>
                <Menu
                  sx={{ mt: '45px' }}
                  anchorEl={anchorElUser}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                >
                  <MenuItem onClick={() => { navigate('/profile'); handleCloseUserMenu(); }}>
                    Profile
                  </MenuItem>
                  <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
                </Menu>
              </>
            ) : (
              <Button variant="contained" color="primary" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
