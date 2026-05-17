import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  IconButton,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  DriveFileMove as MoveIcon,
} from '@mui/icons-material';
import { DndContext, DragEndEvent, closestCorners, useDraggable, useDroppable, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { useSnackbar } from '../contexts/SnackbarContext';
import mealPlanService, { MealPlanItem, MealPlan as MealPlanType } from '../services/mealPlanService';
import familyMemberService, { FamilyMember } from '../services/familyMemberService';
import FamilyMemberManagement from '../components/mealPlan/FamilyMemberManagement';
import logger from '../utils/logger';

const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

const MealPlan: React.FC = () => {
  const { showSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [mealPlan, setMealPlan] = useState<MealPlanType | null>(null);
  const [mealPlanItems, setMealPlanItems] = useState<MealPlanItem[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));
  const [manualEntryDialog, setManualEntryDialog] = useState(false);
  const [manualEntryData, setManualEntryData] = useState({
    dayOfWeek: '',
    mealType: '',
    manualEntry: '',
    familyMemberId: '',
  });
  const [familyMemberDialog, setFamilyMemberDialog] = useState(false);
  const [activeItem, setActiveItem] = useState<MealPlanItem | null>(null);
  const [moveDialog, setMoveDialog] = useState(false);
  const [itemToMove, setItemToMove] = useState<MealPlanItem | null>(null);
  const [moveDestination, setMoveDestination] = useState({
    dayOfWeek: '',
    mealType: '',
    familyMemberId: '',
  });

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

  // Load meal plan and family members
  const loadData = async () => {
    try {
      setLoading(true);
      const weekStartStr = formatDateForAPI(currentWeekStart);

      const [mealPlanData, familyMembersData] = await Promise.all([
        mealPlanService.getMealPlanByWeek(weekStartStr),
        familyMemberService.getFamilyMembers(),
      ]);

      setMealPlan(mealPlanData.mealPlan);
      setMealPlanItems(mealPlanData.items);
      setFamilyMembers(familyMembersData);

      logger.info('Meal plan loaded', {
        weekStart: weekStartStr,
        itemCount: mealPlanData.items.length,
      });
    } catch (error: any) {
      logger.error('Failed to load meal plan', { error: error.message });
      showSnackbar('Failed to load meal plan', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeekStart]);

  // Navigate to previous week
  const handlePreviousWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() - 7);
    setCurrentWeekStart(newWeekStart);
  };

  // Navigate to next week
  const handleNextWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() + 7);
    setCurrentWeekStart(newWeekStart);
  };

  // Navigate to current week
  const handleCurrentWeek = () => {
    setCurrentWeekStart(getWeekStart(new Date()));
  };

  // Get items for a specific day and meal type
  const getItemsForSlot = (dayOfWeek: string, mealType: string, familyMemberId?: string) => {
    return mealPlanItems.filter(
      (item) =>
        item.dayOfWeek === dayOfWeek &&
        item.mealType === mealType &&
        (familyMemberId ? item.familyMemberId?._id === familyMemberId : !item.familyMemberId)
    );
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const item = mealPlanItems.find((item) => item._id === active.id);
    setActiveItem(item || null);
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveItem(null);

    if (!over || active.id === over.id) {
      return;
    }

    // Parse drag data
    const activeId = active.id as string;
    const overId = over.id as string;

    // Extract destination info from droppable id
    // Format: "slot-{dayOfWeek}-{mealType}-{familyMemberId}"
    const overParts = overId.split('-');
    if (overParts[0] !== 'slot' || overParts.length < 3) {
      return;
    }

    const newDayOfWeek = overParts[1];
    const newMealType = overParts[2];
    const newFamilyMemberId = overParts[3] || null;

    try {
      // Update item
      await mealPlanService.updateMealPlanItem(activeId, {
        dayOfWeek: newDayOfWeek,
        mealType: newMealType,
        familyMemberId: newFamilyMemberId as any,
      });

      // Reload data
      await loadData();
      showSnackbar('Meal moved successfully', 'success');
    } catch (error: any) {
      logger.error('Failed to move meal', { error: error.message });
      showSnackbar('Failed to move meal', 'error');
    }
  };

  // Delete meal plan item
  const handleDeleteItem = async (itemId: string) => {
    try {
      await mealPlanService.deleteMealPlanItem(itemId);
      await loadData();
      showSnackbar('Meal removed successfully', 'success');
    } catch (error: any) {
      logger.error('Failed to delete meal', { error: error.message });
      showSnackbar('Failed to remove meal', 'error');
    }
  };

  // Open move dialog
  const handleOpenMoveDialog = (item: MealPlanItem) => {
    setItemToMove(item);
    setMoveDestination({
      dayOfWeek: item.dayOfWeek,
      mealType: item.mealType,
      familyMemberId: item.familyMemberId?._id || '',
    });
    setMoveDialog(true);
  };

  // Handle move from dialog
  const handleMoveItem = async () => {
    if (!itemToMove || !moveDestination.dayOfWeek || !moveDestination.mealType) {
      showSnackbar('Please select a destination', 'error');
      return;
    }

    try {
      await mealPlanService.updateMealPlanItem(itemToMove._id, {
        dayOfWeek: moveDestination.dayOfWeek,
        mealType: moveDestination.mealType,
        familyMemberId: moveDestination.familyMemberId || null,
      } as any);

      await loadData();
      setMoveDialog(false);
      setItemToMove(null);
      showSnackbar('Meal moved successfully', 'success');
    } catch (error: any) {
      logger.error('Failed to move meal', { error: error.message });
      showSnackbar('Failed to move meal', 'error');
    }
  };

  // Add manual entry
  const handleAddManualEntry = async () => {
    if (!mealPlan || !manualEntryData.dayOfWeek || !manualEntryData.mealType || !manualEntryData.manualEntry) {
      showSnackbar('Please fill in all required fields', 'error');
      return;
    }

    try {
      await mealPlanService.addMealPlanItem({
        mealPlanId: mealPlan._id,
        dayOfWeek: manualEntryData.dayOfWeek,
        mealType: manualEntryData.mealType,
        manualEntry: manualEntryData.manualEntry,
        familyMemberId: manualEntryData.familyMemberId || undefined,
      });

      await loadData();
      setManualEntryDialog(false);
      setManualEntryData({ dayOfWeek: '', mealType: '', manualEntry: '', familyMemberId: '' });
      showSnackbar('Manual entry added successfully', 'success');
    } catch (error: any) {
      logger.error('Failed to add manual entry', { error: error.message });
      showSnackbar('Failed to add manual entry', 'error');
    }
  };

  // Format week display
  const getWeekDisplay = () => {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return `${currentWeekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
  };

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1" fontWeight={700}>
            Meal Plan
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<PeopleIcon />}
              onClick={() => setFamilyMemberDialog(true)}
            >
              Manage Family Members
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setManualEntryDialog(true)}
            >
              Add Manual Entry
            </Button>
          </Box>
        </Box>

        {/* Week Navigation */}
        <Paper sx={{ p: 2, mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <IconButton onClick={handlePreviousWeek}>
            <ChevronLeftIcon />
          </IconButton>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={600}>
              {getWeekDisplay()}
            </Typography>
            <Button size="small" onClick={handleCurrentWeek}>
              Current Week
            </Button>
          </Box>
          <IconButton onClick={handleNextWeek}>
            <ChevronRightIcon />
          </IconButton>
        </Paper>

        {/* Meal Plan Grid */}
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
          <Box>
            {DAYS_OF_WEEK.map((day) => (
              <Paper key={day} sx={{ mb: 3, p: 3 }}>
                <Typography variant="h5" fontWeight={600} sx={{ mb: 2, textTransform: 'capitalize' }}>
                  {day}
                </Typography>

                <Grid container spacing={2}>
                  {MEAL_TYPES.map((mealType) => (
                    <Grid item xs={12} md={6} lg={3} key={mealType}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {MEAL_TYPE_LABELS[mealType]}
                          </Typography>

                          {/* Items without family member */}
                          <DroppableSlot id={`slot-${day}-${mealType}-`}>
                            {getItemsForSlot(day, mealType).map((item) => (
                              <MealCard key={item._id} item={item} onDelete={handleDeleteItem} onMove={handleOpenMoveDialog} />
                            ))}
                          </DroppableSlot>

                          {/* Family member sections */}
                          {familyMembers.map((member) => (
                            <Box key={member._id} sx={{ mb: 1 }}>
                              <Chip
                                label={member.name}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ mb: 1 }}
                              />
                              <DroppableSlot id={`slot-${day}-${mealType}-${member._id}`} minHeight={80}>
                                {getItemsForSlot(day, mealType, member._id).map((item) => (
                                  <MealCard key={item._id} item={item} onDelete={handleDeleteItem} onMove={handleOpenMoveDialog} />
                                ))}
                              </DroppableSlot>
                            </Box>
                          ))}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            ))}
          </Box>
          <DragOverlay>
            {activeItem ? <MealCardOverlay item={activeItem} /> : null}
          </DragOverlay>
        </DndContext>

        {/* Manual Entry Dialog */}
        <Dialog open={manualEntryDialog} onClose={() => setManualEntryDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add Manual Entry</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Day of Week</InputLabel>
                <Select
                  value={manualEntryData.dayOfWeek}
                  label="Day of Week"
                  onChange={(e) => setManualEntryData({ ...manualEntryData, dayOfWeek: e.target.value })}
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
                  value={manualEntryData.mealType}
                  label="Meal Type"
                  onChange={(e) => setManualEntryData({ ...manualEntryData, mealType: e.target.value })}
                >
                  {MEAL_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {MEAL_TYPE_LABELS[type]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Meal Description"
                value={manualEntryData.manualEntry}
                onChange={(e) => setManualEntryData({ ...manualEntryData, manualEntry: e.target.value })}
                multiline
                rows={2}
              />

              <FormControl fullWidth>
                <InputLabel>Family Member (Optional)</InputLabel>
                <Select
                  value={manualEntryData.familyMemberId}
                  label="Family Member (Optional)"
                  onChange={(e) => setManualEntryData({ ...manualEntryData, familyMemberId: e.target.value })}
                >
                  <MenuItem value="">None</MenuItem>
                  {familyMembers.map((member) => (
                    <MenuItem key={member._id} value={member._id}>
                      {member.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setManualEntryDialog(false)}>Cancel</Button>
            <Button onClick={handleAddManualEntry} variant="contained">
              Add
            </Button>
          </DialogActions>
        </Dialog>

        {/* Family Member Management Dialog */}
        <Dialog open={familyMemberDialog} onClose={() => setFamilyMemberDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Manage Family Members</DialogTitle>
          <DialogContent>
            <FamilyMemberManagement familyMembers={familyMembers} onUpdate={loadData} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFamilyMemberDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Move Item Dialog */}
        <Dialog open={moveDialog} onClose={() => setMoveDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Move Meal</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              {itemToMove && (
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Moving:
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {itemToMove.recipeId ? itemToMove.recipeId.title : itemToMove.manualEntry}
                  </Typography>
                </Paper>
              )}

              <FormControl fullWidth>
                <InputLabel>Day of Week</InputLabel>
                <Select
                  value={moveDestination.dayOfWeek}
                  label="Day of Week"
                  onChange={(e) => setMoveDestination({ ...moveDestination, dayOfWeek: e.target.value })}
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
                  value={moveDestination.mealType}
                  label="Meal Type"
                  onChange={(e) => setMoveDestination({ ...moveDestination, mealType: e.target.value })}
                >
                  {MEAL_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {MEAL_TYPE_LABELS[type]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Family Member (Optional)</InputLabel>
                <Select
                  value={moveDestination.familyMemberId}
                  label="Family Member (Optional)"
                  onChange={(e) => setMoveDestination({ ...moveDestination, familyMemberId: e.target.value })}
                >
                  <MenuItem value="">None</MenuItem>
                  {familyMembers.map((member) => (
                    <MenuItem key={member._id} value={member._id}>
                      {member.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setMoveDialog(false)}>Cancel</Button>
            <Button onClick={handleMoveItem} variant="contained">
              Move
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

// Droppable Slot Component
interface DroppableSlotProps {
  id: string;
  children: React.ReactNode;
  minHeight?: number;
}

const DroppableSlot: React.FC<DroppableSlotProps> = ({ id, children, minHeight = 100 }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        minHeight,
        p: 1,
        bgcolor: isOver ? 'primary.light' : 'grey.50',
        borderRadius: 1,
        mb: 2,
        transition: 'background-color 0.2s',
      }}
    >
      {children}
    </Box>
  );
};

// Meal Card Component
interface MealCardProps {
  item: MealPlanItem;
  onDelete: (id: string) => void;
  onMove: (item: MealPlanItem) => void;
}

const MealCard: React.FC<MealCardProps> = ({ item, onDelete, onMove }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item._id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  // Use media query to determine if we should enable drag
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 900); // md breakpoint
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Only apply drag listeners on desktop
  const dragProps = isMobile ? {} : { ...attributes, ...listeners };

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      {...dragProps}
      sx={{
        p: 1.5,
        mb: 1,
        opacity: isDragging ? 0.3 : 1,
        cursor: { xs: 'default', md: 'grab' },
        '&:hover': {
          bgcolor: 'grey.100',
        },
        '&:active': {
          cursor: { xs: 'default', md: 'grabbing' },
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
        {item.recipeId && item.recipeId.images && item.recipeId.images.length > 0 && (
          <Box
            component="img"
            src={item.recipeId.images[0]}
            alt={item.recipeId.title}
            sx={{
              width: 40,
              height: 40,
              objectFit: 'cover',
              borderRadius: 1,
              flexShrink: 0,
            }}
          />
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {item.recipeId ? (
            <Typography variant="body2" fontWeight={600} noWrap>
              {item.recipeId.title}
            </Typography>
          ) : (
            <Typography variant="body2" fontWeight={600} fontStyle="italic" noWrap>
              {item.manualEntry}
            </Typography>
          )}
        </Box>

        {/* Move button - visible on mobile, hidden on larger screens */}
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onMove(item);
          }}
          sx={{ flexShrink: 0, display: { xs: 'inline-flex', md: 'none' } }}
        >
          <MoveIcon fontSize="small" />
        </IconButton>

        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item._id);
          }}
          sx={{ flexShrink: 0 }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    </Paper>
  );
};

// Meal Card Overlay Component (for drag overlay)
interface MealCardOverlayProps {
  item: MealPlanItem;
}

const MealCardOverlay: React.FC<MealCardOverlayProps> = ({ item }) => {
  return (
    <Paper
      sx={{
        p: 1.5,
        cursor: 'grabbing',
        boxShadow: 4,
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
        {item.recipeId && item.recipeId.images && item.recipeId.images.length > 0 && (
          <Box
            component="img"
            src={item.recipeId.images[0]}
            alt={item.recipeId.title}
            sx={{
              width: 40,
              height: 40,
              objectFit: 'cover',
              borderRadius: 1,
              flexShrink: 0,
            }}
          />
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {item.recipeId ? (
            <Typography variant="body2" fontWeight={600} noWrap>
              {item.recipeId.title}
            </Typography>
          ) : (
            <Typography variant="body2" fontWeight={600} fontStyle="italic" noWrap>
              {item.manualEntry}
            </Typography>
          )}
        </Box>
        <Box sx={{ width: 32 }} />
      </Box>
    </Paper>
  );
};

export default MealPlan;
