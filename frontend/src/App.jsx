import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { InstancesProvider } from './context/InstancesContext';
import { ProgressProvider } from './context/ProgressContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Challenges from './pages/Challenges';
import ChallengeDetail from './pages/ChallengeDetail';
import NavBar from './components/NavBar';

import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Teams from './pages/Teams';

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
          <BrowserRouter>
            <NavBar />
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
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/teams" element={
                <ProtectedRoute>
                  <Teams />
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
