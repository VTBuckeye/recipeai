import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Container,
  CircularProgress,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { RecipeCard } from '../components/recipe/RecipeCard';
import { RecipeForm } from '../components/recipe/RecipeForm';
import { recipeService } from '../services/recipeService';
import { Recipe } from '../types';
import { useSnackbar } from '../contexts/SnackbarContext';
import { useNavigate } from 'react-router-dom';

export const MyRecipes: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | undefined>(undefined);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; recipe: Recipe | null }>({
    open: false,
    recipe: null
  });
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();

  useEffect(() => {
    loadRecipes();
  }, [page]);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const response = await recipeService.getMyRecipes(page, 12);
      setRecipes(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error: any) {
      showSnackbar(error.response?.data?.message || 'Failed to load recipes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecipe = async (formData: FormData) => {
    try {
      await recipeService.createRecipe(formData);
      showSnackbar('Recipe created successfully!', 'success');
      setShowForm(false);
      loadRecipes();
    } catch (error: any) {
      showSnackbar(error.response?.data?.message || 'Failed to create recipe', 'error');
      throw error;
    }
  };

  const handleUpdateRecipe = async (formData: FormData) => {
    if (!editingRecipe) return;
    try {
      await recipeService.updateRecipe(editingRecipe._id, formData);
      showSnackbar('Recipe updated successfully!', 'success');
      setShowForm(false);
      setEditingRecipe(undefined);
      loadRecipes();
    } catch (error: any) {
      showSnackbar(error.response?.data?.message || 'Failed to update recipe', 'error');
      throw error;
    }
  };

  const handleEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setShowForm(true);
  };

  const handleDeleteClick = (recipe: Recipe) => {
    setDeleteDialog({ open: true, recipe });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.recipe) return;
    try {
      await recipeService.deleteRecipe(deleteDialog.recipe._id);
      showSnackbar('Recipe deleted successfully!', 'success');
      setDeleteDialog({ open: false, recipe: null });
      loadRecipes();
    } catch (error: any) {
      showSnackbar(error.response?.data?.message || 'Failed to delete recipe', 'error');
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingRecipe(undefined);
  };

  if (showForm) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <RecipeForm
          recipe={editingRecipe}
          onSubmit={editingRecipe ? handleUpdateRecipe : handleCreateRecipe}
          onCancel={handleFormCancel}
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          My Recipes
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setShowForm(true)}
        >
          Create Recipe
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : recipes.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No recipes yet
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Start by creating your first recipe!
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowForm(true)}
          >
            Create Recipe
          </Button>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {recipes.map((recipe) => (
              <Grid item xs={12} sm={6} md={4} key={recipe._id}>
                <RecipeCard
                  recipe={recipe}
                  onEdit={handleEdit}
                  onDelete={handleDeleteClick}
                  showActions
                />
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, recipe: null })}>
        <DialogTitle>Delete Recipe</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteDialog.recipe?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, recipe: null })}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
