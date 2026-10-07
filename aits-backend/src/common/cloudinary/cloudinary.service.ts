import { Injectable, Logger } from '@nestjs/common';
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary';

export interface CloudinaryUploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  format?: string;
  width?: number;
  height?: number;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private isConfigured = false;

  constructor() {
    this.initCloudinary();
  }

  private initCloudinary() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      this.isConfigured = true;
      this.logger.log(
        `Cloudinary initialized successfully (Cloud: ${cloudName}, Key: ${apiKey.slice(0, 6)}...)`,
      );
    } else {
      this.isConfigured = false;
      this.logger.error(
        'Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are missing or invalid in .env.',
      );
    }
  }

  /**
   * Uploads an image (base64 string, URL, or Buffer) strictly to Cloudinary API
   */
  async uploadImage(
    fileInput: string | Buffer,
    folder = 'aits/animals',
  ): Promise<CloudinaryUploadResult> {
    if (!this.isConfigured) {
      throw new Error(
        'Cloudinary is not configured. Please provide valid CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env.',
      );
    }

    try {
      if (typeof fileInput === 'string') {
        // Handle Base64 Data URL or HTTP URL
        const result: UploadApiResponse = await cloudinary.uploader.upload(
          fileInput,
          {
            folder,
            resource_type: 'image',
            transformation: [{ quality: 'auto', fetch_format: 'auto' }],
          },
        );

        this.logger.log(
          `Image uploaded to Cloudinary: ${result.public_id} (${result.secure_url})`,
        );

        return {
          url: result.url,
          secureUrl: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
        };
      } else {
        // Handle Buffer upload via stream
        return await new Promise<CloudinaryUploadResult>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder,
              resource_type: 'image',
              transformation: [{ quality: 'auto', fetch_format: 'auto' }],
            },
            (
              error: UploadApiErrorResponse | undefined,
              result: UploadApiResponse | undefined,
            ) => {
              if (error || !result) {
                this.logger.error(
                  `Cloudinary buffer stream upload failed: ${error?.message || 'Unknown error'}`,
                );
                return reject(
                  new Error(
                    error?.message || 'Cloudinary upload returned empty result',
                  ),
                );
              }

              this.logger.log(
                `Buffer image uploaded to Cloudinary: ${result.public_id}`,
              );

              resolve({
                url: result.url,
                secureUrl: result.secure_url,
                publicId: result.public_id,
                format: result.format,
                width: result.width,
                height: result.height,
              });
            },
          );

          uploadStream.end(fileInput);
        });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Cloudinary upload failed: ${errorMsg}`);
      throw new Error(`Cloudinary upload failed: ${errorMsg}`);
    }
  }

  /**
   * Delete an image from Cloudinary by public ID
   */
  async deleteImage(publicId: string): Promise<boolean> {
    if (!this.isConfigured || !publicId || publicId.startsWith('local-')) {
      return true;
    }

    try {
      await cloudinary.uploader.destroy(publicId);
      this.logger.log(`Image deleted from Cloudinary: ${publicId}`);
      return true;
    } catch (err: unknown) {
      this.logger.warn(
        `Failed to delete image from Cloudinary: ${String(err)}`,
      );
      return false;
    }
  }
}
