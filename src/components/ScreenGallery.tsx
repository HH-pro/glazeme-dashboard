// src/components/ScreenGallery.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { AdvancedImage } from '@cloudinary/react';
import { Cloudinary } from '@cloudinary/url-gen';
import { fill, scale } from '@cloudinary/url-gen/actions/resize';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { uploadToCloudinary, deleteFromCloudinary } from '../services/cloudinary';
import { ScreenCapture } from '../types';

interface Props {
  screens: ScreenCapture[];
  isEditMode?: boolean;
  onAddScreen?: () => void;
  onScreensUpdate?: () => void;
}

const ScreenGallery: React.FC<Props> = ({ 
  screens, 
  isEditMode = false, 
  onAddScreen,
  onScreensUpdate 
}) => {
  const [uploading, setUploading] = useState(false);
  const [selectedScreen, setSelectedScreen] = useState<ScreenCapture | null>(null);
  const [fullScreenImage, setFullScreenImage] = useState<ScreenCapture | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [cloudinaryReady, setCloudinaryReady] = useState(true);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [editingScreen, setEditingScreen] = useState<ScreenCapture | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  // Get Cloudinary cloud name from environment
  const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;

  // Initialize Cloudinary only if cloud name exists
  const cld = React.useMemo(() => {
    if (!cloudName) {
      console.warn('Cloudinary cloud name not configured');
      return null;
    }
    try {
      return new Cloudinary({
        cloud: {
          cloudName: cloudName
        }
      });
    } catch (error) {
      console.error('Failed to initialize Cloudinary:', error);
      return null;
    }
  }, [cloudName]);

  // Check Cloudinary configuration on mount
  useEffect(() => {
    if (!cloudName) {
      setCloudinaryReady(false);
      console.error(
        'Cloudinary is not configured. Please add REACT_APP_CLOUDINARY_CLOUD_NAME to your .env file'
      );
    }
  }, [cloudName]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setMenuOpen(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Handle escape key for full screen mode
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFullScreenImage(null);
        setSelectedScreen(null);
      }
    };
    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!isEditMode && onAddScreen) {
      onAddScreen();
      return;
    }

    if (!cloudName) {
      alert('Cloudinary is not configured. Please check your environment variables.');
      return;
    }

    setUploading(true);
    try {
      for (const file of acceptedFiles) {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        
        // Upload to Cloudinary with progress tracking
        const result = await uploadToCloudinary(
          file, 
          'glazeme-screens', 
          (progress: number) => {
            setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
          }
        );
        
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
          tags: ['ios', 'swiftui', 'imessage', 'mobile']
        });

        // Clear progress for this file
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[file.name];
          return newProgress;
        });
      }
      setShowUploadForm(false);
      if (onScreensUpdate) onScreensUpdate();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    }
    setUploading(false);
  }, [isEditMode, onAddScreen, cloudName, onScreensUpdate]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    disabled: !isEditMode || !cloudinaryReady
  });

  const handleAddClick = () => {
    if (!isEditMode && onAddScreen) {
      onAddScreen();
      return;
    }
    
    if (!cloudinaryReady) {
      alert('Cloudinary is not configured. Please check your environment variables.');
      return;
    }
    
    setShowUploadForm(true);
  };

  const handleEdit = async (screen: ScreenCapture) => {
    setEditingScreen(screen);
    setMenuOpen(null);
  };

  const handleUpdate = async () => {
    if (!editingScreen) return;

    setIsUpdating(true);
    try {
      const screenRef = doc(db, 'screenshots', editingScreen.id);
      await updateDoc(screenRef, {
        screenName: editingScreen.screenName,
        description: editingScreen.description,
        buildVersion: editingScreen.buildVersion,
        componentName: editingScreen.componentName,
        filePath: editingScreen.filePath,
        tags: editingScreen.tags,
        updatedAt: new Date()
      });
      setEditingScreen(null);
      if (onScreensUpdate) onScreensUpdate();
    } catch (error) {
      console.error('Update failed:', error);
      alert('Failed to update screen. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (screenId: string, cloudinaryId?: string) => {
    setIsDeleting(true);
    try {
      // Delete from Cloudinary if we have the ID
      if (cloudinaryId) {
        await deleteFromCloudinary(cloudinaryId);
      }

      // Delete from Firestore
      const screenRef = doc(db, 'screenshots', screenId);
      await deleteDoc(screenRef);

      setShowDeleteConfirm(null);
      if (selectedScreen?.id === screenId) setSelectedScreen(null);
      if (fullScreenImage?.id === screenId) setFullScreenImage(null);
      if (onScreensUpdate) onScreensUpdate();
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete screen. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleImageError = (screenId: string) => {
    setImageErrors(prev => new Set(prev).add(screenId));
  };

  const handleTouchStart = (e: React.TouchEvent, screenId: string) => {
    setTouchStart(Date.now());
  };

  const handleTouchEnd = (e: React.TouchEvent, screenId: string) => {
    if (touchStart && Date.now() - touchStart > 500) {
      // Long press detected
      e.preventDefault();
      if (isEditMode) {
        setMenuOpen(menuOpen === screenId ? null : screenId);
      }
    }
    setTouchStart(null);
  };

  const toggleMenu = (e: React.MouseEvent, screenId: string) => {
    e.stopPropagation();
    setMenuOpen(menuOpen === screenId ? null : screenId);
  };

  const handleImageClick = (screen: ScreenCapture, e: React.MouseEvent) => {
    e.stopPropagation();
    setFullScreenImage(screen);
  };

  const handleCloseFullScreen = () => {
    setFullScreenImage(null);
  };

  // Helper function to get thumbnail image (perfect size for gallery)
  const getThumbnailImage = (screen: ScreenCapture) => {
    if (imageErrors.has(screen.id) || !cld || !screen.cloudinaryId) {
      return (
        <div style={styles.thumbnailPlaceholder}>
          <span style={styles.placeholderIcon}>📱</span>
          <span style={styles.placeholderText}>Image not available</span>
        </div>
      );
    }

    try {
      // Perfect thumbnail size: 240px width, auto height for mobile screens
      const thumbnail = cld.image(screen.cloudinaryId);
      thumbnail.resize(scale().width(240)); // Scale to fit width

      return (
        <AdvancedImage 
          cldImg={thumbnail} 
          style={styles.thumbnailImage}
          onError={() => handleImageError(screen.id)}
        />
      );
    } catch (error) {
      console.error('Error creating thumbnail:', error);
      handleImageError(screen.id);
      return (
        <div style={styles.thumbnailPlaceholder}>
          <span style={styles.placeholderIcon}>⚠️</span>
          <span style={styles.placeholderText}>Failed to load</span>
        </div>
      );
    }
  };

  // Helper function for modal image (medium size for popup)
  const getModalImage = (screen: ScreenCapture) => {
    if (imageErrors.has(screen.id) || !cld || !screen.cloudinaryId) {
      return (
        <div style={styles.modalPlaceholder}>
          <span style={styles.modalPlaceholderIcon}>📱</span>
          <span>Image not available</span>
        </div>
      );
    }

    try {
      // Medium size for popup: 600px width, maintains aspect ratio
      const modalImage = cld.image(screen.cloudinaryId);
      modalImage.resize(scale().width(600));

      return (
        <AdvancedImage 
          cldImg={modalImage} 
          style={styles.modalImage}
          onClick={(e) => handleImageClick(screen, e)}
          onError={() => handleImageError(screen.id)}
        />
      );
    } catch (error) {
      console.error('Error creating modal image:', error);
      return (
        <div style={styles.modalPlaceholder}>
          <span style={styles.modalPlaceholderIcon}>⚠️</span>
          <span>Failed to load</span>
        </div>
      );
    }
  };

  // Helper function for full screen image (perfect fit for screen)
  const getFullScreenImage = (screen: ScreenCapture) => {
    if (imageErrors.has(screen.id) || !cld || !screen.cloudinaryId) {
      return (
        <div style={styles.fullScreenPlaceholder}>
          <span style={styles.fullScreenPlaceholderIcon}>📱</span>
          <span>Image not available</span>
        </div>
      );
    }

    try {
      // Full screen: fit to viewport while maintaining aspect ratio
      const fullImage = cld.image(screen.cloudinaryId);
      
      // Get viewport dimensions
      const viewportWidth = window.innerWidth - 100;
      const viewportHeight = window.innerHeight - 150;
      
      fullImage.resize(scale()
        .width(viewportWidth)
        .height(viewportHeight)
      );

      return (
        <AdvancedImage 
          cldImg={fullImage} 
          style={styles.fullScreenImage}
          onError={() => handleImageError(screen.id)}
        />
      );
    } catch (error) {
      console.error('Error creating full screen image:', error);
      return (
        <div style={styles.fullScreenPlaceholder}>
          <span style={styles.fullScreenPlaceholderIcon}>⚠️</span>
          <span>Failed to load</span>
        </div>
      );
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.sectionTitle}>📱 Mobile Screen Gallery</h2>
          <p style={styles.subtitle}>
            {screens.length} mobile screens • Last update: {screens[0]?.date ? new Date(screens[0].date).toLocaleString() : 'Never'}
          </p>
        </div>
        <button 
          onClick={handleAddClick}
          style={{
            ...styles.uploadButton,
            backgroundColor: isEditMode && cloudinaryReady ? '#FF8C42' : '#6c757d',
            cursor: isEditMode && cloudinaryReady ? 'pointer' : 'not-allowed',
            opacity: isEditMode && cloudinaryReady ? 1 : 0.7
          }}
          disabled={!isEditMode || !cloudinaryReady}
        >
          {!cloudinaryReady ? '⚠️ Config Required' : 
           isEditMode ? '+ Add Mobile Screens' : '🔒 Edit Mode Required'}
        </button>
      </div>

      {/* Cloudinary Configuration Warning */}
      {!cloudinaryReady && (
        <div style={styles.warningMessage}>
          <strong>⚠️ Cloudinary Configuration Required</strong>
          <p style={styles.warningText}>
            Please add REACT_APP_CLOUDINARY_CLOUD_NAME to your .env file to enable image uploads.
          </p>
          <pre style={styles.envExample}>
            REACT_APP_CLOUDINARY_CLOUD_NAME=your-cloud-name-here
          </pre>
        </div>
      )}

      {/* Edit Mode Indicator */}
      {isEditMode && !showUploadForm && cloudinaryReady && (
        <div style={styles.editModeIndicator}>
          ✏️ Edit Mode Active • Long press on mobile or click ⋮ to edit/delete
        </div>
      )}

      {/* Upload Area */}
      {isEditMode && showUploadForm && cloudinaryReady && (
        <div style={styles.uploadSection}>
          <div style={styles.uploadHeader}>
            <h3 style={styles.uploadTitle}>Upload Mobile Screenshots</h3>
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
            ...(!isEditMode || !cloudinaryReady ? styles.dropzoneDisabled : {})
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
                <span style={styles.dropzoneIcon}>📱</span>
                <span>Drop mobile screenshots here</span>
              </div>
            ) : (
              <div style={styles.dropzoneContent}>
                <span style={styles.dropzoneIcon}>📱</span>
                <span>Drag & drop or click to select</span>
                <span style={styles.dropzoneHint}>PNG, JPG, GIF (Mobile screenshots)</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Screen Grid */}
      <div style={styles.gallery}>
        {screens.map((screen) => (
          <div 
            key={screen.id} 
            style={styles.card}
            onClick={() => setSelectedScreen(screen)}
            onTouchStart={(e) => handleTouchStart(e, screen.id)}
            onTouchEnd={(e) => handleTouchEnd(e, screen.id)}
          >
            <div style={styles.thumbnailContainer}>
              {getThumbnailImage(screen)}
              <div style={styles.imageOverlay}>
                <span style={styles.viewDetails}>Click to view</span>
              </div>
            </div>
            <div style={styles.cardContent}>
              <div style={styles.cardHeader}>
                <h3 style={styles.screenName}>{screen.screenName}</h3>
                <div style={styles.cardActions}>
                  <span style={styles.version}>{screen.buildVersion}</span>
                  {isEditMode && (
                    <div style={styles.menuContainer}>
                      <button 
                        onClick={(e) => toggleMenu(e, screen.id)}
                        style={styles.menuButton}
                      >
                        ⋮
                      </button>
                      {menuOpen === screen.id && (
                        <div style={styles.menuDropdown}>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(screen);
                            }}
                            style={styles.menuItem}
                          >
                            ✏️ Edit
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteConfirm(screen.id);
                              setMenuOpen(null);
                            }}
                            style={{...styles.menuItem, ...styles.deleteMenuItem}}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <p style={styles.screenDesc}>{screen.description}</p>
              <div style={styles.meta}>
                <span style={styles.componentName}>{screen.componentName}</span>
                <span style={styles.date}>
                  {new Date(screen.date).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {screens.length === 0 && (
        <div style={styles.emptyState}>
          <span style={styles.emptyStateIcon}>📱</span>
          <h3 style={styles.emptyStateTitle}>No Mobile Screens Yet</h3>
          <p style={styles.emptyStateText}>
            {isEditMode 
              ? 'Click "Add Mobile Screens" to upload your first screenshot.'
              : 'No screens added yet. Enable edit mode to add screens.'}
          </p>
        </div>
      )}

      {/* Edit Modal */}
      {editingScreen && (
        <div style={styles.modal} onClick={() => setEditingScreen(null)}>
          <div style={{...styles.modalContent, maxWidth: '500px'}} onClick={e => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={() => setEditingScreen(null)}>×</button>
            <div style={styles.modalInfo}>
              <h2 style={styles.modalTitle}>Edit Screen</h2>
              
              <div style={styles.editForm}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Screen Name</label>
                  <input
                    type="text"
                    value={editingScreen.screenName}
                    onChange={(e) => setEditingScreen({...editingScreen, screenName: e.target.value})}
                    style={styles.formInput}
                    placeholder="Enter screen name"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Description</label>
                  <textarea
                    value={editingScreen.description}
                    onChange={(e) => setEditingScreen({...editingScreen, description: e.target.value})}
                    style={styles.formTextarea}
                    placeholder="Enter description"
                    rows={3}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Build Version</label>
                  <input
                    type="text"
                    value={editingScreen.buildVersion}
                    onChange={(e) => setEditingScreen({...editingScreen, buildVersion: e.target.value})}
                    style={styles.formInput}
                    placeholder="e.g., v1.0.0"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Component Name</label>
                  <input
                    type="text"
                    value={editingScreen.componentName}
                    onChange={(e) => setEditingScreen({...editingScreen, componentName: e.target.value})}
                    style={styles.formInput}
                    placeholder="Component name"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>File Path</label>
                  <input
                    type="text"
                    value={editingScreen.filePath}
                    onChange={(e) => setEditingScreen({...editingScreen, filePath: e.target.value})}
                    style={styles.formInput}
                    placeholder="File path"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Tags</label>
                  <input
                    type="text"
                    value={editingScreen.tags?.join(', ')}
                    onChange={(e) => setEditingScreen({
                      ...editingScreen, 
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                    })}
                    style={styles.formInput}
                    placeholder="ios, mobile, screen"
                  />
                </div>

                <div style={styles.editFormActions}>
                  <button 
                    onClick={() => setEditingScreen(null)}
                    style={styles.cancelButton}
                    disabled={isUpdating}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleUpdate}
                    style={styles.saveButton}
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={styles.modal} onClick={() => setShowDeleteConfirm(null)}>
          <div style={{...styles.modalContent, maxWidth: '400px'}} onClick={e => e.stopPropagation()}>
            <div style={styles.modalInfo}>
              <h2 style={styles.modalTitle}>Confirm Delete</h2>
              <p style={styles.deleteConfirmText}>
                Are you sure you want to delete this screen?
              </p>
              
              <div style={styles.editFormActions}>
                <button 
                  onClick={() => setShowDeleteConfirm(null)}
                  style={styles.cancelButton}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    const screen = screens.find(s => s.id === showDeleteConfirm);
                    if (screen) {
                      handleDelete(screen.id, screen.cloudinaryId);
                    }
                  }}
                  style={styles.deleteConfirmButton}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popup Modal (Medium Size) */}
      {selectedScreen && !editingScreen && !fullScreenImage && (
        <div style={styles.modal} onClick={() => setSelectedScreen(null)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={() => setSelectedScreen(null)}>×</button>
            <div style={styles.modalImageContainer}>
              {getModalImage(selectedScreen)}
              <div style={styles.modalImageOverlay} onClick={(e) => handleImageClick(selectedScreen, e)}>
                <span style={styles.fullScreenHint}>Click for full screen</span>
              </div>
            </div>
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Modal (Perfect Fit) */}
      {fullScreenImage && (
        <div style={styles.fullScreenModal} onClick={handleCloseFullScreen}>
          <button style={styles.fullScreenClose} onClick={handleCloseFullScreen}>×</button>
          <button style={styles.fullScreenDownload} onClick={(e) => {
            e.stopPropagation();
            if (fullScreenImage.imageUrl) {
              window.open(fullScreenImage.imageUrl, '_blank');
            }
          }}>
            ⬇️ Download
          </button>
          <div style={styles.fullScreenContent} onClick={e => e.stopPropagation()}>
            {getFullScreenImage(fullScreenImage)}
            <div style={styles.fullScreenInfo}>
              <h3>{fullScreenImage.screenName}</h3>
              <p>{fullScreenImage.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    boxSizing: 'border-box' as const
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '25px',
    flexWrap: 'wrap' as const,
    gap: '15px'
  },
  sectionTitle: {
    fontSize: 'clamp(18px, 4vw, 22px)',
    margin: '0 0 5px 0',
    color: '#333'
  },
  subtitle: {
    fontSize: 'clamp(11px, 3vw, 13px)',
    color: '#6c757d',
    margin: 0
  },
  uploadButton: {
    padding: '10px 20px',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: 'clamp(12px, 3vw, 14px)',
    fontWeight: '500',
    transition: 'background-color 0.2s',
    whiteSpace: 'nowrap' as const,
    '@media (max-width: 480px)': {
      width: '100%'
    }
  },
  warningMessage: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #ffeeba'
  },
  warningText: {
    margin: '8px 0',
    fontSize: '14px'
  },
  envExample: {
    backgroundColor: '#fff9e6',
    padding: '10px',
    borderRadius: '4px',
    fontSize: '13px',
    fontFamily: 'monospace',
    border: '1px solid #ffeeba',
    margin: '8px 0 0 0',
    overflowX: 'auto' as const
  },
  editModeIndicator: {
    backgroundColor: '#e2f3ff',
    color: '#0066cc',
    padding: '8px 12px',
    borderRadius: '6px',
    marginBottom: '20px',
    fontSize: 'clamp(12px, 3vw, 14px)',
    fontWeight: '500',
    border: '1px solid #b8daff'
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
    fontSize: 'clamp(16px, 4vw, 18px)',
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
    padding: 'clamp(20px, 5vw, 40px)',
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
    fontSize: 'clamp(32px, 8vw, 48px)'
  },
  dropzoneHint: {
    fontSize: 'clamp(10px, 2.5vw, 12px)',
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
    display: 'block',
    wordBreak: 'break-all' as const
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
  // Gallery Styles
  gallery: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '20px',
    '@media (max-width: 768px)': {
      gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
      gap: '15px'
    },
    '@media (max-width: 480px)': {
      gridTemplateColumns: '1fr',
      gap: '20px'
    }
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    cursor: 'pointer',
    transition: 'transform 0.2s, boxShadow 0.2s',
    border: '1px solid #eee',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
    }
  },
  thumbnailContainer: {
    position: 'relative' as const,
    height: '320px', // Fixed height for consistency
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  thumbnailImage: {
    width: 'auto',
    height: '100%',
    maxWidth: '100%',
    objectFit: 'contain' as const
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f8f9fa',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    color: '#6c757d'
  },
  placeholderIcon: {
    fontSize: '48px'
  },
  placeholderText: {
    fontSize: '14px',
    color: '#999'
  },
  imageOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.2s',
    '&:hover': {
      opacity: 1
    }
  },
  viewDetails: {
    padding: '8px 16px',
    backgroundColor: '#FF8C42',
    color: 'white',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '500'
  },
  cardContent: {
    padding: '15px'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
    gap: '10px'
  },
  screenName: {
    fontSize: 'clamp(14px, 4vw, 16px)',
    margin: 0,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    wordBreak: 'break-word' as const
  },
  cardActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0
  },
  version: {
    padding: '2px 6px',
    backgroundColor: '#e9ecef',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#495057',
    whiteSpace: 'nowrap' as const
  },
  menuContainer: {
    position: 'relative' as const
  },
  menuButton: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#666',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    '&:hover': {
      backgroundColor: '#f0f0f0'
    }
  },
  menuDropdown: {
    position: 'absolute' as const,
    top: '100%',
    right: 0,
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    border: '1px solid #eee',
    zIndex: 10,
    minWidth: '120px',
    marginTop: '4px'
  },
  menuItem: {
    width: '100%',
    padding: '10px 16px',
    border: 'none',
    backgroundColor: 'transparent',
    textAlign: 'left' as const,
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    '&:hover': {
      backgroundColor: '#f8f9fa'
    },
    '&:first-child': {
      borderTopLeftRadius: '8px',
      borderTopRightRadius: '8px'
    },
    '&:last-child': {
      borderBottomLeftRadius: '8px',
      borderBottomRightRadius: '8px'
    }
  },
  deleteMenuItem: {
    color: '#dc3545'
  },
  screenDesc: {
    fontSize: '13px',
    color: '#666',
    margin: '0 0 10px 0',
    lineHeight: '1.4',
    wordBreak: 'break-word' as const
  },
  meta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px'
  },
  componentName: {
    color: '#007bff',
    fontFamily: 'monospace'
  },
  date: {
    color: '#999'
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '60px 20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    border: '2px dashed #dee2e6'
  },
  emptyStateIcon: {
    fontSize: '64px',
    display: 'block',
    marginBottom: '16px'
  },
  emptyStateTitle: {
    fontSize: '20px',
    color: '#333',
    marginBottom: '8px'
  },
  emptyStateText: {
    fontSize: '14px',
    color: '#6c757d',
    maxWidth: '400px',
    margin: '0 auto'
  },
  // Modal Styles
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
    zIndex: 1000,
    padding: '20px'
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '16px',
    maxWidth: '800px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'hidden',
    position: 'relative' as const,
    display: 'flex',
    flexDirection: 'column' as const
  },
  modalClose: {
    position: 'absolute' as const,
    top: '15px',
    right: '15px',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#ff4444',
    color: 'white',
    fontSize: '24px',
    cursor: 'pointer',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '&:hover': {
      backgroundColor: '#ff6666'
    }
  },
  modalImageContainer: {
    position: 'relative' as const,
    backgroundColor: '#000',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '300px',
    maxHeight: '500px',
    overflow: 'hidden'
  },
  modalImage: {
    width: 'auto',
    height: 'auto',
    maxWidth: '100%',
    maxHeight: '500px',
    objectFit: 'contain' as const,
    cursor: 'pointer'
  },
  modalImageOverlay: {
    position: 'absolute' as const,
    bottom: '20px',
    right: '20px',
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: 'rgba(0,0,0,0.8)'
    }
  },
  fullScreenHint: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  modalPlaceholder: {
    width: '100%',
    height: '300px',
    backgroundColor: '#f8f9fa',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    color: '#6c757d',
    fontSize: '16px'
  },
  modalPlaceholderIcon: {
    fontSize: '48px'
  },
  modalInfo: {
    padding: '20px'
  },
  modalTitle: {
    fontSize: '20px',
    margin: '0 0 10px 0',
    color: '#333'
  },
  modalDescription: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '20px',
    lineHeight: '1.6'
  },
  modalDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px',
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
  // Edit Form Styles
  editForm: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px'
  },
  formLabel: {
    fontSize: '13px',
    color: '#666',
    fontWeight: '500'
  },
  formInput: {
    padding: '10px',
    border: '1px solid #dee2e6',
    borderRadius: '6px',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box' as const
  },
  formTextarea: {
    padding: '10px',
    border: '1px solid #dee2e6',
    borderRadius: '6px',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box' as const,
    resize: 'vertical' as const,
    fontFamily: 'inherit'
  },
  editFormActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px'
  },
  cancelButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  saveButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  deleteConfirmText: {
    fontSize: '16px',
    color: '#666',
    margin: '20px 0',
    textAlign: 'center' as const
  },
  deleteConfirmButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  // Full Screen Styles
  fullScreenModal: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.98)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '20px'
  },
  fullScreenContent: {
    position: 'relative' as const,
    maxWidth: '100%',
    maxHeight: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center'
  },
  fullScreenImage: {
    maxWidth: '100%',
    maxHeight: 'calc(100vh - 120px)',
    width: 'auto',
    height: 'auto',
    objectFit: 'contain' as const,
    borderRadius: '8px',
    boxShadow: '0 4px 30px rgba(0,0,0,0.5)'
  },
  fullScreenPlaceholder: {
    width: '80vw',
    height: '60vh',
    backgroundColor: '#1e1e1e',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    color: '#fff',
    fontSize: '18px',
    borderRadius: '8px'
  },
  fullScreenPlaceholderIcon: {
    fontSize: '64px'
  },
  fullScreenClose: {
    position: 'absolute' as const,
    top: '20px',
    right: '20px',
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#ff4444',
    color: 'white',
    fontSize: '28px',
    cursor: 'pointer',
    zIndex: 2001,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
    '&:hover': {
      backgroundColor: '#ff6666'
    }
  },
  fullScreenDownload: {
    position: 'absolute' as const,
    top: '20px',
    right: '80px',
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    fontSize: '16px',
    cursor: 'pointer',
    zIndex: 2001,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
    '&:hover': {
      backgroundColor: '#34ce57'
    }
  },
  fullScreenInfo: {
    position: 'absolute' as const,
    bottom: '20px',
    left: '20px',
    right: '20px',
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: 'white',
    padding: '15px 25px',
    borderRadius: '12px',
    backdropFilter: 'blur(5px)',
    textAlign: 'center' as const,
    maxWidth: '600px',
    margin: '0 auto'
  }
};

export default ScreenGallery;