// Pager untuk mengatur akses halaman berdasarkan token auth.
// dipakai di app.jsx

import { Navigate } from 'react-router-dom';

export default function AuthGate({ children, type }) {
  const token = localStorage.getItem('accessToken');

  if (type === 'private') {
    if (!token) return <Navigate to="/auth" replace />;
    return children;
  }

  if (type === 'public') {
    if (token) return <Navigate to="/klasifikasi" replace />;
    return children;
  }

  // fallback
  return children;
}
