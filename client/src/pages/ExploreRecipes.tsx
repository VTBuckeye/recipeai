import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Pagination,
  Paper,
  Chip,
  InputAdornment,
  Collapse,
  IconButton
} from '@mui/material';
import { Search, FilterList, Close } from '@mui/icons-material';
import { RecipeCard } from '../components/recipe/RecipeCard';
import { recipeService } from '../services/recipeService';
import { Recipe, SearchFilters } from '../types';
import { useSnackbar } from '../contexts/SnackbarContext';

export const ExploreRecipes: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    tags: [],
    ingredient: ''
  });
  const [tagInput, setTagInput] = useState('');
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    searchRecipes();
  }, [page]);

  const searchRecipes = async () => {
    try {
      setLoading(true);
      const response = await recipeService.searchRecipes(filters, page, 12);
      setRecipes(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error: any) {
      showSnackbar(error.response?.data?.message || 'Failed to search recipes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    searchRecipes();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !filters.tags?.includes(tagInput.trim())) {
      setFilters({
        ...filters,
        tags: [...(filters.tags || []), tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFilters({
      ...filters,
      tags: filters.tags?.filter(tag => tag !== tagToRemove) || []
    });
  };

  const clearFilters = () => {
    setFilters({ query: '', tags: [], ingredient: '' });
    setPage(1);
  };

  const hasActiveFilters = filters.query || (filters.tags && filters.tags.length > 0) || filters.ingredient;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Explore Public Recipes
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Discover recipes shared by the community
      </Typography>

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            fullWidth
            placeholder="Search recipes by title or description..."
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            onKeyPress={handleKeyPress}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              )
            }}
          />
          <IconButton
            onClick={() => setShowFilters(!showFilters)}
            color={showFilters ? 'primary' : 'default'}
          >
            <FilterList />
          </IconButton>
          <Button variant="contained" onClick={handleSearch}>
            Search
          </Button>
        </Box>

        {/* Advanced Filters */}
        <Collapse in={showFilters}>
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              Advanced Filters
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Search by Ingredient"
                  value={filters.ingredient}
                  onChange={(e) => setFilters({ ...filters, ingredient: e.target.value })}
                  onKeyPress={handleKeyPress}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Box display="flex" gap={1}>
                  <TextField
                    fullWidth
                    label="Add Tag Filter"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    size="small"
                  />
                  <Button onClick={addTag} variant="outlined" size="small">
                    Add
                  </Button>
                </Box>
              </Grid>
            </Grid>

            {/* Tag Chips */}
            {filters.tags && filters.tags.length > 0 && (
              <Box display="flex" flexWrap="wrap" gap={1} mt={2}>
                <Typography variant="caption" color="text.secondary" sx={{ mr: 1, alignSelf: 'center' }}>
                  Tags:
                </Typography>
                {filters.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    onDelete={() => removeTag(tag)}
                    size="small"
                    color="primary"
                  />
                ))}
              </Box>
            )}

            {hasActiveFilters && (
              <Box mt={2}>
                <Button
                  startIcon={<Close />}
                  onClick={clearFilters}
                  size="small"
                >
                  Clear All Filters
                </Button>
              </Box>
            )}
          </Box>
        </Collapse>
      </Paper>

      {/* Results */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : recipes.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No recipes found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {hasActiveFilters
              ? 'Try adjusting your search filters'
              : 'Be the first to share a public recipe!'}
          </Typography>
        </Box>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Found {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
          </Typography>
          <Grid container spacing={3}>
            {recipes.map((recipe) => (
              <Grid item xs={12} sm={6} md={4} key={recipe._id}>
                <RecipeCard recipe={recipe} />
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
    </Container>
  );
};
