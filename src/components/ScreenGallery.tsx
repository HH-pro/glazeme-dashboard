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
  isEditMode?: boolean;
  onAddScreen?: () => void;
}

const ScreenGallery: React.FC<Props> = ({ screens, isEditMode = false, onAddScreen }) => {
  const [uploading, setUploading] = useState(false);
  const [selectedScreen, setSelectedScreen] = useState<ScreenCapture | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const cld = new Cloudinary({
    cloud: {
      cloudName: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'your-cloud-name'
    }
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!isEditMode && onAddScreen) {
      onAddScreen();
      return;
    }

    setUploading(true);
    try {
      for (const file of acceptedFiles) {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        
        // Upload to Cloudinary with progress tracking
        const result = await uploadToCloudinary(file, 'glazeme-screens', (progress) => {
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
        });
        
        // Get screen details via prompts
        const screenName = prompt(`Enter name for ${file.name}:`, file.name.replace(/\.[^/.]+$/, ""));
        if (!screenName) continue; // Skip if user cancels
        
        const description = prompt('Enter description for this screen:', '');
        
        // Save to Firestore with Cloudinary data
        await addDoc(collection(db, 'screenshots'), {
          date: new Date(),
          screenName: screenName,
          imageUrl: result.secure_url,
          cloudinaryId: result.public_id,
          description: description || 'No description provided',
          buildVersion: 'v1.0.0',
          componentName: file.name.replace(/\.[^/.]+$/, ''),
          filePath: `src/components/${file.name}`,
          tags: ['ios', 'swiftui', 'imessage', 'screen']
        });

        // Clear progress for this file
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[file.name];
          return newProgress;
        });
      }
      setShowUploadForm(false);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    }
    setUploading(false);
  }, [isEditMode, onAddScreen]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    disabled: !isEditMode
  });

  const handleAddClick = () => {
    if (!isEditMode && onAddScreen) {
      onAddScreen();
      return;
    }
    setShowUploadForm(true);
  };

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h2 style={styles.sectionTitle}>📱 Screen-by-Screen Development</h2>
          <p style={styles.subtitle}>
            {screens.length} screens built • Last update: {screens[0]?.date ? new Date(screens[0].date).toLocaleString() : 'Never'}
          </p>
        </div>
        <button 
          onClick={handleAddClick}
          style={{
            ...styles.uploadButton,
            backgroundColor: isEditMode ? '#FF8C42' : '#6c757d',
            cursor: isEditMode ? 'pointer' : 'not-allowed'
          }}
        >
          {isEditMode ? '+ Add Screens' : '🔒 Edit Mode Required'}
        </button>
      </div>

      {/* Edit Mode Indicator */}
      {isEditMode && !showUploadForm && (
        <div style={styles.editModeIndicator}>
          ✏️ Edit Mode Active - You can upload new screenshots
        </div>
      )}

      {/* Upload Area - Only visible when in edit mode and form is shown */}
      {isEditMode && showUploadForm && (
        <div style={styles.uploadSection}>
          <div style={styles.uploadHeader}>
            <h3 style={styles.uploadTitle}>Upload Screenshots</h3>
            <button 
              onClick={() => setShowUploadForm(false)}
              style={styles.closeButton}
            >
              ×
            </button>
          </div>
          
          <div {...getRootProps()} style={{
            ...styles.dropzone,
            ...(isDragActive ? styles.dropzoneActive : {}),
            ...(!isEditMode ? styles.dropzoneDisabled : {})
          }}>
            <input {...getInputProps()} />
            {uploading ? (
              <div style={styles.uploadingContainer}>
                <div style={styles.uploadingSpinner}>⏫</div>
                <div>Uploading to Cloudinary...</div>
                {Object.entries(uploadProgress).map(([fileName, progress]) => (
                  <div key={fileName} style={styles.progressItem}>
                    <span style={styles.progressFileName}>{fileName}</span>
                    <div style={styles.progressBarContainer}>
                      <div style={{...styles.progressBarFill, width: `${progress}%`}} />
                      <span style={styles.progressText}>{Math.round(progress)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : isDragActive ? (
              <div style={styles.dropzoneContent}>
                <span style={styles.dropzoneIcon}>📸</span>
                <span>Drop screenshots here</span>
              </div>
            ) : (
              <div style={styles.dropzoneContent}>
                <span style={styles.dropzoneIcon}>📱</span>
                <span>Drag & drop screenshots, or click to select</span>
                <span style={styles.dropzoneHint}>Supports: PNG, JPG, GIF, WebP</span>
              </div>
            )}
          </div>
          
          <div style={styles.uploadFooter}>
            <p style={styles.uploadNote}>
              ⚡ Images will be uploaded to Cloudinary and automatically optimized
            </p>
          </div>
        </div>
      )}

      {/* Screen Grid with Cloudinary images */}
      <div style={styles.gallery}>
        {screens.map((screen) => {
          try {
            const myImage = cld.image(screen.cloudinaryId);
            myImage.resize(fill().width(400).height(300));

            return (
              <div 
                key={screen.id} 
                style={styles.card}
                onClick={() => setSelectedScreen(screen)}
                onMouseEnter={(e) => {
                  const overlay = e.currentTarget.querySelector('.image-overlay') as HTMLElement;
                  if (overlay) overlay.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  const overlay = e.currentTarget.querySelector('.image-overlay') as HTMLElement;
                  if (overlay) overlay.style.opacity = '0';
                }}
              >
                <div style={styles.imageContainer}>
                  <AdvancedImage cldImg={myImage} style={styles.image} />
                  <div className="image-overlay" style={styles.imageOverlay}>
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
          } catch (error) {
            console.error('Error rendering image:', error);
            return null;
          }
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
              <h2 style={styles.modalTitle}>{selectedScreen.screenName}</h2>
              <p style={styles.modalDescription}>{selectedScreen.description}</p>
              
              <div style={styles.modalDetails}>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Component:</span>
                  <span style={styles.detailValue}>{selectedScreen.componentName}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Version:</span>
                  <span style={styles.detailValue}>{selectedScreen.buildVersion}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>File Path:</span>
                  <span style={styles.detailValue}>{selectedScreen.filePath}</span>
                </div>
              </div>
              
              <pre style={styles.codeBlock}>
                {`// File: ${selectedScreen.filePath}
// Built: ${new Date(selectedScreen.date).toLocaleString()}
// Version: ${selectedScreen.buildVersion}
// Cloudinary ID: ${selectedScreen.cloudinaryId}
// Tags: ${selectedScreen.tags?.join(', ')}`}
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
  uploadButton: {
    padding: '10px 20px',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s'
  },
  editModeIndicator: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    padding: '8px 12px',
    borderRadius: '6px',
    marginBottom: '20px',
    fontSize: '14px',
    fontWeight: '500'
  },
  uploadSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '30px',
    border: '2px solid #FF8C42'
  },
  uploadHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  uploadTitle: {
    fontSize: '18px',
    margin: 0,
    color: '#333'
  },
  closeButton: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#6c757d',
    color: 'white',
    fontSize: '20px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  dropzone: {
    border: '2px dashed #dee2e6',
    borderRadius: '8px',
    padding: '40px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    backgroundColor: 'white',
    transition: 'all 0.2s'
  },
  dropzoneActive: {
    borderColor: '#28a745',
    backgroundColor: '#f0fff4'
  },
  dropzoneDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  dropzoneContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '10px'
  },
  dropzoneIcon: {
    fontSize: '48px'
  },
  dropzoneHint: {
    fontSize: '12px',
    color: '#999'
  },
  uploadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '15px'
  },
  uploadingSpinner: {
    fontSize: '32px',
    animation: 'spin 2s linear infinite'
  },
  progressItem: {
    width: '100%',
    maxWidth: '300px'
  },
  progressFileName: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '4px',
    display: 'block'
  },
  progressBarContainer: {
    width: '100%',
    height: '20px',
    backgroundColor: '#e9ecef',
    borderRadius: '10px',
    overflow: 'hidden',
    position: 'relative' as const
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#28a745',
    transition: 'width 0.3s ease'
  },
  progressText: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '11px',
    color: '#fff',
    fontWeight: 'bold'
  },
  uploadFooter: {
    marginTop: '15px'
  },
  uploadNote: {
    fontSize: '12px',
    color: '#666',
    margin: 0,
    textAlign: 'center' as const
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
    flexWrap: 'wrap' as const
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
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalImage: {
    width: '100%',
    maxHeight: '500px',
    objectFit: 'contain' as const
  },
  modalInfo: {
    padding: '20px'
  },
  modalTitle: {
    fontSize: '24px',
    margin: '0 0 10px 0',
    color: '#333'
  },
  modalDescription: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '20px'
  },
  modalDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '10px',
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px'
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px'
  },
  detailLabel: {
    fontSize: '11px',
    color: '#999',
    textTransform: 'uppercase' as const
  },
  detailValue: {
    fontSize: '14px',
    color: '#333',
    fontWeight: '500'
  },
  codeBlock: {
    backgroundColor: '#1e1e1e',
    color: '#d4d4d4',
    padding: '15px',
    borderRadius: '8px',
    fontFamily: 'monospace',
    fontSize: '13px',
    lineHeight: '1.5',
    overflowX: 'auto' as const,
    margin: 0
  }
};

export default ScreenGallery;