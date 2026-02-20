// src/services/buildUpdateService.ts
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { BuildUpdate } from '../types';

const COLLECTION_NAME = 'buildUpdates';

// Convert Firestore timestamp to Date
const convertTimestamps = (data: any): BuildUpdate => {
  return {
    ...data,
    date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
    id: data.id
  };
};

// Get all build updates
export const getBuildUpdates = async (): Promise<BuildUpdate[]> => {
  try {
    const updatesRef = collection(db, COLLECTION_NAME);
    const q = query(updatesRef, orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return convertTimestamps({
        id: doc.id,
        ...data
      });
    });
  } catch (error) {
    console.error('Error getting build updates:', error);
    throw error;
  }
};

// Add a new build update
export const addBuildUpdate = async (update: Omit<BuildUpdate, 'id'>): Promise<BuildUpdate> => {
  try {
    const updatesRef = collection(db, COLLECTION_NAME);
    const updateWithTimestamp = {
      ...update,
      date: Timestamp.fromDate(update.date || new Date())
    };
    
    const docRef = await addDoc(updatesRef, updateWithTimestamp);
    
    return convertTimestamps({
      id: docRef.id,
      ...update
    });
  } catch (error) {
    console.error('Error adding build update:', error);
    throw error;
  }
};

// Update an existing build update
export const updateBuildUpdate = async (id: string, update: Omit<BuildUpdate, 'id'>): Promise<void> => {
  try {
    const updateRef = doc(db, COLLECTION_NAME, id);
    const updateWithTimestamp = {
      ...update,
      date: update.date ? Timestamp.fromDate(update.date) : Timestamp.now()
    };
    
    await updateDoc(updateRef, updateWithTimestamp);
  } catch (error) {
    console.error('Error updating build update:', error);
    throw error;
  }
};

// Delete a build update
export const deleteBuildUpdate = async (id: string): Promise<void> => {
  try {
    const updateRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(updateRef);
  } catch (error) {
    console.error('Error deleting build update:', error);
    throw error;
  }
};