import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || 'demo',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'demo',
  secure: true,
});

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

export function uploadImageToCloudinary(fileBuffer: Buffer, folder: string): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured()) {
      reject(
        new Error(
          'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env'
        )
      );
      return;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'image', folder },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Image upload failed'));
        } else {
            resolve({ url: result.secure_url, publicId: result.public_id });
        }
      }
    );
    uploadStream.end(fileBuffer);
  });
}

export async function deleteImageFromCloudinary(publicId: string): Promise<void> {
  if (!publicId || !isCloudinaryConfigured()) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary destroy failed:', publicId, error);
  }
}

export function extractCloudinaryPublicId(url: string): string {
  try {
    const parsed = new URL(url);
    const marker = '/upload/';
    const idx = parsed.pathname.indexOf(marker);
    if (idx === -1) return '';
    let rest = parsed.pathname.slice(idx + marker.length);
    rest = rest.replace(/^v\d+\//, '');
    rest = rest.replace(/\.[^/.]+$/, '');
    return decodeURIComponent(rest);
  } catch {
    return '';
  }
}

export { cloudinary };
