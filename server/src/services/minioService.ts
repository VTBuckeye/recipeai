import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env';
import logger from '../utils/logger';

class MinioService {
  private client: Minio.Client;
  private bucketName: string;

  constructor() {
    this.bucketName = config.MINIO_BUCKET_NAME;
    this.client = new Minio.Client({
      endPoint: config.MINIO_ENDPOINT,
      port: config.MINIO_PORT,
      useSSL: config.MINIO_USE_SSL,
      accessKey: config.MINIO_ACCESS_KEY,
      secretKey: config.MINIO_SECRET_KEY,
    });

    this.initializeBucket();
  }

  private async initializeBucket(): Promise<void> {
    try {
      const exists = await this.client.bucketExists(this.bucketName);
      if (!exists) {
        await this.client.makeBucket(this.bucketName, 'us-east-1');
        logger.info(`MinIO bucket created: ${this.bucketName}`);

        // Set bucket policy to allow public read access for images
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucketName}/*`],
            },
          ],
        };
        await this.client.setBucketPolicy(this.bucketName, JSON.stringify(policy));
      } else {
        logger.info(`MinIO bucket already exists: ${this.bucketName}`);
      }
    } catch (error) {
      logger.error('Error initializing MinIO bucket:', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Upload a file to MinIO
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'general'
  ): Promise<{ url: string; filename: string }> {
    try {
      const fileExtension = file.originalname.split('.').pop();
      const filename = `${folder}/${uuidv4()}.${fileExtension}`;
      const metadata = {
        'Content-Type': file.mimetype,
        'X-Original-Name': file.originalname,
      };

      await this.client.putObject(
        this.bucketName,
        filename,
        file.buffer,
        file.size,
        metadata
      );

      const url = await this.getFileUrl(filename);

      logger.info('File uploaded successfully', {
        filename,
        originalName: file.originalname,
        size: file.size,
      });

      return { url, filename };
    } catch (error) {
      logger.error('Error uploading file to MinIO:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        originalName: file.originalname,
      });
      throw new Error('Failed to upload file');
    }
  }

  /**
   * Get file URL
   */
  async getFileUrl(filename: string): Promise<string> {
    try {
      const protocol = config.MINIO_USE_SSL ? 'https' : 'http';
      const port = config.MINIO_PORT === 80 || config.MINIO_PORT === 443 ? '' : `:${config.MINIO_PORT}`;
      // Use public endpoint for browser-accessible URLs
      const endpoint = config.MINIO_PUBLIC_ENDPOINT || config.MINIO_ENDPOINT;
      return `${protocol}://${endpoint}${port}/${this.bucketName}/${filename}`;
    } catch (error) {
      logger.error('Error getting file URL:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        filename,
      });
      throw new Error('Failed to get file URL');
    }
  }

  /**
   * Delete a file from MinIO
   */
  async deleteFile(filename: string): Promise<void> {
    try {
      await this.client.removeObject(this.bucketName, filename);
      logger.info('File deleted successfully', { filename });
    } catch (error) {
      logger.error('Error deleting file from MinIO:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        filename,
      });
      throw new Error('Failed to delete file');
    }
  }

  /**
   * Delete multiple files from MinIO
   */
  async deleteFiles(filenames: string[]): Promise<void> {
    try {
      await this.client.removeObjects(this.bucketName, filenames);
      logger.info('Files deleted successfully', { count: filenames.length });
    } catch (error) {
      logger.error('Error deleting files from MinIO:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        count: filenames.length,
      });
      throw new Error('Failed to delete files');
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(filename: string): Promise<boolean> {
    try {
      await this.client.statObject(this.bucketName, filename);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default new MinioService();
