// src/services/cloudinary.ts

export const cloudinaryConfig = {
  cloudName: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'dtrfeoonx',
  uploadPreset: process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || 'glazeme',
  apiKey: process.env.REACT_APP_CLOUDINARY_API_KEY,
  folder: 'glazeme-development'
};

export interface CloudinaryUploadResult {
  asset_id: string;
  public_id: string;
  version: number;
  version_id: string;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  folder: string;
  original_filename: string;
  api_key: string;
}

export const uploadToCloudinary = async (
  file: File, 
  folder: string = 'glazeme-development',
  onProgress?: (progress: number) => void
): Promise<CloudinaryUploadResult> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', cloudinaryConfig.uploadPreset);
  formData.append('folder', folder);

  // Use XMLHttpRequest for progress tracking if onProgress is provided
  if (onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          onProgress(percentComplete);
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Failed to parse Cloudinary response'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Network error occurred during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload was aborted'));
      });

      // Open and send the request
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`);
      xhr.send(formData);
    });
  } 
  // Use fetch for simpler cases without progress tracking
  else {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }

    return response.json();
  }
};

// Helper function to get optimized image URL
export const getOptimizedCloudinaryUrl = (
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: number | string;
    format?: string;
    effects?: string[];
  } = {}
): string => {
  const { 
    width, 
    height, 
    crop = 'fill', 
    quality = 'auto', 
    format = 'auto',
    effects = [] 
  } = options;
  
  let transformations: string[] = [];
  
  // Add effects first (like filters, adjustments)
  if (effects.length > 0) {
    transformations.push(...effects);
  }
  
  // Add size transformations
  if (width && height) {
    transformations.push(`c_${crop},w_${width},h_${height}`);
  } else if (width) {
    transformations.push(`w_${width}`);
  } else if (height) {
    transformations.push(`h_${height}`);
  }
  
  // Add quality and format
  transformations.push(`q_${quality}`);
  transformations.push(`f_${format}`);
  
  const transformationString = transformations.join(',');
  
  return `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload/${transformationString}/${publicId}`;
};

// Helper function to delete images (requires server-side implementation)
export const deleteFromCloudinary = async (publicId: string): Promise<boolean> => {
  // Note: Cloudinary deletion requires API secret and should be done server-side
  // This is a placeholder that logs a warning
  console.warn('Cloudinary deletion should be implemented server-side for security');
  console.log(`Requested deletion of: ${publicId}`);
  
  // You could call your own backend endpoint here
  // const response = await fetch('/api/cloudinary/delete', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ publicId })
  // });
  // return response.ok;
  
  return false;
};

// Helper function to generate a thumbnail URL
export const getThumbnailUrl = (publicId: string, size: number = 150): string => {
  return getOptimizedCloudinaryUrl(publicId, {
    width: size,
    height: size,
    crop: 'thumb',
    quality: 80,
    format: 'jpg'
  });
};

// Helper function to extract public ID from full Cloudinary URL
export const extractPublicIdFromUrl = (url: string): string | null => {
  try {
    const urlParts = url.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    if (uploadIndex === -1) return null;
    
    // Skip version part if it exists (starts with v)
    let publicIdPart = urlParts[uploadIndex + 2];
    if (publicIdPart && publicIdPart.startsWith('v')) {
      publicIdPart = urlParts[uploadIndex + 3];
    }
    
    // Remove file extension
    return publicIdPart?.replace(/\.[^/.]+$/, '') || null;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};