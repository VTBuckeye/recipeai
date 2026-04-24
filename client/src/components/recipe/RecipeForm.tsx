import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Grid,
  IconButton,
  Chip,
  FormControlLabel,
  Switch,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Card,
  CardMedia,
  CardActions
} from '@mui/material';
import { Add, Delete, CloudUpload, Close } from '@mui/icons-material';
import { Recipe, Ingredient, InstructionStep } from '../../types';

interface RecipeFormProps {
  recipe?: Recipe;
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
}

const MEASUREMENT_UNITS = [
  'cup', 'tbsp', 'tsp', 'oz', 'lb', 'g', 'kg', 'ml', 'l', 'piece', 'to taste', 'other'
];

export const RecipeForm: React.FC<RecipeFormProps> = ({ recipe, onSubmit, onCancel }) => {
  const [title, setTitle] = useState(recipe?.title || '');
  const [description, setDescription] = useState(recipe?.description || '');
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    recipe?.ingredients || [{ quantity: 0, unit: 'cup', name: '' }]
  );
  const [instructions, setInstructions] = useState<InstructionStep[]>(
    recipe?.instructions || [{ stepNumber: 1, instruction: '', imageUrl: '' }]
  );
  const [tags, setTags] = useState<string[]>(recipe?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [isPublic, setIsPublic] = useState(recipe?.isPublic ?? true);
  const [recipeImages, setRecipeImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(recipe?.images || []);
  const [stepImages, setStepImages] = useState<{ [key: number]: File }>({});
  const [loading, setLoading] = useState(false);

  // Add ingredient
  const addIngredient = () => {
    setIngredients([...ingredients, { quantity: 0, unit: 'cup', name: '' }]);
  };

  // Remove ingredient
  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  // Update ingredient
  const updateIngredient = (index: number, field: keyof Ingredient, value: any) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  // Add instruction
  const addInstruction = () => {
    setInstructions([
      ...instructions,
      { stepNumber: instructions.length + 1, instruction: '', imageUrl: '' }
    ]);
  };

  // Remove instruction
  const removeInstruction = (index: number) => {
    const updated = instructions.filter((_, i) => i !== index);
    // Renumber steps
    updated.forEach((step, i) => {
      step.stepNumber = i + 1;
    });
    setInstructions(updated);
  };

  // Update instruction
  const updateInstruction = (index: number, value: string) => {
    const updated = [...instructions];
    updated[index] = { ...updated[index], instruction: value };
    setInstructions(updated);
  };

  // Handle step image upload
  const handleStepImageChange = (index: number, file: File | null) => {
    if (file) {
      setStepImages({ ...stepImages, [index]: file });
    } else {
      const updated = { ...stepImages };
      delete updated[index];
      setStepImages(updated);
    }
  };

  // Add tag
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Handle recipe images
  const handleRecipeImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setRecipeImages([...recipeImages, ...Array.from(e.target.files)]);
    }
  };

  // Remove recipe image (new upload)
  const removeRecipeImage = (index: number) => {
    setRecipeImages(recipeImages.filter((_, i) => i !== index));
  };

  // Remove existing image
  const removeExistingImage = (imageUrl: string) => {
    setExistingImages(existingImages.filter(img => img !== imageUrl));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('ingredients', JSON.stringify(ingredients));
      formData.append('instructions', JSON.stringify(instructions));
      formData.append('tags', JSON.stringify(tags));
      formData.append('isPublic', String(isPublic));

      // Add recipe images
      recipeImages.forEach(file => {
        formData.append('recipeImages', file);
      });

      // Add step images
      Object.entries(stepImages).forEach(([stepIndex, file]) => {
        formData.append(`stepImage_${stepIndex}`, file);
      });

      // Track removed existing images
      if (recipe) {
        const removedImages = recipe.images.filter(img => !existingImages.includes(img));
        if (removedImages.length > 0) {
          formData.append('removedImages', JSON.stringify(removedImages));
        }
      }

      await onSubmit(formData);
    } catch (error) {
      console.error('Failed to submit recipe:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          {recipe ? 'Edit Recipe' : 'Create New Recipe'}
        </Typography>

        {/* Basic Info */}
        <TextField
          fullWidth
          label="Recipe Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          margin="normal"
        />

        <TextField
          fullWidth
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          multiline
          rows={3}
          margin="normal"
        />

        <FormControlLabel
          control={
            <Switch
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
          }
          label="Make this recipe public"
          sx={{ mt: 2 }}
        />

        {/* Recipe Images */}
        <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
          Recipe Images
        </Typography>
        <Button
          variant="outlined"
          component="label"
          startIcon={<CloudUpload />}
          sx={{ mb: 2 }}
        >
          Upload Images
          <input
            type="file"
            hidden
            multiple
            accept="image/*"
            onChange={handleRecipeImagesChange}
          />
        </Button>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {existingImages.map((imageUrl, index) => (
            <Grid item xs={12} sm={6} md={4} key={`existing-${index}`}>
              <Card>
                <CardMedia
                  component="img"
                  height="150"
                  image={imageUrl}
                  alt={`Recipe ${index + 1}`}
                />
                <CardActions>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => removeExistingImage(imageUrl)}
                  >
                    Remove
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
          {recipeImages.map((file, index) => (
            <Grid item xs={12} sm={6} md={4} key={`new-${index}`}>
              <Card>
                <CardMedia
                  component="img"
                  height="150"
                  image={URL.createObjectURL(file)}
                  alt={file.name}
                />
                <CardActions>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => removeRecipeImage(index)}
                  >
                    Remove
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Ingredients */}
        <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
          Ingredients
        </Typography>
        {ingredients.map((ingredient, index) => (
          <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={ingredient.quantity}
                onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value))}
                required
                inputProps={{ step: 0.01, min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Unit</InputLabel>
                <Select
                  value={ingredient.unit}
                  label="Unit"
                  onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                  required
                >
                  {MEASUREMENT_UNITS.map((unit) => (
                    <MenuItem key={unit} value={unit}>
                      {unit}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField
                fullWidth
                label="Ingredient Name"
                value={ingredient.name}
                onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={1}>
              <IconButton
                color="error"
                onClick={() => removeIngredient(index)}
                disabled={ingredients.length === 1}
              >
                <Delete />
              </IconButton>
            </Grid>
          </Grid>
        ))}
        <Button startIcon={<Add />} onClick={addIngredient} variant="outlined">
          Add Ingredient
        </Button>

        {/* Instructions */}
        <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
          Instructions
        </Typography>
        {instructions.map((step, index) => (
          <Paper key={index} sx={{ p: 2, mb: 2 }}>
            <Box display="flex" alignItems="flex-start" gap={2}>
              <Typography variant="h6" sx={{ minWidth: 40 }}>
                {step.stepNumber}.
              </Typography>
              <Box flexGrow={1}>
                <TextField
                  fullWidth
                  label={`Step ${step.stepNumber}`}
                  value={step.instruction}
                  onChange={(e) => updateInstruction(index, e.target.value)}
                  required
                  multiline
                  rows={2}
                />
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUpload />}
                  size="small"
                  sx={{ mt: 1 }}
                >
                  {stepImages[index] ? 'Change Image' : 'Add Image (Optional)'}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleStepImageChange(index, e.target.files[0]);
                      }
                    }}
                  />
                </Button>
                {stepImages[index] && (
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      label={stepImages[index].name}
                      onDelete={() => handleStepImageChange(index, null)}
                      size="small"
                    />
                  </Box>
                )}
              </Box>
              <IconButton
                color="error"
                onClick={() => removeInstruction(index)}
                disabled={instructions.length === 1}
              >
                <Delete />
              </IconButton>
            </Box>
          </Paper>
        ))}
        <Button startIcon={<Add />} onClick={addInstruction} variant="outlined">
          Add Step
        </Button>

        {/* Tags */}
        <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
          Tags
        </Typography>
        <Box display="flex" gap={1} mb={2}>
          <TextField
            label="Add Tag"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
          />
          <Button onClick={addTag} variant="outlined">
            Add
          </Button>
        </Box>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {tags.map((tag, index) => (
            <Chip
              key={index}
              label={tag}
              onDelete={() => removeTag(tag)}
              color="primary"
            />
          ))}
        </Box>

        {/* Actions */}
        <Box display="flex" gap={2} justifyContent="flex-end" sx={{ mt: 4 }}>
          <Button onClick={onCancel} variant="outlined">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Saving...' : recipe ? 'Update Recipe' : 'Create Recipe'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};
