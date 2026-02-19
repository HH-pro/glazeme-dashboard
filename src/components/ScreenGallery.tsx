// src/components/ScreenGallery.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { AdvancedImage } from '@cloudinary/react';
import { Cloudinary } from '@cloudinary/url-gen';
import { fill } from '@cloudinary/url-gen/actions/resize';
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

  // Helper function to get image element with error handling
  const getImageElement = (screen: ScreenCapture) => {
    // Check if image previously failed or Cloudinary not ready
    if (imageErrors.has(screen.id) || !cld || !screen.cloudinaryId) {
      return (
        <div style={styles.placeholderImage}>
          <span style={styles.placeholderIcon}>📸</span>
          <span style={styles.placeholderText}>
            {!cld ? 'Cloudinary not configured' : 'Image not available'}
          </span>
        </div>
      );
    }

    try {
      const myImage = cld.image(screen.cloudinaryId);
      myImage.resize(fill().width(400).height(300));

      return (
        <AdvancedImage 
          cldImg={myImage} 
          style={styles.image}
          onError={() => handleImageError(screen.id)}
        />
      );
    } catch (error) {
      console.error('Error creating Cloudinary image:', error);
      handleImageError(screen.id);
      return (
        <div style={styles.placeholderImage}>
          <span style={styles.placeholderIcon}>⚠️</span>
          <span style={styles.placeholderText}>Failed to load image</span>
        </div>
      );
    }
  };

  const getModalImage = (screen: ScreenCapture) => {
    if (imageErrors.has(screen.id) || !cld || !screen.cloudinaryId) {
      return (
        <div style={styles.modalPlaceholder}>
          <span style={styles.modalPlaceholderIcon}>
            {!cld ? '☁️' : '📸'}
          </span>
          <span>
            {!cld ? 'Cloudinary not configured' : 'Image not available'}
          </span>
        </div>
      );
    }

    try {
      const modalImage = cld.image(screen.cloudinaryId).resize(fill().width(800).height(600));
      return (
        <AdvancedImage 
          cldImg={modalImage} 
          style={styles.modalImage}
          onError={() => handleImageError(screen.id)}
        />
      );
    } catch (error) {
      console.error('Error creating modal image:', error);
      return (
        <div style={styles.modalPlaceholder}>
          <span style={styles.modalPlaceholderIcon}>⚠️</span>
          <span>Failed to load image</span>
        </div>
      );
    }
  };

  return (
    <div style={styles.container}>
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
            backgroundColor: isEditMode && cloudinaryReady ? '#FF8C42' : '#6c757d',
            cursor: isEditMode && cloudinaryReady ? 'pointer' : 'not-allowed',
            opacity: isEditMode && cloudinaryReady ? 1 : 0.7
          }}
          disabled={!isEditMode || !cloudinaryReady}
        >
          {!cloudinaryReady ? '⚠️ Config Required' : 
           isEditMode ? '+ Add Screens' : '🔒 Edit Mode Required'}
        </button>
      </div>

      {/* Cloudinary Configuration Warning */}
      {!cloudinaryReady && (
        <div style={styles.warningMessage}>
          <strong>⚠️ Cloudinary Configuration Required</strong>
          <p style={styles.warningText}>
            Please add REACT_APP_CLOUDINARY_CLOUD_NAME to your .env file to enable image uploads and viewing.
          </p>
          <pre style={styles.envExample}>
            REACT_APP_CLOUDINARY_CLOUD_NAME=your-cloud-name-here
          </pre>
        </div>
      )}

      {/* Edit Mode Indicator */}
      {isEditMode && !showUploadForm && cloudinaryReady && (
        <div style={styles.editModeIndicator}>
          ✏️ Edit Mode Active - Long press on mobile or click ⋮ on desktop to edit/delete
        </div>
      )}

      {/* Upload Area */}
      {isEditMode && showUploadForm && cloudinaryReady && (
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

      {/* Screen Grid */}
      <div style={styles.gallery}>
        {screens.map((screen) => (
          <div 
            key={screen.id} 
            style={styles.card}
            onClick={() => setSelectedScreen(screen)}
            onTouchStart={(e) => handleTouchStart(e, screen.id)}
            onTouchEnd={(e) => handleTouchEnd(e, screen.id)}
            onMouseEnter={(e) => {
              if (window.innerWidth > 768) {
                const overlay = e.currentTarget.querySelector('.image-overlay') as HTMLElement;
                if (overlay) overlay.style.opacity = '1';
              }
            }}
            onMouseLeave={(e) => {
              if (window.innerWidth > 768) {
                const overlay = e.currentTarget.querySelector('.image-overlay') as HTMLElement;
                if (overlay) overlay.style.opacity = '0';
              }
            }}
          >
            <div style={styles.imageContainer}>
              {getImageElement(screen)}
              <div className="image-overlay" style={styles.imageOverlay}>
                <span style={styles.viewDetails}>Click to view details</span>
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
              <div style={styles.tags}>
                {screen.tags?.map(tag => (
                  <span key={tag} style={styles.tag}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {screens.length === 0 && (
        <div style={styles.emptyState}>
          <span style={styles.emptyStateIcon}>📱</span>
          <h3 style={styles.emptyStateTitle}>No Screens Yet</h3>
          <p style={styles.emptyStateText}>
            {isEditMode 
              ? 'Click the "Add Screens" button to upload your first screen capture.'
              : 'No screens have been added yet. Enable edit mode to add screens.'}
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
                  <label style={styles.formLabel}>Tags (comma separated)</label>
                  <input
                    type="text"
                    value={editingScreen.tags?.join(', ')}
                    onChange={(e) => setEditingScreen({
                      ...editingScreen, 
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                    })}
                    style={styles.formInput}
                    placeholder="ios, swiftui, screen"
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
                Are you sure you want to delete this screen? This action cannot be undone.
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
                  {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screen Detail Modal */}
      {selectedScreen && !editingScreen && (
        <div style={styles.modal} onClick={() => setSelectedScreen(null)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={() => setSelectedScreen(null)}>×</button>
            {getModalImage(selectedScreen)}
            <div style={styles.modalInfo}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>{selectedScreen.screenName}</h2>
                {isEditMode && (
                  <div style={styles.modalActions}>
                    <button 
                      onClick={() => handleEdit(selectedScreen)}
                      style={styles.modalEditButton}
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      onClick={() => {
                        setShowDeleteConfirm(selectedScreen.id);
                        setSelectedScreen(null);
                      }}
                      style={styles.modalDeleteButton}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                )}
              </div>
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
// Cloudinary ID: ${selectedScreen.cloudinaryId || 'Not available'}
// Tags: ${selectedScreen.tags?.join(', ') || 'None'}`}
              </pre>
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
    maxWidth: '1400px',
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
    backgroundColor: '#fff3cd',
    color: '#856404',
    padding: '8px 12px',
    borderRadius: '6px',
    marginBottom: '20px',
    fontSize: 'clamp(12px, 3vw, 14px)',
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
    '@media (max-width: 480px)': {
      gridTemplateColumns: '1fr'
    }
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    cursor: 'pointer',
    transition: 'transform 0.2s, boxShadow 0.2s',
    border: '1px solid #eee',
    '@media (max-width: 768px)': {
      '&:active': {
        transform: 'scale(0.98)'
      }
    }
  },
  imageContainer: {
    position: 'relative' as const,
    height: '200px',
    overflow: 'hidden',
    backgroundColor: '#f8f9fa'
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f8f9fa',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    color: '#6c757d'
  },
  placeholderIcon: {
    fontSize: '32px'
  },
  placeholderText: {
    fontSize: '12px',
    color: '#999',
    textAlign: 'center' as const,
    padding: '0 10px'
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
    fontSize: '14px',
    '@media (max-width: 768px)': {
      display: 'none'
    }
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
    marginBottom: '8px',
    fontSize: '12px',
    flexWrap: 'wrap' as const,
    gap: '5px'
  },
  componentName: {
    color: '#007bff',
    fontFamily: 'monospace',
    wordBreak: 'break-word' as const
  },
  date: {
    color: '#999',
    whiteSpace: 'nowrap' as const
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
    border: '1px solid #dee2e6',
    wordBreak: 'break-word' as const
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: 'clamp(40px, 10vw, 60px) clamp(20px, 5vw, 40px)',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    border: '2px dashed #dee2e6'
  },
  emptyStateIcon: {
    fontSize: '48px',
    display: 'block',
    marginBottom: '16px'
  },
  emptyStateTitle: {
    fontSize: 'clamp(18px, 5vw, 20px)',
    color: '#333',
    marginBottom: '8px'
  },
  emptyStateText: {
    fontSize: '14px',
    color: '#6c757d',
    maxWidth: '400px',
    margin: '0 auto'
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
    zIndex: 1000,
    padding: '20px'
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '12px',
    maxWidth: '1000px',
    width: '100%',
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
    objectFit: 'contain' as const,
    backgroundColor: '#f8f9fa'
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
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    flexWrap: 'wrap' as const,
    gap: '10px'
  },
  modalTitle: {
    fontSize: 'clamp(20px, 5vw, 24px)',
    margin: 0,
    color: '#333'
  },
  modalActions: {
    display: 'flex',
    gap: '8px'
  },
  modalEditButton: {
    padding: '6px 12px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  modalDeleteButton: {
    padding: '6px 12px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer'
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
    fontWeight: '500',
    wordBreak: 'break-word' as const
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
  },
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
  }
};

export default ScreenGallery;