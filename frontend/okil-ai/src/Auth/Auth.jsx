import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import './Auth.css';
import { Tabs, SignupOptions, SignupLoginLink } from '../Links/MyLinks';

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const pathname = location.pathname;

  // derive view and active tab from the current URL
  const currentView = pathname.includes('/register/user')
    ? 'signupUser'
    : pathname.includes('/register/lawyer')
    ? 'signupLawyer'
    : pathname === '/forgot-password'
    ? 'forgotPassword'
    : pathname === '/reset-password'
    ? 'resetPassword'
    : 'main';

  const activeTab = pathname.includes('/register') ? 'register' : 'login';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [signupData, setSignupData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState('');

  const [lawyerSignupData, setLawyerSignupData] = useState({
    name: '',
    username: '',
    barCouncilNumber: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [lawyerSignupLoading, setLawyerSignupLoading] = useState(false);
  const [lawyerSignupError, setLawyerSignupError] = useState('');

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  // Forgot password state (inlined)
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState('idle'); // idle, sending, sent, error

  // Reset password state (inlined)
  const [resetToken, setResetToken] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetStatus, setResetStatus] = useState('idle'); // idle, sending, success, error
  const [resetMessage, setResetMessage] = useState('');

  const validateEmail = (value) => {
    return /\S+@\S+\.\S+/.test(value);
  };

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return 'Password must be at least 8 characters long';
    if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(pwd)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(pwd)) return 'Password must contain at least one number';
    return null;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSignupInputChange = (e) => {
    const { name, value } = e.target;
    setSignupData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLawyerSignupInputChange = (e) => {
    const { name, value } = e.target;
    setLawyerSignupData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, password: formData.password })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: 'Login failed' }));
          throw new Error(err.detail || 'Login failed');
        }
        const data = await res.json();
        // store token
        if (data.access_token) {
          localStorage.setItem('okil_token', data.access_token);
        }
        setLoginLoading(false);
        // navigate to home or dashboard
        navigate('/');
      } catch (err) {
        setLoginLoading(false);
        setLoginError(err.message || 'Login failed');
      }
    })();
  };

  const handleSignupSubmit = (e) => {
    e.preventDefault();
    setSignupError('');
    if (signupData.password !== signupData.confirmPassword) {
      setSignupError('Passwords do not match');
      return;
    }
    setSignupLoading(true);
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/register/user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: signupData.name,
            username: signupData.username,
            email: signupData.email,
            password: signupData.password
          })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
          throw new Error(err.detail || 'Registration failed');
        }
        setSignupLoading(false);
        // auto-navigate to login view
        navigate('/');
      } catch (err) {
        setSignupLoading(false);
        setSignupError(err.message || 'Registration failed');
      }
    })();
  };

  const handleLawyerSignupSubmit = (e) => {
    e.preventDefault();
    setLawyerSignupError('');
    if (lawyerSignupData.password !== lawyerSignupData.confirmPassword) {
      setLawyerSignupError('Passwords do not match');
      return;
    }
    setLawyerSignupLoading(true);
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/register/lawyer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: lawyerSignupData.name,
            username: lawyerSignupData.username,
            barCouncilNumber: lawyerSignupData.barCouncilNumber,
            email: lawyerSignupData.email,
            password: lawyerSignupData.password
          })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
          throw new Error(err.detail || 'Registration failed');
        }
        setLawyerSignupLoading(false);
        navigate('/');
      } catch (err) {
        setLawyerSignupLoading(false);
        setLawyerSignupError(err.message || 'Registration failed');
      }
    })();
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmail(forgotEmail)) {
      setForgotStatus('error');
      return;
    }
    setForgotStatus('sending');
    try {
      const res = await fetch(`${API_BASE}/auth/forgot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      if (!res.ok) throw new Error('Failed to send reset');
      setForgotStatus('sent');
    } catch (err) {
      setForgotStatus('error');
    }
  };

  // Reset password effect to get token from URL
  useEffect(() => {
    if (currentView === 'resetPassword') {
      const tokenFromUrl = searchParams.get('token');
      if (tokenFromUrl) {
        setResetToken(tokenFromUrl);
      } else {
        setResetStatus('error');
        setResetMessage('Invalid reset link. Token is missing.');
      }
    }
  }, [currentView, searchParams]);

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetStatus('sending');
    setResetMessage('');

    // Validate passwords
    const passwordError = validatePassword(resetPassword);
    if (passwordError) {
      setResetStatus('error');
      setResetMessage(passwordError);
      return;
    }

    if (resetPassword !== resetConfirmPassword) {
      setResetStatus('error');
      setResetMessage('Passwords do not match');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: resetToken,
          new_password: resetPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResetStatus('success');
        setResetMessage('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setResetStatus('error');
        // Handle different error response formats
        let errorMessage = 'Failed to reset password';
        
        if (typeof data.detail === 'string') {
          errorMessage = data.detail;
        } else if (Array.isArray(data.detail)) {
          // Handle validation errors
          errorMessage = data.detail.map(err => err.msg || err.message || 'Validation error').join(', ');
        } else if (data.message) {
          errorMessage = data.message;
        }
        
        setResetMessage(errorMessage);
      }
    } catch (error) {
      setResetStatus('error');
      setResetMessage('Network error. Please try again.');
    }
  };

  return (
    <div className="login-page" style={{
      backgroundImage: `url('/Background.png')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed'
    }}>
      <div className="header">
        <div className="logo-container">
          <img src="/logo.png" alt="OKIL AI" className="logo" />
          <span className="logo-text">OKIL AI</span>
        </div>
      </div>

      <div className="main-content">
        <div className="login-card">
          {currentView === 'signupUser' && (
            <>
              <div className="welcome-section signup-welcome">
                <div className="welcome-content">
                  <h1 className="signup-welcome-title">Sign up as User</h1>
                  <p className="signup-welcome-subtitle">
                    Sign up to create user account, get started for legal consultation.
                  </p>
                </div>
              </div>

              <div className="form-section">
                <div className="form-container">
                  <form onSubmit={handleSignupSubmit} className="signup-user-form">
                    <div className="form-group">
                      <label htmlFor="name" className="form-label">Name</label>
                      <div className="input-container">
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={signupData.name}
                          onChange={handleSignupInputChange}
                          placeholder="Enter your full name"
                          className="form-input"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="username" className="form-label">Username</label>
                      <div className="input-container">
                        <input
                          type="text"
                          id="username"
                          name="username"
                          value={signupData.username}
                          onChange={handleSignupInputChange}
                          placeholder="Enter your Username"
                          className="form-input"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="email" className="form-label">Email Address / Username</label>
                      <div className="input-container">
                        <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#9CA3AF" strokeWidth="2"/>
                          <path d="M22 6L12 13 2 6" stroke="#9CA3AF" strokeWidth="2"/>
                        </svg>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={signupData.email}
                          onChange={handleSignupInputChange}
                          placeholder="Enter your email or Username"
                          className="form-input"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="password" className="form-label">Password</label>
                      <div className="input-container">
                        <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="#9CA3AF" strokeWidth="2"/>
                          <circle cx="12" cy="16" r="1" fill="#9CA3AF"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#9CA3AF" strokeWidth="2"/>
                        </svg>
                        <input
                          type={showPassword ? "text" : "password"}
                          id="password"
                          name="password"
                          value={signupData.password}
                          onChange={handleSignupInputChange}
                          placeholder="Enter your password"
                          className="form-input"
                          required
                        />
                        <button 
                          type="button" 
                          className="password-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#9CA3AF" strokeWidth="2"/>
                            <circle cx="12" cy="12" r="3" stroke="#9CA3AF" strokeWidth="2"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="confirmPassword" className="form-label">Re-enter password</label>
                      <div className="input-container">
                        <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="#9CA3AF" strokeWidth="2"/>
                          <circle cx="12" cy="16" r="1" fill="#9CA3AF"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#9CA3AF" strokeWidth="2"/>
                        </svg>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          id="confirmPassword"
                          name="confirmPassword"
                          value={signupData.confirmPassword}
                          onChange={handleSignupInputChange}
                          placeholder="Re-enter your password"
                          className="form-input"
                          required
                        />
                        <button 
                          type="button" 
                          className="password-toggle"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#9CA3AF" strokeWidth="2"/>
                            <circle cx="12" cy="12" r="3" stroke="#9CA3AF" strokeWidth="2"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    <SignupLoginLink />

                    {signupError && <div className="form-error">{signupError}</div>}
                    <button type="submit" className="signup-button" disabled={signupLoading}>
                      {signupLoading ? 'Creating…' : 'Sign up'}
                    </button>
                  </form>
                </div>
              </div>
            </>
          )}

          {currentView === 'signupLawyer' && (
            <>
              <div className="welcome-section signup-welcome">
                <div className="welcome-content">
                  <h1 className="signup-welcome-title">Sign up as Lawyer</h1>
                  <p className="signup-welcome-subtitle">
                    Sign up to create lawyer account, get started providing legal consultation.
                  </p>
                </div>
              </div>

              <div className="form-section">
                <div className="form-container">
                  <form onSubmit={handleLawyerSignupSubmit} className="signup-lawyer-form">
                    <div className="form-group">
                      <label htmlFor="lawyer-name" className="form-label">Name</label>
                      <div className="input-container">
                        <input
                          type="text"
                          id="lawyer-name"
                          name="name"
                          value={lawyerSignupData.name}
                          onChange={handleLawyerSignupInputChange}
                          placeholder="Enter your full name"
                          className="form-input"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="lawyer-username" className="form-label">Username</label>
                      <div className="input-container">
                        <input
                          type="text"
                          id="lawyer-username"
                          name="username"
                          value={lawyerSignupData.username}
                          onChange={handleLawyerSignupInputChange}
                          placeholder="Enter your Username"
                          className="form-input"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="bar-council-number" className="form-label">BAR council number</label>
                      <div className="input-container">
                        <input
                          type="text"
                          id="bar-council-number"
                          name="barCouncilNumber"
                          value={lawyerSignupData.barCouncilNumber}
                          onChange={handleLawyerSignupInputChange}
                          placeholder="Enter your BAR council number"
                          className="form-input"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="lawyer-email" className="form-label">Email Address / Username</label>
                      <div className="input-container">
                        <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#9CA3AF" strokeWidth="2"/>
                          <path d="M22 6L12 13 2 6" stroke="#9CA3AF" strokeWidth="2"/>
                        </svg>
                        <input
                          type="email"
                          id="lawyer-email"
                          name="email"
                          value={lawyerSignupData.email}
                          onChange={handleLawyerSignupInputChange}
                          placeholder="Enter your email or Username"
                          className="form-input"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="lawyer-password" className="form-label">Password</label>
                      <div className="input-container">
                        <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="#9CA3AF" strokeWidth="2"/>
                          <circle cx="12" cy="16" r="1" fill="#9CA3AF"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#9CA3AF" strokeWidth="2"/>
                        </svg>
                        <input
                          type={showPassword ? "text" : "password"}
                          id="lawyer-password"
                          name="password"
                          value={lawyerSignupData.password}
                          onChange={handleLawyerSignupInputChange}
                          placeholder="Enter your password"
                          className="form-input"
                          required
                        />
                        <button 
                          type="button" 
                          className="password-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#9CA3AF" strokeWidth="2"/>
                            <circle cx="12" cy="12" r="3" stroke="#9CA3AF" strokeWidth="2"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="lawyer-confirm-password" className="form-label">Re-enter password</label>
                      <div className="input-container">
                        <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="#9CA3AF" strokeWidth="2"/>
                          <circle cx="12" cy="16" r="1" fill="#9CA3AF"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#9CA3AF" strokeWidth="2"/>
                        </svg>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          id="lawyer-confirm-password"
                          name="confirmPassword"
                          value={lawyerSignupData.confirmPassword}
                          onChange={handleLawyerSignupInputChange}
                          placeholder="Re-enter your password"
                          className="form-input"
                          required
                        />
                        <button 
                          type="button" 
                          className="password-toggle"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#9CA3AF" strokeWidth="2"/>
                            <circle cx="12" cy="12" r="3" stroke="#9CA3AF" strokeWidth="2"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    <SignupLoginLink />

                    {lawyerSignupError && <div className="form-error">{lawyerSignupError}</div>}
                    <button type="submit" className="signup-button" disabled={lawyerSignupLoading}>
                      {lawyerSignupLoading ? 'Creating…' : 'Sign up'}
                    </button>
                  </form>
                </div>
              </div>
            </>
          )}

          {currentView === 'main' && (
            <>
              <div className="welcome-section">
                <div className="welcome-content">
                  <h1 className="welcome-title">Welcome To OKIL AI</h1>
                  <p className="welcome-subtitle">
                    Sign in to your OKIL AI account. Your trusted partner in legal consultation.
                  </p>
                </div>
              </div>

              <div className="form-section">
                <div className="form-container">
                  <Tabs />

                  {activeTab === 'login' ? (
                    <form onSubmit={handleSubmit} className="login-form">
                      <div className="form-group">
                        <label htmlFor="email" className="form-label">Email Address / Username</label>
                        <div className="input-container">
                          <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#9CA3AF" strokeWidth="2"/>
                            <path d="M22 6L12 13 2 6" stroke="#9CA3AF" strokeWidth="2"/>
                          </svg>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="Enter your email or Username"
                            className="form-input"
                            required
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="password" className="form-label">Password</label>
                        <div className="input-container">
                          <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="#9CA3AF" strokeWidth="2"/>
                            <circle cx="12" cy="16" r="1" fill="#9CA3AF"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#9CA3AF" strokeWidth="2"/>
                          </svg>
                          <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="Enter your password"
                            className="form-input"
                            required
                          />
                          <button 
                            type="button" 
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#9CA3AF" strokeWidth="2"/>
                              <circle cx="12" cy="12" r="3" stroke="#9CA3AF" strokeWidth="2"/>
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="form-options">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            name="rememberMe"
                            checked={formData.rememberMe}
                            onChange={handleInputChange}
                            className="checkbox"
                          />
                          <span className="checkmark"></span>
                          Remember me
                        </label>
                        <Link to="/forgot-password" className="forgot-password">Forgot password?</Link>
                      </div>

                      <button type="submit" className="login-button">Log in</button>
                    </form>
                  ) : (
                    <SignupOptions />
                  )}
                </div>
              </div>
            </>
          )}

          {currentView === 'forgotPassword' && (
            <>
              <div className="welcome-section" style={{ backgroundColor: '#3B4F92' }}>
                <div className="welcome-content">
                  <h1 className="welcome-title" style={{ color: '#4ECDBC' }}>Forget Password?</h1>
                  <p className="welcome-subtitle" style={{ color: 'white' }}>
                    Get a reset link
                  </p>
                </div>
              </div>

              <div className="form-section">
                <div className="form-container">
                  {forgotStatus === 'sent' ? (
                    <div className="forgot-success">
                      <p>If an account with <strong>{forgotEmail}</strong> exists, a password reset link has been sent.</p>
                      <p>Check your inbox and follow the instructions to reset your password.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleForgotSubmit} className="forgot-form">
                      <div className="form-group">
                        <label className="form-label" htmlFor="forgot-email">Email Address</label>
                        <div className="input-container">
                          <input
                            id="forgot-email"
                            type="email"
                            value={forgotEmail}
                            onChange={(e) => { setForgotEmail(e.target.value); setForgotStatus('idle'); }}
                            placeholder="Enter Email Address"
                            className="form-input"
                            required
                          />
                        </div>
                      </div>

                      {forgotStatus === 'error' && (
                        <div className="form-error">Please enter a valid email address.</div>
                      )}

                      <button type="submit" className="login-button" disabled={forgotStatus === 'sending'}>
                        {forgotStatus === 'sending' ? 'Sending...' : 'Send Link'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </>
          )}

          {currentView === 'resetPassword' && (
            <>
              <div className="welcome-section" style={{ backgroundColor: '#3B4F92' }}>
                <div className="welcome-content">
                  <h1 className="welcome-title" style={{ color: '#4ECDBC' }}>Create New Password</h1>
                  <p className="welcome-subtitle" style={{ color: 'white' }}>
                    Enter and confirm your new password to secure your Okil AI account
                  </p>
                </div>
              </div>

              <div className="form-section">
                <div className="form-container">
                  {resetStatus === 'success' ? (
                    <div className="reset-success" style={{
                      textAlign: 'center',
                      color: '#28a745',
                      padding: '2rem',
                      backgroundColor: '#d4edda',
                      border: '1px solid #c3e6cb',
                      borderRadius: '8px'
                    }}>
                      <h3>Password Reset Successful!</h3>
                      <p>{resetMessage}</p>
                    </div>
                  ) : resetStatus === 'error' && !resetToken ? (
                    <div className="reset-error" style={{
                      textAlign: 'center',
                      color: '#dc3545',
                      padding: '2rem',
                      backgroundColor: '#f8d7da',
                      border: '1px solid #f5c6cb',
                      borderRadius: '8px'
                    }}>
                      <h3>Invalid Reset Link</h3>
                      <p>{resetMessage}</p>
                      <button 
                        onClick={() => navigate('/')}
                        style={{
                          marginTop: '1rem',
                          padding: '0.75rem 1.5rem',
                          backgroundColor: '#3B4F92',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        Go to Login
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h2 style={{ 
                        marginBottom: '1.5rem', 
                        color: '#333',
                        fontSize: '1.5rem',
                        fontWeight: 'bold'
                      }}>
                        Reset Password
                      </h2>
                      
                      <form onSubmit={handleResetSubmit} className="reset-form">
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                          <label className="form-label" htmlFor="new-password" style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            color: '#333',
                            fontWeight: '500'
                          }}>
                            New Password
                          </label>
                          <input
                            id="new-password"
                            type="password"
                            value={resetPassword}
                            onChange={(e) => setResetPassword(e.target.value)}
                            placeholder="Enter your new password"
                            className="form-input"
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              border: '1px solid #ddd',
                              borderRadius: '8px',
                              fontSize: '1rem',
                              boxSizing: 'border-box'
                            }}
                            required
                          />
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                          <label className="form-label" htmlFor="confirm-password" style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            color: '#333',
                            fontWeight: '500'
                          }}>
                            Confirm New Password
                          </label>
                          <input
                            id="confirm-password"
                            type="password"
                            value={resetConfirmPassword}
                            onChange={(e) => setResetConfirmPassword(e.target.value)}
                            placeholder="Re-enter your new password"
                            className="form-input"
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              border: '1px solid #ddd',
                              borderRadius: '8px',
                              fontSize: '1rem',
                              boxSizing: 'border-box'
                            }}
                            required
                          />
                        </div>

                        {resetStatus === 'error' && resetMessage && (
                          <div className="form-error" style={{
                            color: '#dc3545',
                            fontSize: '0.875rem',
                            marginBottom: '1rem',
                            padding: '0.5rem',
                            backgroundColor: '#f8d7da',
                            border: '1px solid #f5c6cb',
                            borderRadius: '4px'
                          }}>
                            {resetMessage}
                          </div>
                        )}

                        <button 
                          type="submit" 
                          className="login-button"
                          disabled={resetStatus === 'sending'}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            backgroundColor: resetStatus === 'sending' ? '#6c757d' : '#3B4F92',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: '500',
                            cursor: resetStatus === 'sending' ? 'not-allowed' : 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                        >
                          {resetStatus === 'sending' ? 'Resetting...' : 'Update Password'}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
