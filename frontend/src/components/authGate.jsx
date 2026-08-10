// Pager untuk mengatur akses halaman berdasarkan token auth.
// dipakai di app.jsx

import { Navigate } from 'react-router-dom';

export default function AuthGate({ children, type }) {
  const token = localStorage.getItem('accessToken');
  const adminToken = localStorage.getItem('adminToken');

  // type: 'public', 'private', 'admin'
  
  if (type === 'public') {
    if (adminToken) return <Navigate to="/admin" replace />;
    if (token) return <Navigate to="/klasifikasi" replace />;
    return children;
  }

  if (type === 'private') {
    if (!token) return <Navigate to="/auth" replace />;
    return children;
  }

  if (type === 'admin') {
    if (!adminToken) return <Navigate to="/auth" replace />;
    return children;
  }

  return children;
}