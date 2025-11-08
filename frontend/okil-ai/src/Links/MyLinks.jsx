import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function Tabs() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.includes('/register') ? 'register' : 'login';

  return (
    <div className="tabs">
      <button
        className={`tab ${activeTab === 'login' ? 'active' : ''}`}
        onClick={() => navigate('/login')}
      >
        Login
      </button>
      <button
        className={`tab ${activeTab === 'register' ? 'active' : ''}`}
        onClick={() => navigate('/register')}
      >
        Register
      </button>
    </div>
  );
}

export function SignupOptions() {
  const navigate = useNavigate();
  return (
    <div className="signup-options">
      <div className="signup-content">
        <p className="signup-description">Choose your account type to get started with OKIL AI</p>
        <div className="signup-buttons">
          <button
            type="button"
            className="signup-option-button"
            onClick={() => navigate('/register/user')}
          >
            Sign Up as User
          </button>
          <button
            type="button"
            className="signup-option-button"
            onClick={() => navigate('/register/lawyer')}
          >
            Sign Up as Lawyer
          </button>
        </div>
      </div>
    </div>
  );
}

export function SignupLoginLink() {
  const navigate = useNavigate();
  return (
    <div className="signup-login-link">
      <span>Already have an account? </span>
      <button
        type="button"
        className="login-link"
        onClick={() => navigate('/login')}
      >
        Login
      </button>
    </div>
  );
}

export default null;
