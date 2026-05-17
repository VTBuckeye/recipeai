// @ts-ignore
import * as tf from '@tensorflow/tfjs-node';
// @ts-ignore
import sharp from 'sharp';
import path from 'path';
import logger from '../utils/logger';

interface NSFWPrediction {
  className: string;
  probability: number;
}

interface ModerationResult {
  isAppropriate: boolean;
  predictions: NSFWPrediction[];
  flaggedReasons: string[];
  confidence: number;
}

// TensorFlow.js model for NSFW detection
let tfModel: tf.LayersModel | null = null;

/**
 * Initialize the NSFW.js model
 */
export const initializeModel = async (): Promise<void> => {
  try {
    if (!tfModel) {
      logger.info('Loading NSFW.js model...', { service: 'content-moderation' });

      // Load model from local files using TensorFlow.js
      // The CloudFront CDN is no longer available, so we host the model locally
      const modelPath = path.join(process.cwd(), 'public', 'models', 'mobilenet_v2', 'model.json');

      logger.info('Loading model from path', {
        service: 'content-moderation',
        modelPath
      });

      // Load the TensorFlow model directly
      tfModel = await tf.loadLayersModel(`file://${modelPath}`);

      logger.info('NSFW.js model loaded successfully', {
        service: 'content-moderation',
        source: modelPath,
      });
    }
  } catch (error) {
    logger.error('Failed to load NSFW.js model', {
      service: 'content-moderation',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
};

/**
 * Classify an image tensor using the loaded model
 */
const classifyImage = async (tensor: tf.Tensor3D): Promise<NSFWPrediction[]> => {
  if (!tfModel) {
    throw new Error('Model not initialized');
  }

  // Normalize and prepare the tensor
  const normalized = tf.tidy(() => {
    const batched = tensor.expandDims(0);
    return batched.toFloat().div(127.5).sub(1);
  });

  // Run prediction
  const predictions = await tfModel.predict(normalized) as tf.Tensor;
  const probabilities = await predictions.data();

  // Clean up
  normalized.dispose();
  predictions.dispose();

  // Map to class names (MobileNetV2 model)
  const classes = ['Drawing', 'Hentai', 'Neutral', 'Porn', 'Sexy'];
  return classes.map((className, i) => ({
    className,
    probability: probabilities[i]
  }));
};

/**
 * Moderate image content using NSFW.js
 *
 * NSFW.js classifies images into 5 categories:
 * - Drawing: Safe drawings/illustrations
 * - Hentai: Explicit anime/cartoon content
 * - Neutral: Safe, neutral content
 * - Porn: Explicit pornographic content
 * - Sexy: Suggestive/sexy content
 *
 * @param imageBuffer - Buffer containing the image data
 * @param thresholds - Custom thresholds for inappropriate content (default: porn=0.6, sexy=0.8, hentai=0.6)
 * @returns ModerationResult indicating if content is appropriate
 */
export const moderateImage = async (
  imageBuffer: Buffer,
  thresholds = { porn: 0.6, sexy: 0.8, hentai: 0.6 }
): Promise<ModerationResult> => {
  try {
    // Ensure model is loaded
    if (!tfModel) {
      await initializeModel();
      if (!tfModel) {
        throw new Error('Failed to initialize NSFW model');
      }
    }

    // Convert image to RGB format and resize if needed
    const processedImage = await sharp(imageBuffer)
      .resize(224, 224, { fit: 'cover' })
      .toFormat('jpeg')
      .toBuffer();

    // Decode image to tensor
    const imageTensor = tf.node.decodeImage(processedImage, 3) as tf.Tensor3D;

    // Get predictions
    const predictions = await classifyImage(imageTensor);
    imageTensor.dispose(); // Clean up tensor

    // Log predictions for debugging
    logger.debug('Image moderation predictions', {
      service: 'content-moderation',
      predictions,
    });

    // Analyze predictions
    const pornScore = predictions.find((p: any) => p.className === 'Porn')?.probability || 0;
    const sexyScore = predictions.find((p: any) => p.className === 'Sexy')?.probability || 0;
    const hentaiScore = predictions.find((p: any) => p.className === 'Hentai')?.probability || 0;
    const neutralScore = predictions.find((p: any) => p.className === 'Neutral')?.probability || 0;
    const drawingScore = predictions.find((p: any) => p.className === 'Drawing')?.probability || 0;

    const flaggedReasons: string[] = [];
    let isAppropriate = true;

    // Check against thresholds
    if (pornScore > thresholds.porn) {
      flaggedReasons.push(`Pornographic content detected (${(pornScore * 100).toFixed(1)}%)`);
      isAppropriate = false;
    }

    if (sexyScore > thresholds.sexy) {
      flaggedReasons.push(`Sexually suggestive content detected (${(sexyScore * 100).toFixed(1)}%)`);
      isAppropriate = false;
    }

    if (hentaiScore > thresholds.hentai) {
      flaggedReasons.push(`Explicit animated content detected (${(hentaiScore * 100).toFixed(1)}%)`);
      isAppropriate = false;
    }

    // Calculate overall confidence (highest score from inappropriate categories vs neutral/drawing)
    const inappropriateScore = Math.max(pornScore, sexyScore, hentaiScore);
    const appropriateScore = Math.max(neutralScore, drawingScore);
    const confidence = Math.max(inappropriateScore, appropriateScore);

    logger.info('Image moderation complete', {
      service: 'content-moderation',
      isAppropriate,
      confidence: confidence.toFixed(3),
      flaggedReasons,
      inappropriateScore
    });

    return {
      isAppropriate,
      predictions: predictions.map((p: any) => ({
        className: p.className,
        probability: p.probability,
      })),
      flaggedReasons,
      confidence,
    };
  } catch (error) {
    logger.error('Error moderating image', {
      service: 'content-moderation',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Check if an image file is appropriate based on file type
 */
export const isImageFile = (mimetype: string): boolean => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  return allowedTypes.includes(mimetype.toLowerCase());
};
