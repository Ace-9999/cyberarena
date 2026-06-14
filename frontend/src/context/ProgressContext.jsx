import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { apiClient } from '../api/client';

const ProgressContext = createContext(null);

export function ProgressProvider({ children }) {
  const [challenges, setChallenges] = useState([]);
  const [solvedList, setSolvedList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage and fetch challenges
  useEffect(() => {
    const saved = localStorage.getItem('solved_challenges');
    if (saved) {
      setSolvedList(JSON.parse(saved));
    }

    apiClient.get('/challenges')
      .then(data => {
        setChallenges(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load challenges", err);
        setLoading(false);
      });
  }, []);

  // Update localStorage whenever solvedList changes
  useEffect(() => {
    localStorage.setItem('solved_challenges', JSON.stringify(solvedList));
  }, [solvedList]);

  const markSolved = (id) => {
    setSolvedList(prev => {
      if (!prev.includes(id)) {
        return [...prev, id];
      }
      return prev;
    });
  };

  const points = useMemo(() => {
    return challenges
      .filter(c => solvedList.includes(c.id))
      .reduce((sum, c) => sum + c.points, 0);
  }, [challenges, solvedList]);

  const value = {
    challenges,
    solvedList,
    loading,
    points,
    markSolved
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

export const useProgress = () => useContext(ProgressContext);
