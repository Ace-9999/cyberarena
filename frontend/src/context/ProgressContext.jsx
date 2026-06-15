import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from './AuthContext';

const ProgressContext = createContext(null);

export function ProgressProvider({ children }) {
  const { token } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [solvedList, setSolvedList] = useState([]);
  const [firstBloods, setFirstBloods] = useState([]);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  // Challenges are public — load once.
  useEffect(() => {
    apiClient.get('/challenges')
      .then(setChallenges)
      .catch(err => console.error('Failed to load challenges', err))
      .finally(() => setLoading(false));
  }, []);

  // Per-user progress comes from the server (authoritative, includes first-blood bonus).
  const refreshProgress = useCallback(async () => {
    if (!token) {
      setSolvedList([]);
      setFirstBloods([]);
      setPoints(0);
      return;
    }
    try {
      const res = await apiClient.get('/me/progress');
      setSolvedList(res.solved || []);
      setFirstBloods(res.first_bloods || []);
      setPoints(res.points || 0);
    } catch (err) {
      console.error('Failed to load progress', err);
    }
  }, [token]);

  useEffect(() => { refreshProgress(); }, [refreshProgress]);

  const markSolved = (id) => {
    setSolvedList(prev => (prev.includes(id) ? prev : [...prev, id]));
    refreshProgress(); // pull authoritative points + first-blood status
  };

  const value = { challenges, solvedList, firstBloods, points, loading, markSolved, refreshProgress };
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export const useProgress = () => useContext(ProgressContext);
