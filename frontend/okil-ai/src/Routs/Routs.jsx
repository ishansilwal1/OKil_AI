import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Auth from '../Auth/Auth';
import UserDashboard from '../User Dashboard/UserDashboard';
import LawyerDashboard from '../Lawyer Dashboard/LawyerDashboard';
import AppointmentDetails from '../Lawyer Dashboard/AppointmentDetails';
import QueryDetails from '../Lawyer Dashboard/QueryDetails';
import TalkToLawyer from '../User Dashboard/TalkToLawyer';
import Library from '../Library/Library';
import MyAppointments from '../User Dashboard/MyAppointments';
import MyQueries from '../User Dashboard/MyQueries';
import UserAppointmentDetails from '../User Dashboard/UserAppointmentDetails';
import UserQueryDetails from '../User Dashboard/UserQueryDetails';
import Settings from '../Settings/Settings';

// Protected Route Component 
const ProtectedRoute = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    const token = localStorage.getItem('okil_token');
    const userInfo = localStorage.getItem('okil_user');
    
    console.log('ProtectedRoute checking auth:', { token: !!token, userInfo: !!userInfo });
    
    if (token && userInfo) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
    setIsChecking(false);
  }, []);
  
  if (isChecking) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default function Routs() {
  return (
    <Routes>
      <Route path="/login" element={<Auth />} />
      <Route path="/register" element={<Auth />} />
      <Route path="/register/user" element={<Auth />} />
      <Route path="/register/lawyer" element={<Auth />} />
      <Route path="/forgot-password" element={<Auth />} />
      <Route path="/reset-password" element={<Auth />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        } 
      />
      <Route path="/user-dashboard" element={<UserDashboard />} />
      <Route path="/talk-to-lawyer" element={<TalkToLawyer />} />
      <Route path="/library" element={<Library />} />
      <Route path="/my-appointments" element={<MyAppointments />} />
      <Route path="/my-queries" element={<MyQueries />} />
      <Route path="/lawyer-dashboard" element={<LawyerDashboard />} />
      <Route path="/lawyer/appointments/:id" element={<AppointmentDetails />} />
      <Route path="/lawyer/queries/:id" element={<QueryDetails />} />
      <Route path="/user/appointments/:id" element={<UserAppointmentDetails />} />
      <Route path="/user/queries/:id" element={<UserQueryDetails />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
