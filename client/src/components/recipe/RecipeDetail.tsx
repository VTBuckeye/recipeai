import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Grid,
  Button,
  IconButton,
  Divider,
  ImageList,
  ImageListItem,
  Dialog,
  DialogContent
} from '@mui/material';
import {
  Print,
  Edit,
  Delete,
  Share,
  Lock,
  Public,
  Close
} from '@mui/icons-material';
import { Recipe } from '../../types';
import { useNavigate } from 'react-router-dom';

interface RecipeDetailProps {
  recipe: Recipe;
  isOwner: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const RecipeDetail: React.FC<RecipeDetailProps> = ({
  recipe,
  isOwner,
  onEdit,
  onDelete
}) => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPrintMode, setIsPrintMode] = useState(false);

  const handlePrint = () => {
    setIsPrintMode(true);
    setTimeout(() => {
      window.print();
      setIsPrintMode(false);
    }, 100);
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: recipe.title,
        text: recipe.description,
        url: url
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Recipe link copied to clipboard!');
    }
  };

  return (
    <>
      <style>
        {`
          @media print {
            .no-print {
              display: none !important;
            }
            .print-friendly {
              max-width: 100% !important;
              padding: 20px !important;
            }
          }
        `}
      </style>

      <Box className={isPrintMode ? 'print-friendly' : ''}>
        {/* Header Actions */}
        <Box className="no-print" display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Recipe Details
          </Typography>
          <Box display="flex" gap={1}>
            <Button startIcon={<Print />} onClick={handlePrint} variant="outlined">
              Print
            </Button>
            {recipe.isPublic && (
              <Button startIcon={<Share />} onClick={handleShare} variant="outlined">
                Share
              </Button>
            )}
            {isOwner && (
              <>
                <Button startIcon={<Edit />} onClick={onEdit} variant="outlined" color="primary">
                  Edit
                </Button>
                <Button startIcon={<Delete />} onClick={onDelete} variant="outlined" color="error">
                  Delete
                </Button>
              </>
            )}
          </Box>
        </Box>

        {/* Recipe Content */}
        <Paper sx={{ p: 4 }}>
          {/* Title and Status */}
          <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
            <Typography variant="h3" component="h2" gutterBottom>
              {recipe.title}
            </Typography>
            {recipe.isPublic ? (
              <Chip icon={<Public />} label="Public" color="primary" />
            ) : (
              <Chip icon={<Lock />} label="Private" />
            )}
          </Box>

          <Typography variant="body1" color="text.secondary" paragraph>
            {recipe.description}
          </Typography>

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <Box display="flex" flexWrap="wrap" gap={1} mb={3}>
              {recipe.tags.map((tag, index) => (
                <Chip key={index} label={tag} size="small" variant="outlined" />
              ))}
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Recipe Images */}
          {recipe.images && recipe.images.length > 0 && (
            <Box mb={4}>
              <Typography variant="h5" gutterBottom>
                Photos
              </Typography>
              <ImageList cols={3} gap={8}>
                {recipe.images.map((image, index) => (
                  <ImageListItem
                    key={index}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => setSelectedImage(image)}
                  >
                    <img
                      src={image}
                      alt={`${recipe.title} ${index + 1}`}
                      loading="lazy"
                      style={{ borderRadius: 8, objectFit: 'cover', height: 200 }}
                    />
                  </ImageListItem>
                ))}
              </ImageList>
            </Box>
          )}

          {/* Ingredients */}
          <Box mb={4}>
            <Typography variant="h5" gutterBottom>
              Ingredients
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {recipe.ingredients.length} ingredients
            </Typography>
            <Box component="ul" sx={{ pl: 2 }}>
              {recipe.ingredients.map((ingredient, index) => (
                <Box component="li" key={index} sx={{ mb: 1 }}>
                  <Typography variant="body1">
                    {ingredient.quantity} {ingredient.unit} {ingredient.name}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Instructions */}
          <Box>
            <Typography variant="h5" gutterBottom>
              Instructions
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {recipe.instructions.length} steps
            </Typography>
            {recipe.instructions.map((step, index) => (
              <Paper
                key={index}
                elevation={1}
                sx={{ p: 2, mb: 2, backgroundColor: 'grey.50' }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box display="flex" gap={2}>
                      <Typography
                        variant="h6"
                        color="primary"
                        sx={{ minWidth: 40 }}
                      >
                        {step.stepNumber}.
                      </Typography>
                      <Typography variant="body1" sx={{ flexGrow: 1 }}>
                        {step.instruction}
                      </Typography>
                    </Box>
                  </Grid>
                  {step.imageUrl && (
                    <Grid item xs={12}>
                      <Box
                        component="img"
                        src={step.imageUrl}
                        alt={`Step ${step.stepNumber}`}
                        sx={{
                          width: '100%',
                          maxWidth: 400,
                          height: 'auto',
                          borderRadius: 1,
                          cursor: 'pointer'
                        }}
                        onClick={() => setSelectedImage(step.imageUrl || null)}
                      />
                    </Grid>
                  )}
                </Grid>
              </Paper>
            ))}
          </Box>

          {/* Metadata */}
          <Divider sx={{ my: 3 }} />
          <Box display="flex" gap={3}>
            <Typography variant="caption" color="text.secondary">
              Created: {new Date(recipe.createdAt).toLocaleDateString()}
            </Typography>
            {recipe.updatedAt && recipe.updatedAt !== recipe.createdAt && (
              <Typography variant="caption" color="text.secondary">
                Last updated: {new Date(recipe.updatedAt).toLocaleDateString()}
              </Typography>
            )}
          </Box>
        </Paper>
      </Box>

      {/* Image Viewer Dialog */}
      <Dialog
        open={selectedImage !== null}
        onClose={() => setSelectedImage(null)}
        maxWidth="lg"
        className="no-print"
      >
        <IconButton
          sx={{ position: 'absolute', right: 8, top: 8, zIndex: 1 }}
          onClick={() => setSelectedImage(null)}
        >
          <Close />
        </IconButton>
        <DialogContent>
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Full size"
              style={{ width: '100%', height: 'auto' }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
