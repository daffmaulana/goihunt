import { Routes, Route, Navigate } from 'react-router-dom';
import AuthGate from './components/authGate';
import Auth from './pages/auth';
import Admin from './pages/admin';
import ResetPassword from './pages/resetPassword';
import Profile from './pages/profile';
import Klasifikasi from './pages/klasifikasi';
import { ToastContainer, Flip } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Gamifikasi from './pages/gamifikasi';
import Wrapper from './pages/wrapper';
import Leaderboard from './pages/leaderboard';
import Koleksi from './pages/koleksi';
import Review from './pages/review';
import { UserProvider } from './components/userContext';

function App() {
  return (
    <UserProvider>
      {/* Single ToastContainer at the top level covers every route, including /admin */}
      <ToastContainer position="top-center" autoClose={1700} closeOnClick draggable closeButton={false} transition={Flip} className="custom-toast-container"/>
      <Routes>
        {/* admin */}
        <Route path="/admin" element={<AuthGate type="admin"><Admin /></AuthGate>} />

        {/* selain admin */}
        <Route path="/*" element={
          <div className="bg-dark min-vh-100 d-flex justify-content-center">
            <div className="app-container bg-white min-vh-100 shadow">
              <Routes>
                <Route path="/" element={<Navigate to="/klasifikasi" replace />} />
                
                {/* publik */}
                <Route path="/auth" element={<AuthGate type="public"><Auth /></AuthGate>} />
                <Route path="/reset" element={<AuthGate type="public"><ResetPassword /></AuthGate>} />

                {/* utama */}
                <Route element={<AuthGate type="private"><Wrapper /></AuthGate>}>
                  <Route path="/klasifikasi" element={<Klasifikasi />} />
                  <Route path="/gamifikasi" element={<Gamifikasi />} />
                </Route>
                
                {/* no wrapper */}
                <Route path="/profile" element={<AuthGate type="private"><Profile /></AuthGate>} />
                <Route path="/leaderboard" element={<AuthGate type="private"><Leaderboard /></AuthGate>} />
                <Route path="/koleksi" element={<AuthGate type="private"><Koleksi /></AuthGate>} />
                <Route path="/review" element={<AuthGate type="private"><Review /></AuthGate>} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </div>
        } />
      </Routes>
    </UserProvider>
  );
}

export default App