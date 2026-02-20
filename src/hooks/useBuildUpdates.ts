// src/hooks/useBuildUpdates.ts
import { useState, useEffect } from 'react';
import { BuildUpdate } from '../types';
import { 
  getBuildUpdates, 
  addBuildUpdate, 
  updateBuildUpdate, 
  deleteBuildUpdate 
} from '../services/buildUpdateService';

export const useBuildUpdates = () => {
  const [updates, setUpdates] = useState<BuildUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch updates on mount
  useEffect(() => {
    fetchUpdates();
  }, []);

  const fetchUpdates = async () => {
    try {
      setLoading(true);
      const fetchedUpdates = await getBuildUpdates();
      setUpdates(fetchedUpdates);
      setError(null);
    } catch (err) {
      setError('Failed to fetch updates');
      console.error('Error fetching updates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUpdate = async (update: Omit<BuildUpdate, 'id'>) => {
    try {
      setLoading(true);
      const newUpdate = await addBuildUpdate(update);
      setUpdates(prev => [newUpdate, ...prev]);
      setError(null);
    } catch (err) {
      setError('Failed to add update');
      console.error('Error adding update:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleEditUpdate = async (id: string, update: Omit<BuildUpdate, 'id'>) => {
    try {
      setLoading(true);
      await updateBuildUpdate(id, update);
      setUpdates(prev => 
        prev.map(u => u.id === id ? { ...update, id, date: update.date } : u)
      );
      setError(null);
    } catch (err) {
      setError('Failed to update update');
      console.error('Error updating update:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUpdate = async (id: string) => {
    try {
      setLoading(true);
      await deleteBuildUpdate(id);
      setUpdates(prev => prev.filter(u => u.id !== id));
      setError(null);
    } catch (err) {
      setError('Failed to delete update');
      console.error('Error deleting update:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    updates,
    loading,
    error,
    addUpdate: handleAddUpdate,
    editUpdate: handleEditUpdate,
    deleteUpdate: handleDeleteUpdate,
    refreshUpdates: fetchUpdates
  };
};