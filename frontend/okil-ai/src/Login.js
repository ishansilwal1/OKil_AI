import React, { useState } from "react";
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentView, setCurrentView] = useState('main');
  
  const [signupData, setSignupData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [lawyerSignupData, setLawyerSignupData] = useState({
    name: '',
    username: '',
    barCouncilNumber: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

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
    console.log('Login attempt:', formData);
  };

  const handleSignupSubmit = (e) => {
    e.preventDefault();
    console.log('Signup attempt:', signupData);
  };

  const handleLawyerSignupSubmit = (e) => {
    e.preventDefault();
    console.log('Lawyer signup attempt:', lawyerSignupData);
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

                    <div className="signup-login-link">
                      <span>Already have an account? </span>
                      <button 
                        type="button" 
                        className="login-link"
                        onClick={() => {
                          setCurrentView('main');
                          setActiveTab('login');
                        }}
                      >
                        Login
                      </button>
                    </div>

                    <button type="submit" className="signup-button">Sign up</button>
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

                    <div className="signup-login-link">
                      <span>Already have an account? </span>
                      <button 
                        type="button" 
                        className="login-link"
                        onClick={() => {
                          setCurrentView('main');
                          setActiveTab('login');
                        }}
                      >
                        Login
                      </button>
                    </div>

                    <button type="submit" className="signup-button">Sign up</button>
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
                  <div className="tabs">
                    <button 
                      className={`tab ${activeTab === 'login' ? 'active' : ''}`}
                      onClick={() => setActiveTab('login')}
                    >
                      Login
                    </button>
                    <button 
                      className={`tab ${activeTab === 'register' ? 'active' : ''}`}
                      onClick={() => setActiveTab('register')}
                    >
                      Register
                    </button>
                  </div>

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
                        <a href="#" className="forgot-password">Forgot password?</a>
                      </div>

                      <button type="submit" className="login-button">Log in</button>
                    </form>
                  ) : (
                    <div className="signup-options">
                      <div className="signup-content">
                        <p className="signup-description">
                          Choose your account type to get started with OKIL AI
                        </p>
                        <div className="signup-buttons">
                          <button 
                            type="button" 
                            className="signup-option-button"
                            onClick={() => setCurrentView('signupUser')}
                          >
                            Sign Up as User
                          </button>
                          <button 
                            type="button" 
                            className="signup-option-button"
                            onClick={() => setCurrentView('signupLawyer')}
                          >
                            Sign Up as Lawyer
                          </button>
                        </div>
                      </div>
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

export default Login;
