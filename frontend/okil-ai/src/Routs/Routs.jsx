import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Auth from '../Auth/Auth';
import UserDashboard from '../User Dashboard/UserDashboard';
import LawyerDashboard from '../Lawyer Dashboard/LawyerDashboard';
import AppointmentDetails from '../Lawyer Dashboard/AppointmentDetails';
import QueryDetails from '../Lawyer Dashboard/QueryDetails';
import TalkToLawyer from '../User Dashboard/TalkToLawyer';
import Library from '../Library/Library';
import UserAppointmentDetails from '../User Dashboard/UserAppointmentDetails';
import UserQueryDetails from '../User Dashboard/UserQueryDetails';
import Settings from '../Settings/Settings';

export default function Routs() {
  return (
    <Routes>
      <Route path="/" element={<Auth />} />
      <Route path="/register" element={<Auth />} />
      <Route path="/register/user" element={<Auth />} />
      <Route path="/register/lawyer" element={<Auth />} />
      <Route path="/forgot-password" element={<Auth />} />
      <Route path="/reset-password" element={<Auth />} />
      <Route path="/user-dashboard" element={<UserDashboard />} />
      <Route path="/talk-to-lawyer" element={<TalkToLawyer />} />
      <Route path="/library" element={<Library />} />
      <Route path="/lawyer-dashboard" element={<LawyerDashboard />} />
      <Route path="/lawyer/appointments/:id" element={<AppointmentDetails />} />
      <Route path="/lawyer/queries/:id" element={<QueryDetails />} />
      <Route path="/user/appointments/:id" element={<UserAppointmentDetails />} />
      <Route path="/user/queries/:id" element={<UserQueryDetails />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
}
