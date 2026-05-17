import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  CircularProgress,
  Typography,
} from '@mui/material';
import mealPlanService from '../../services/mealPlanService';
import familyMemberService, { FamilyMember } from '../../services/familyMemberService';
import { useSnackbar } from '../../contexts/SnackbarContext';
import logger from '../../utils/logger';

const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

interface AddToMealPlanModalProps {
  open: boolean;
  onClose: () => void;
  recipeId: string;
  recipeTitle: string;
}

const AddToMealPlanModal: React.FC<AddToMealPlanModalProps> = ({
  open,
  onClose,
  recipeId,
  recipeTitle,
}) => {
  const { showSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<Date>(getWeekStart(new Date()));
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedMealType, setSelectedMealType] = useState('');
  const [selectedFamilyMember, setSelectedFamilyMember] = useState('');

  // Get the start of the week (Sunday)
  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    const weekStart = new Date(d.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }

  // Format date for API
  function formatDateForAPI(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Load family members
  useEffect(() => {
    const loadFamilyMembers = async () => {
      try {
        const members = await familyMemberService.getFamilyMembers();
        setFamilyMembers(members);
      } catch (error: any) {
        logger.error('Failed to load family members', { error: error.message });
      }
    };

    if (open) {
      loadFamilyMembers();
    }
  }, [open]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setSelectedWeek(getWeekStart(new Date()));
      setSelectedDay('');
      setSelectedMealType('');
      setSelectedFamilyMember('');
    }
  }, [open]);

  // Handle adding to meal plan
  const handleAddToMealPlan = async () => {
    if (!selectedDay || !selectedMealType) {
      showSnackbar('Please select a day and meal type', 'error');
      return;
    }

    try {
      setLoading(true);

      // Get or create meal plan for the selected week
      const weekStartStr = formatDateForAPI(selectedWeek);
      const { mealPlan } = await mealPlanService.getMealPlanByWeek(weekStartStr);

      // Add recipe to meal plan
      await mealPlanService.addMealPlanItem({
        mealPlanId: mealPlan._id,
        recipeId,
        dayOfWeek: selectedDay,
        mealType: selectedMealType,
        familyMemberId: selectedFamilyMember || undefined,
      });

      showSnackbar(`Added "${recipeTitle}" to meal plan`, 'success');
      logger.info('Recipe added to meal plan', {
        recipeId,
        dayOfWeek: selectedDay,
        mealType: selectedMealType,
      });

      onClose();
    } catch (error: any) {
      logger.error('Failed to add recipe to meal plan', { error: error.message });
      showSnackbar('Failed to add recipe to meal plan', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Generate week options (current week + next 3 weeks)
  const getWeekOptions = () => {
    const options = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() + i * 7);
      const start = getWeekStart(weekStart);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      options.push({
        value: start,
        label: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
      });
    }
    return options;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      onClick={(e) => e.stopPropagation()}
    >
      <DialogTitle>Add to Meal Plan</DialogTitle>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Adding: <strong>{recipeTitle}</strong>
          </Typography>

          <FormControl fullWidth>
            <InputLabel>Week</InputLabel>
            <Select
              value={selectedWeek.toISOString()}
              label="Week"
              onChange={(e) => setSelectedWeek(new Date(e.target.value))}
            >
              {getWeekOptions().map((option) => (
                <MenuItem key={option.value.toISOString()} value={option.value.toISOString()}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Day of Week</InputLabel>
            <Select
              value={selectedDay}
              label="Day of Week"
              onChange={(e) => setSelectedDay(e.target.value)}
            >
              {DAYS_OF_WEEK.map((day) => (
                <MenuItem key={day} value={day} sx={{ textTransform: 'capitalize' }}>
                  {day}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Meal Type</InputLabel>
            <Select
              value={selectedMealType}
              label="Meal Type"
              onChange={(e) => setSelectedMealType(e.target.value)}
            >
              {MEAL_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {MEAL_TYPE_LABELS[type]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {familyMembers.length > 0 && (
            <FormControl fullWidth>
              <InputLabel>Family Member (Optional)</InputLabel>
              <Select
                value={selectedFamilyMember}
                label="Family Member (Optional)"
                onChange={(e) => setSelectedFamilyMember(e.target.value)}
              >
                <MenuItem value="">None</MenuItem>
                {familyMembers.map((member) => (
                  <MenuItem key={member._id} value={member._id}>
                    {member.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      </DialogContent>
      <DialogActions onClick={(e) => e.stopPropagation()}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleAddToMealPlan} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Add to Meal Plan'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddToMealPlanModal;
