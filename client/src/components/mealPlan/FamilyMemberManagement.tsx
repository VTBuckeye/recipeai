import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon } from '@mui/icons-material';
import familyMemberService, { FamilyMember } from '../../services/familyMemberService';
import { useSnackbar } from '../../contexts/SnackbarContext';
import logger from '../../utils/logger';

interface FamilyMemberManagementProps {
  familyMembers: FamilyMember[];
  onUpdate: () => void;
}

const FamilyMemberManagement: React.FC<FamilyMemberManagementProps> = ({
  familyMembers,
  onUpdate,
}) => {
  const { showSnackbar } = useSnackbar();
  const [newMemberName, setNewMemberName] = useState('');
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<FamilyMember | null>(null);

  // Add new family member
  const handleAddMember = async () => {
    if (!newMemberName.trim()) {
      showSnackbar('Please enter a name', 'error');
      return;
    }

    try {
      await familyMemberService.createFamilyMember({ name: newMemberName.trim() });
      setNewMemberName('');
      onUpdate();
      showSnackbar('Family member added successfully', 'success');
      logger.info('Family member added', { name: newMemberName });
    } catch (error: any) {
      logger.error('Failed to add family member', { error: error.message });
      showSnackbar('Failed to add family member', 'error');
    }
  };

  // Start editing a family member
  const handleStartEdit = (member: FamilyMember) => {
    setEditingMember(member);
    setEditName(member.name);
  };

  // Save edited family member
  const handleSaveEdit = async () => {
    if (!editingMember || !editName.trim()) {
      showSnackbar('Please enter a valid name', 'error');
      return;
    }

    try {
      await familyMemberService.updateFamilyMember(editingMember._id, { name: editName.trim() });
      setEditingMember(null);
      setEditName('');
      onUpdate();
      showSnackbar('Family member updated successfully', 'success');
      logger.info('Family member updated', { id: editingMember._id, name: editName });
    } catch (error: any) {
      logger.error('Failed to update family member', { error: error.message });
      showSnackbar('Failed to update family member', 'error');
    }
  };

  // Delete family member
  const handleDelete = async (member: FamilyMember) => {
    try {
      await familyMemberService.deleteFamilyMember(member._id);
      setDeleteDialog(null);
      onUpdate();
      showSnackbar('Family member deleted successfully', 'success');
      logger.info('Family member deleted', { id: member._id, name: member.name });
    } catch (error: any) {
      logger.error('Failed to delete family member', { error: error.message });
      showSnackbar('Failed to delete family member', 'error');
    }
  };

  return (
    <Box>
      {/* Add New Member */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          size="small"
          label="New Family Member"
          value={newMemberName}
          onChange={(e) => setNewMemberName(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleAddMember();
            }
          }}
        />
        <Button variant="contained" onClick={handleAddMember} startIcon={<AddIcon />}>
          Add
        </Button>
      </Box>

      {/* Family Members List */}
      {familyMembers.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
          No family members added yet
        </Typography>
      ) : (
        <List>
          {familyMembers.map((member) => (
            <ListItem
              key={member._id}
              secondaryAction={
                <Box>
                  <IconButton edge="end" onClick={() => handleStartEdit(member)} sx={{ mr: 1 }}>
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" onClick={() => setDeleteDialog(member)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              }
              sx={{
                bgcolor: 'grey.50',
                mb: 1,
                borderRadius: 1,
              }}
            >
              <ListItemText primary={member.name} />
            </ListItem>
          ))}
        </List>
      )}

      {/* Edit Dialog */}
      <Dialog open={editingMember !== null} onClose={() => setEditingMember(null)}>
        <DialogTitle>Edit Family Member</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSaveEdit();
              }
            }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingMember(null)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog !== null} onClose={() => setDeleteDialog(null)}>
        <DialogTitle>Delete Family Member</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {deleteDialog?.name}? This will not delete their meal
            plan entries.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Cancel</Button>
          <Button onClick={() => deleteDialog && handleDelete(deleteDialog)} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FamilyMemberManagement;
