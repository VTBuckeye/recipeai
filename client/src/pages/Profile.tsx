import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  TextField,
  Button,
  Avatar,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material';
import { PhotoCamera, Delete, Edit, Save, Cancel } from '@mui/icons-material';
import { userService } from '../services/userService';
import { User } from '../types';
import { useSnackbar } from '../contexts/SnackbarContext';
import { signOut } from 'supertokens-auth-react/recipe/passwordless';
import { useNavigate } from 'react-router-dom';

export const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);
      const userData = await userService.getMe();
      setUser(userData);
      setName(userData.name);
    } catch (error: any) {
      showSnackbar(error.response?.data?.message || 'Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const updatedUser = await userService.updateProfile({ name });
      setUser(updatedUser);
      setEditing(false);
      showSnackbar('Profile updated successfully!', 'success');
    } catch (error: any) {
      showSnackbar(error.response?.data?.message || 'Failed to update profile', 'error');
    }
  };

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];

    // Validate file size (1MB)
    if (file.size > 1024 * 1024) {
      showSnackbar('Image must be less than 1MB', 'error');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showSnackbar('File must be an image', 'error');
      return;
    }

    try {
      setUploading(true);
      const updatedUser = await userService.uploadProfilePicture(file);
      setUser(updatedUser);
      showSnackbar('Profile picture updated!', 'success');
    } catch (error: any) {
      showSnackbar(error.response?.data?.message || 'Failed to upload profile picture', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await userService.deleteAccount();
      showSnackbar('Account deleted successfully', 'success');
      await signOut();
      navigate('/');
    } catch (error: any) {
      showSnackbar(error.response?.data?.message || 'Failed to delete account', 'error');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      showSnackbar('Failed to sign out', 'error');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography>Failed to load profile</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Profile
      </Typography>

      <Paper sx={{ p: 4, mb: 3 }}>
        {/* Profile Picture Section */}
        <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
          <Box position="relative">
            <Avatar
              src={user.profilePictureUrl || undefined}
              alt={user.name}
              sx={{ width: 120, height: 120, mb: 2 }}
            />
            {uploading && (
              <CircularProgress
                size={120}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0
                }}
              />
            )}
          </Box>
          <Button
            variant="outlined"
            component="label"
            startIcon={<PhotoCamera />}
            disabled={uploading}
          >
            Change Picture
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleProfilePictureChange}
            />
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Max size: 1MB
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Profile Information */}
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">Profile Information</Typography>
            {!editing ? (
              <Button startIcon={<Edit />} onClick={() => setEditing(true)}>
                Edit
              </Button>
            ) : (
              <Box display="flex" gap={1}>
                <Button
                  startIcon={<Cancel />}
                  onClick={() => {
                    setEditing(false);
                    setName(user.name);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  startIcon={<Save />}
                  variant="contained"
                  onClick={handleUpdateProfile}
                >
                  Save
                </Button>
              </Box>
            )}
          </Box>

          <TextField
            fullWidth
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!editing}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Email"
            value={user.email}
            disabled
            margin="normal"
            helperText="Email cannot be changed"
          />

          <Box mt={2}>
            <Typography variant="caption" color="text.secondary">
              Member since: {new Date(user.createdAt).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Account Actions */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Account Actions
        </Typography>
        <Box display="flex" flexDirection="column" gap={2} mt={2}>
          <Button
            variant="outlined"
            onClick={handleSignOut}
            fullWidth
          >
            Sign Out
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={() => setDeleteDialog(true)}
            fullWidth
          >
            Delete Account
          </Button>
        </Box>
      </Paper>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete your account? This action cannot be undone.
            All your recipes and data will be permanently deleted.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleDeleteAccount} color="error" variant="contained">
            Delete Account
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
