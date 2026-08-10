// /auth

import { useState } from 'react';
import LoginForm from '../components/loginForm';
import RegisterForm from '../components/registerForm';

export default function Auth() {
  const [mode, setMode] = useState('login');

  return (
    <div className="auth-page d-flex justify-content-center align-items-center px-4 py-5">
      <div className="card rounded-4 shadow-lg p-4 w-100">

        <div className="text-center mb-4">
          <img 
            src="/goihuntlogo.svg" 
            alt="GoiHunt Logo"
            className="img-fluid"
            draggable="false"
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>

        <div className="d-flex auth-tabs mb-3">
          <button
            className={`flex-fill btn ${mode === 'login' ? 'tab-active' : 'tab-inactive'}`}
            onClick={() => setMode('login')}
          >
            Masuk
          </button>

          <button
            className={`flex-fill btn ${mode === 'register' ? 'tab-active' : 'tab-inactive'}`}
            onClick={() => setMode('register')}
          >
            Daftar
          </button>
        </div>

        <div className="auth-content">
          {mode === 'login' && <LoginForm />}
          {mode === 'register' && <RegisterForm />}
        </div>

      </div>
    </div>
  );
}