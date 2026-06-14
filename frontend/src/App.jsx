import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { InstancesProvider } from './context/InstancesContext';
import { ProgressProvider } from './context/ProgressContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Challenges from './pages/Challenges';
import ChallengeDetail from './pages/ChallengeDetail';
import MatrixRain from './components/MatrixRain';
import ScoreDisplay from './components/ScoreDisplay';

import Leaderboard from './pages/Leaderboard';

const ProtectedRoute = ({ children }) => {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" />;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <ProgressProvider>
        <InstancesProvider>
          <MatrixRain />
          <BrowserRouter>
            <ScoreDisplay />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/challenges" element={
                <ProtectedRoute>
                  <Challenges />
                </ProtectedRoute>
              } />
              <Route path="/leaderboard" element={
                <ProtectedRoute>
                  <Leaderboard />
                </ProtectedRoute>
              } />
              <Route path="/challenges/:id" element={
                <ProtectedRoute>
                  <ChallengeDetail />
                </ProtectedRoute>
              } />
            </Routes>
          </BrowserRouter>
        </InstancesProvider>
      </ProgressProvider>
    </AuthProvider>
  );
}
