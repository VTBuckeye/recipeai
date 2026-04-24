import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ open, onClose }) => {
  const features = [
    {
      title: 'Create & Organize',
      description: 'Build your personal recipe collection with detailed instructions and ingredients',
    },
    {
      title: 'Search & Discover',
      description: 'Find recipes by ingredients, tags, or keywords from the community',
    },
    {
      title: 'Share with Others',
      description: 'Make your recipes public or keep them private - you control the visibility',
    },
    {
      title: 'Upload Images',
      description: 'Add photos to your recipes and profile to make them more appealing',
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ textAlign: 'center' }}>
          <RestaurantIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" component="div" fontWeight={700}>
            Welcome to RecipeAI!
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body1" color="text.secondary" paragraph sx={{ textAlign: 'center' }}>
          We're excited to have you here. Get started with these amazing features:
        </Typography>

        <List sx={{ mt: 2 }}>
          {features.map((feature, index) => (
            <ListItem key={index} alignItems="flex-start">
              <ListItemIcon>
                <CheckCircleIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="subtitle1" fontWeight={600}>
                    {feature.title}
                  </Typography>
                }
                secondary={
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>

        <Box
          sx={{
            mt: 3,
            p: 2,
            bgcolor: 'primary.light',
            borderRadius: 1,
          }}
        >
          <Typography variant="body2" sx={{ color: 'primary.contrastText' }}>
            <strong>Pro Tip:</strong> Start by creating your first recipe or exploring
            the community recipes to get inspired!
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onClose}
          variant="contained"
          size="large"
          fullWidth
        >
          Get Started
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WelcomeModal;
