// src/components/ScreenGallery.tsx
import React, { useState } from 'react';
import { storage } from '../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { ScreenCapture } from '../types';

interface Props {
  screens: ScreenCapture[];
}

const ScreenGallery: React.FC<Props> = ({ screens }) => {
  const [uploading, setUploading] = useState(false);

  const handleScreenUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Upload to Firebase Storage
      const storageRef = ref(storage, `screenshots/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);

      // Save to Firestore
      await addDoc(collection(db, 'screenshots'), {
        date: new Date(),
        screenName: prompt('Enter screen name:'),
        imageUrl,
        description: prompt('Enter description:'),
        buildVersion: 'v1.0.0'
      });
    } catch (error) {
      console.error('Upload failed:', error);
    }
    setUploading(false);
  };

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.sectionTitle}>Screen-by-Screen Progress</h2>
        <div>
          <input
            type="file"
            id="screen-upload"
            accept="image/*"
            onChange={handleScreenUpload}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => document.getElementById('screen-upload')?.click()}
            style={styles.uploadButton}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : '+ Add Screen'}
          </button>
        </div>
      </div>

      <div style={styles.gallery}>
        {screens.map((screen) => (
          <div key={screen.id} style={styles.card}>
            <img 
              src={screen.imageUrl} 
              alt={screen.screenName}
              style={styles.image}
            />
            <div style={styles.cardContent}>
              <h3 style={styles.screenName}>{screen.screenName}</h3>
              <p style={styles.screenDesc}>{screen.description}</p>
              <div style={styles.meta}>
                <span style={styles.version}>{screen.buildVersion}</span>
                <span style={styles.date}>{new Date(screen.date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  sectionTitle: {
    fontSize: '24px',
    margin: 0,
    color: '#333'
  },
  uploadButton: {
    padding: '8px 16px',
    backgroundColor: '#FF8C42',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  gallery: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  image: {
    width: '100%',
    height: '200px',
    objectFit: 'cover' as const,
    borderBottom: '1px solid #eee'
  },
  cardContent: {
    padding: '15px'
  },
  screenName: {
    fontSize: '16px',
    margin: '0 0 8px 0',
    color: '#333'
  },
  screenDesc: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 10px 0',
    lineHeight: '1.4'
  },
  meta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#999'
  },
  version: {
    padding: '2px 6px',
    backgroundColor: '#f0f0f0',
    borderRadius: '3px'
  },
  date: {
    color: '#999'
  }
};

export default ScreenGallery;