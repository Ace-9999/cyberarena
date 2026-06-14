import React, { createContext, useState, useEffect, useContext } from 'react';
import { apiClient } from '../api/client';

const InstancesContext = createContext(null);

export function InstancesProvider({ children }) {
  // Load initial instances from localStorage
  const [instances, setInstances] = useState(() => {
    const saved = localStorage.getItem('active_instances');
    return saved ? JSON.parse(saved) : {};
  });

  // Sync state changes to localStorage
  useEffect(() => {
    localStorage.setItem('active_instances', JSON.stringify(instances));
  }, [instances]);

  // Global heartbeat interval for all active instances
  useEffect(() => {
    const activeKeys = Object.keys(instances);
    if (activeKeys.length === 0) return;

    const intervalId = setInterval(() => {
      activeKeys.forEach(id => {
        const instance = instances[id];
        apiClient.post(`/challenges/${id}/heartbeat`, { container_id: instance.container_id })
          .catch(err => {
            console.error(`Heartbeat failed for ${id}:`, err);
            // If the container was stopped/removed by backend, remove from context
            if (err.message && err.message.includes('not found')) {
              setInstances(prev => {
                const newInstances = { ...prev };
                delete newInstances[id];
                return newInstances;
              });
            }
          });
      });
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [instances]);

  const deploy = async (id) => {
    try {
      const res = await apiClient.post(`/challenges/${id}/deploy`);
      setInstances(prev => ({
        ...prev,
        [id]: res
      }));
      return res;
    } catch (err) {
      throw err;
    }
  };

  const stop = async (id) => {
    const instance = instances[id];
    if (!instance) return;

    try {
      await apiClient.post(`/challenges/${id}/stop`, { container_id: instance.container_id });
    } catch (err) {
      console.error(err);
      // Even if it fails (e.g., already stopped), we remove it from tracking
    } finally {
      setInstances(prev => {
        const newInstances = { ...prev };
        delete newInstances[id];
        return newInstances;
      });
    }
  };

  const value = {
    instances,
    deploy,
    stop
  };

  return (
    <InstancesContext.Provider value={value}>
      {children}
    </InstancesContext.Provider>
  );
}

export const useInstances = () => useContext(InstancesContext);
