import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Auth from '../Auth/Auth';

export default function Routs() {
  return (
    <Routes>
      <Route path="/" element={<Auth />} />
      <Route path="/register" element={<Auth />} />
      <Route path="/register/user" element={<Auth />} />
      <Route path="/register/lawyer" element={<Auth />} />
      <Route path="/forgot-password" element={<Auth />} />
      <Route path="/reset-password" element={<Auth />} />
    </Routes>
  );
}
