import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, CircularProgress, Box, Typography } from '@mui/material';
import { RecipeDetail } from '../components/recipe/RecipeDetail';
import { recipeService } from '../services/recipeService';
import { Recipe } from '../types';
import { useSnackbar } from '../contexts/SnackbarContext';
import { useSessionContext } from 'supertokens-auth-react/recipe/session';

export const RecipeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const { showSnackbar } = useSnackbar();
  const session = useSessionContext();

  const currentUserId = session.loading === false && 'userId' in session
    ? session.userId
    : null;

  useEffect(() => {
    if (id) {
      loadRecipe();
    }
  }, [id]);

  const loadRecipe = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const recipeData = await recipeService.getRecipeById(id);
      setRecipe(recipeData);
    } catch (error: any) {
      showSnackbar(error.response?.data?.message || 'Failed to load recipe', 'error');
      navigate('/explore');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/recipes/edit/${id}`);
  };

  const handleDelete = async () => {
    if (!id) return;
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      try {
        await recipeService.deleteRecipe(id);
        showSnackbar('Recipe deleted successfully!', 'success');
        navigate('/recipes/my-recipes');
      } catch (error: any) {
        showSnackbar(error.response?.data?.message || 'Failed to delete recipe', 'error');
      }
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!recipe) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Recipe not found</Typography>
      </Container>
    );
  }

  const isOwner = currentUserId === recipe.userId;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <RecipeDetail
        recipe={recipe}
        isOwner={isOwner}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </Container>
  );
};
