// src/components/ScreenGallery.tsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { AdvancedImage } from '@cloudinary/react';
import { Cloudinary } from '@cloudinary/url-gen';
import { fill } from '@cloudinary/url-gen/actions/resize';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { uploadToCloudinary } from '../services/cloudinary';
import { ScreenCapture } from '../types';

interface Props {
  screens: ScreenCapture[];
}

const ScreenGallery: React.FC<Props> = ({ screens }) => {
  const [uploading, setUploading] = useState(false);
  const [selectedScreen, setSelectedScreen] = useState<ScreenCapture | null>(null);

  const cld = new Cloudinary({
    cloud: {
      cloudName: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME
    }
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    try {
      for (const file of acceptedFiles) {
        // Upload to Cloudinary
        const result = await uploadToCloudinary(file, 'glazeme-screens');
        
        // Save to Firestore with Cloudinary data
        await addDoc(collection(db, 'screenshots'), {
          date: new Date(),
          screenName: prompt(`Enter name for ${file.name}:`),
          imageUrl: result.secure_url,
          cloudinaryId: result.public_id,
          description: prompt('Enter description:'),
          buildVersion: 'v1.0.0',
          componentName: file.name.replace('.png', '').replace('.jpg', ''),
          filePath: `src/components/${file.name}`,
          tags: ['ios', 'swiftui', 'imessage'],
          dimensions: {
            width: result.width,
            height: result.height
          },
          format: result.format,
          size: result.bytes
        });
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
    setUploading(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    }
  });

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h2 style={styles.sectionTitle}>📱 Screen-by-Screen Development</h2>
          <p style={styles.subtitle}>
            {screens.length} screens built • Last update: {screens[0]?.date ? new Date(screens[0].date).toLocaleString() : 'Never'}
          </p>
        </div>
        <div {...getRootProps()} style={styles.uploadArea}>
          <input {...getInputProps()} />
          {uploading ? (
            <div style={styles.uploading}>⏫ Uploading to Cloudinary...</div>
          ) : isDragActive ? (
            <div style={styles.dragActive}>📸 Drop screenshots here</div>
          ) : (
            <div style={styles.uploadButton}>+ Add Screens</div>
          )}
        </div>
      </div>

      {/* Screen Grid with Cloudinary images */}
      <div style={styles.gallery}>
        {screens.map((screen) => {
          const myImage = cld.image(screen.cloudinaryId);
          myImage.resize(fill().width(400).height(300));

          return (
            <div 
              key={screen.id} 
              style={styles.card}
              onClick={() => setSelectedScreen(screen)}
            >
              <div style={styles.imageContainer}>
                <AdvancedImage cldImg={myImage} style={styles.image} />
                <div style={styles.imageOverlay}>
                  <span style={styles.viewDetails}>Click to view details</span>
                </div>
              </div>
              <div style={styles.cardContent}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.screenName}>{screen.screenName}</h3>
                  <span style={styles.version}>{screen.buildVersion}</span>
                </div>
                <p style={styles.screenDesc}>{screen.description}</p>
                <div style={styles.meta}>
                  <span style={styles.componentName}>{screen.componentName}</span>
                  <span style={styles.date}>
                    {new Date(screen.date).toLocaleDateString()}
                  </span>
                </div>
                <div style={styles.tags}>
                  {screen.tags?.map(tag => (
                    <span key={tag} style={styles.tag}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Screen Detail Modal */}
      {selectedScreen && (
        <div style={styles.modal} onClick={() => setSelectedScreen(null)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={() => setSelectedScreen(null)}>×</button>
            <AdvancedImage 
              cldImg={cld.image(selectedScreen.cloudinaryId).resize(fill().width(800).height(600))} 
              style={styles.modalImage}
            />
            <div style={styles.modalInfo}>
              <h2>{selectedScreen.screenName}</h2>
              <p>{selectedScreen.description}</p>
              <pre style={styles.codeBlock}>
                {`// File: ${selectedScreen.filePath}
// Built: ${new Date(selectedScreen.date).toLocaleString()}
// Version: ${selectedScreen.buildVersion}
// Cloudinary ID: ${selectedScreen.cloudinaryId}`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '25px'
  },
  sectionTitle: {
    fontSize: '22px',
    margin: '0 0 5px 0',
    color: '#333'
  },
  subtitle: {
    fontSize: '13px',
    color: '#6c757d',
    margin: 0
  },
  uploadArea: {
    cursor: 'pointer'
  },
  uploadButton: {
    padding: '10px 20px',
    backgroundColor: '#FF8C42',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500'
  },
  uploadButtonHover: {
    backgroundColor: '#e67e22'
  },
  uploading: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    borderRadius: '8px'
  },
  dragActive: {
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    borderRadius: '8px'
  },
  gallery: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    cursor: 'pointer',
    transition: 'transform 0.2s, boxShadow 0.2s',
    border: '1px solid #eee'
  },
  imageContainer: {
    position: 'relative' as const,
    height: '200px',
    overflow: 'hidden'
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const
  },
  imageOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.2s',
    color: 'white',
    fontSize: '14px'
  },
  viewDetails: {
    padding: '8px 16px',
    backgroundColor: '#FF8C42',
    borderRadius: '20px'
  },
  cardContent: {
    padding: '15px'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  screenName: {
    fontSize: '16px',
    margin: 0,
    color: '#333',
    fontWeight: '600'
  },
  version: {
    padding: '2px 6px',
    backgroundColor: '#e9ecef',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#495057'
  },
  screenDesc: {
    fontSize: '13px',
    color: '#666',
    margin: '0 0 10px 0',
    lineHeight: '1.4'
  },
  meta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    fontSize: '12px'
  },
  componentName: {
    color: '#007bff',
    fontFamily: 'monospace'
  },
  date: {
    color: '#999'
  },
  tags: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap' as 'wrap'
  },
  tag: {
    padding: '2px 8px',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    fontSize: '11px',
    color: '#495057',
    border: '1px solid #dee2e6'
  },
  modal: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '12px',
    maxWidth: '1000px',
    maxHeight: '90vh',
    overflow: 'auto',
    position: 'relative' as const
  },
  modalClose: {
    position: 'absolute' as const,
    top: '10px',
    right: '10px',
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#ff4444',
    color: 'white',
    fontSize: '20px',
    cursor: 'pointer',
    zIndex: 1
  },
  modalImage: {
    width: '100%',
    maxHeight: '500px',
    objectFit: 'contain' as const
  },
  modalInfo: {
    padding: '20px'
  },
  codeBlock: {
    backgroundColor: '#1e1e1e',
    color: '#d4d4d4',
    padding: '15px',
    borderRadius: '8px',
    fontFamily: 'monospace',
    fontSize: '13px',
    lineHeight: '1.5',
    overflowX: 'auto' as const
  }
};

export default ScreenGallery;