import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardMedia,
  CardActions,
  Grid,
  Typography
} from '@mui/material';
import { CloudUpload, Delete } from '@mui/icons-material';

interface ImageUploadProps {
  images: File[];
  existingImages?: string[];
  onImagesChange: (images: File[]) => void;
  onExistingImageRemove?: (imageUrl: string) => void;
  maxImages?: number;
  maxSizeMB?: number;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  existingImages = [],
  onImagesChange,
  onExistingImageRemove,
  maxImages = 10,
  maxSizeMB = 1
}) => {
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    const totalImages = images.length + existingImages.length + files.length;

    // Check max images
    if (totalImages > maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Check file sizes
    const oversizedFiles = files.filter(file => file.size > maxSizeMB * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError(`All images must be less than ${maxSizeMB}MB`);
      return;
    }

    // Check file types
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      setError('Only image files are allowed');
      return;
    }

    onImagesChange([...images, ...files]);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const canAddMore = images.length + existingImages.length < maxImages;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle1">
          Images ({images.length + existingImages.length}/{maxImages})
        </Typography>
        {canAddMore && (
          <Button
            variant="outlined"
            component="label"
            startIcon={<CloudUpload />}
            size="small"
          >
            Upload
            <input
              type="file"
              hidden
              multiple
              accept="image/*"
              onChange={handleFileChange}
            />
          </Button>
        )}
      </Box>

      {error && (
        <Typography variant="body2" color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Grid container spacing={2}>
        {existingImages.map((imageUrl, index) => (
          <Grid item xs={12} sm={6} md={4} key={`existing-${index}`}>
            <Card>
              <CardMedia
                component="img"
                height="150"
                image={imageUrl}
                alt={`Existing ${index + 1}`}
                sx={{ objectFit: 'cover' }}
              />
              <CardActions>
                {onExistingImageRemove && (
                  <Button
                    size="small"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => onExistingImageRemove(imageUrl)}
                  >
                    Remove
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
        {images.map((file, index) => (
          <Grid item xs={12} sm={6} md={4} key={`new-${index}`}>
            <Card>
              <CardMedia
                component="img"
                height="150"
                image={URL.createObjectURL(file)}
                alt={file.name}
                sx={{ objectFit: 'cover' }}
              />
              <CardActions>
                <Button
                  size="small"
                  color="error"
                  startIcon={<Delete />}
                  onClick={() => handleRemoveImage(index)}
                >
                  Remove
                </Button>
                <Typography variant="caption" sx={{ ml: 'auto' }}>
                  {(file.size / 1024).toFixed(0)} KB
                </Typography>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        Max {maxImages} images, {maxSizeMB}MB each
      </Typography>
    </Box>
  );
};
