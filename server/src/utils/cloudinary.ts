import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || 'demo',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'demo',
  secure: true,
});

export interface CloudinaryUploadResult {
  url: string;
}

export function uploadImageToCloudinary(fileBuffer: Buffer, folder: string): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'image', folder },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Image upload failed'));
        } else {
          resolve({ url: result.secure_url });
        }
      }
    );
    uploadStream.end(fileBuffer);
  });
}

export { cloudinary };
