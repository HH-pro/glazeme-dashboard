// src/services/cloudinary.ts
export const cloudinaryConfig = {
  cloudName: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'your-cloud-name',
  uploadPreset: process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || 'your-upload-preset',
  apiKey: process.env.REACT_APP_CLOUDINARY_API_KEY,
  folder: 'glazeme-development'
};

export const uploadToCloudinary = async (file: File, folder: string = 'glazeme-development'): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', cloudinaryConfig.uploadPreset);
  formData.append('folder', folder);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`, {
    method: 'POST',
    body: formData
  });

  return response.json();
};