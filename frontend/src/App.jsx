import { Routes, Route, Navigate } from 'react-router-dom';
import AuthGate from './components/authGate';
import Auth from './pages/auth';
import ResetPassword from './pages/resetPassword';
import Profile from './pages/profile';
import Klasifikasi from './pages/klasifikasi';
import { ToastContainer, Flip } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Gamifikasi from './pages/gamifikasi';
import Wrapper from './pages/wrapper';
import Leaderboard from './pages/leaderboard';
import Koleksi from './pages/koleksi';
import { UserProvider } from './components/userContext';
import { Analytics } from '@vercel/analytics/react';

function App() {
  return (
    <UserProvider>
      <div className="bg-dark min-vh-100 d-flex justify-content-center">
        <div className="app-container bg-white min-vh-100 shadow">
          <Routes>
            {/* ROOT */}
            <Route path="/" element={<Navigate to="/klasifikasi" replace />} />

            {/* PUBLIC */}
            <Route path="/auth" element={<AuthGate type="public"><Auth /></AuthGate>} />

            <Route path="/reset" element={<AuthGate type="public"><ResetPassword /></AuthGate>} />

            {/* PRIVATE + LAYOUT */}
            <Route element={<AuthGate type="private"><Wrapper /></AuthGate>}>
              <Route path="/klasifikasi" element={<Klasifikasi />} />
              <Route path="/gamifikasi" element={<Gamifikasi />} />
            </Route>
            
            {/* PRIVATE */}
            <Route path="/profile" element={<AuthGate type="private"><Profile /></AuthGate>} />
            <Route path="/leaderboard" element={<AuthGate type="private"><Leaderboard /></AuthGate>} />
            <Route path="/koleksi" element={<AuthGate type="private"><Koleksi /></AuthGate>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <ToastContainer position="top-center" autoClose={1700} closeOnClick draggable closeButton={false} transition={Flip} className="custom-toast-container"/>
          <Analytics />
        </div>
      </div>
    </UserProvider>
  );
}

export default App