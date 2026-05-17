import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  Chip,
  Box,
  IconButton,
  Tooltip,
  Button
} from '@mui/material';
import { Edit, Delete, Visibility, Lock, Public, CalendarMonth } from '@mui/icons-material';
import { Recipe } from '../../types';
import { useNavigate } from 'react-router-dom';
import AddToMealPlanModal from '../mealPlan/AddToMealPlanModal';

interface RecipeCardProps {
  recipe: Recipe;
  onEdit?: (recipe: Recipe) => void;
  onDelete?: (recipe: Recipe) => void;
  showActions?: boolean;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onEdit,
  onDelete,
  showActions = false
}) => {
  const navigate = useNavigate();
  const [mealPlanModalOpen, setMealPlanModalOpen] = useState(false);

  const handleView = () => {
    navigate(`/recipes/${recipe._id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) onEdit(recipe);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete(recipe);
  };

  const handleAddToMealPlan = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMealPlanModalOpen(true);
  };

  const coverImage = recipe.images && recipe.images.length > 0
    ? recipe.images[0]
    : 'https://via.placeholder.com/300x200?text=No+Image';

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        }
      }}
      onClick={handleView}
    >
      <CardMedia
        component="img"
        height="200"
        image={coverImage}
        alt={recipe.title}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
          <Typography gutterBottom variant="h6" component="h2" sx={{ flexGrow: 1 }}>
            {recipe.title}
          </Typography>
          {recipe.isPublic ? (
            <Tooltip title="Public">
              <Public color="primary" fontSize="small" />
            </Tooltip>
          ) : (
            <Tooltip title="Private">
              <Lock color="action" fontSize="small" />
            </Tooltip>
          )}
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            mb: 2
          }}
        >
          {recipe.description}
        </Typography>

        <Box display="flex" flexWrap="wrap" gap={0.5} mb={1}>
          {recipe.tags.slice(0, 3).map((tag, index) => (
            <Chip
              key={index}
              label={tag}
              size="small"
              variant="outlined"
            />
          ))}
          {recipe.tags.length > 3 && (
            <Chip
              label={`+${recipe.tags.length - 3}`}
              size="small"
              variant="outlined"
            />
          )}
        </Box>

        <Typography variant="caption" color="text.secondary">
          {recipe.ingredients.length} ingredients • {recipe.instructions.length} steps
        </Typography>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', pt: 0, px: 2, pb: 2 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<CalendarMonth />}
          onClick={handleAddToMealPlan}
        >
          Add to Plan
        </Button>

        {showActions && (
          <Box>
            <Tooltip title="View">
              <IconButton size="small" onClick={handleView}>
                <Visibility />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={handleEdit} color="primary">
                <Edit />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" onClick={handleDelete} color="error">
                <Delete />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </CardActions>

      {/* Add to Meal Plan Modal */}
      <AddToMealPlanModal
        open={mealPlanModalOpen}
        onClose={() => setMealPlanModalOpen(false)}
        recipeId={recipe._id}
        recipeTitle={recipe.title}
      />
    </Card>
  );
};
