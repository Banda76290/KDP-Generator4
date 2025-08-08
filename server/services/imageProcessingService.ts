import sharp from 'sharp';

export class ImageProcessingService {
  
  /**
   * Process author image: convert to PNG and ensure minimum 300px dimensions
   * @param imageBuffer Original image buffer
   * @param originalFilename Original filename for extension detection
   * @returns Processed image buffer as PNG
   */
  static async processAuthorImage(imageBuffer: Buffer, originalFilename: string) {
    try {
      // Validate file type
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
      const fileExtension = originalFilename.substring(originalFilename.lastIndexOf('.')).toLowerCase();
      
      if (allowedExtensions.indexOf(fileExtension) === -1) {
        throw new Error('Invalid file type. Only JPEG, PNG, and GIF files are allowed.');
      }

      // Get original image metadata
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();
      
      if (!metadata.width || !metadata.height) {
        throw new Error('Unable to determine image dimensions.');
      }

      // Calculate new dimensions maintaining aspect ratio
      // Both width and height must be at least 300px
      const minDimension = 300;
      let newWidth = metadata.width;
      let newHeight = metadata.height;

      if (metadata.width < minDimension || metadata.height < minDimension) {
        // Scale up if either dimension is less than 300px
        const scaleFactorWidth = minDimension / metadata.width;
        const scaleFactorHeight = minDimension / metadata.height;
        
        // Use the larger scale factor to ensure both dimensions meet minimum
        const scaleFactor = scaleFactorWidth > scaleFactorHeight ? scaleFactorWidth : scaleFactorHeight;
        
        newWidth = Math.round(metadata.width * scaleFactor);
        newHeight = Math.round(metadata.height * scaleFactor);
      }

      // Process the image: resize and convert to PNG
      const processedBuffer = await image
        .resize(newWidth, newHeight, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 } // White background for transparency
        })
        .png({
          quality: 90,
          compressionLevel: 9,
          progressive: true
        })
        .toBuffer();

      return processedBuffer;
    } catch (error: any) {
      console.error('Error processing author image:', error);
      throw new Error(`Image processing failed: ${error && error.message ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate image file before processing
   * @param file Uploaded file
   * @returns Boolean indicating if file is valid
   */
  static validateImageFile(file: any): { isValid: boolean; error?: string } {
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { isValid: false, error: 'File size too large. Maximum size is 10MB.' };
    }

    // Check mime type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedMimeTypes.indexOf(file.mimetype) === -1) {
      return { isValid: false, error: 'Invalid file type. Only JPEG, PNG, and GIF files are allowed.' };
    }

    return { isValid: true };
  }
}