import { Request, Response, NextFunction } from 'express';
import { moderateImage, isImageFile } from '../services/contentModerationService';
import logger from '../utils/logger';
import { Counter } from 'prom-client';
import { register } from '../utils/metrics';

// Metrics for content moderation
const contentModerationTotal = new Counter({
  name: 'content_moderation_total',
  help: 'Total number of content moderation checks',
  labelNames: ['result', 'reason'],
  registers: [register],
});

const contentModerationRejected = new Counter({
  name: 'content_moderation_rejected_total',
  help: 'Total number of rejected uploads',
  labelNames: ['reason'],
  registers: [register],
});

/**
 * Middleware to validate uploaded images for inappropriate content
 * This should be used after multer middleware
 * Supports both single file (req.file) and multiple files (req.files)
 */
export const validateImageContent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get files from request
    const files: Express.Multer.File[] = [];

    if (req.file) {
      files.push(req.file);
    }

    if (req.files) {
      if (Array.isArray(req.files)) {
        files.push(...req.files);
      } else {
        // Handle object with field names as keys
        Object.values(req.files).forEach((fileArray) => {
          if (Array.isArray(fileArray)) {
            files.push(...fileArray);
          }
        });
      }
    }

    // If no files, continue
    if (files.length === 0) {
      next();
      return;
    }

    // Validate each file
    for (const file of files) {

      // Check if it's an image
      if (!isImageFile(file.mimetype)) {
        logger.debug('Non-image file uploaded, skipping moderation', {
          service: 'content-moderation',
          mimetype: file.mimetype,
          filename: file.originalname,
        });
        continue;
      }

      logger.info('Moderating uploaded image', {
        service: 'content-moderation',
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      });

      // Moderate the image
      const result = await moderateImage(file.buffer);

      // Track metrics
      contentModerationTotal.labels(
        result.isAppropriate ? 'approved' : 'rejected',
        result.flaggedReasons[0] || 'none'
      ).inc();

      if (!result.isAppropriate) {
        // Track rejection
        result.flaggedReasons.forEach((reason) => {
          contentModerationRejected.labels(reason).inc();
        });

        logger.warn('Image rejected due to inappropriate content', {
          service: 'content-moderation',
          filename: file.originalname,
          reasons: result.flaggedReasons,
          confidence: result.confidence,
        });

        res.status(400).json({
          error: 'Inappropriate content detected',
          message: `The uploaded image "${file.originalname}" contains inappropriate content and cannot be accepted.`,
          details: result.flaggedReasons,
        });
        return;
      }

      logger.info('Image approved', {
        service: 'content-moderation',
        filename: file.originalname,
        confidence: result.confidence,
      });
    }

    // All images are appropriate, continue to next middleware
    next();
  } catch (error) {
    logger.error('Error during content moderation', {
      service: 'content-moderation',
      error: error instanceof Error ? error.message : 'Unknown error',
      filename: req.file?.originalname,
    });

    // On error, we'll allow the upload but log it for manual review
    // You can change this behavior to reject on error if preferred
    logger.warn('Content moderation failed, allowing upload for manual review', {
      service: 'content-moderation',
      filename: req.file?.originalname,
    });

    contentModerationTotal.labels('error', 'moderation_failure').inc();
    next();
  }
};
