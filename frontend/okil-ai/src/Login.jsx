import React, { useState } from 'react';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    // For now just log — integrate with your auth later
    // eslint-disable-next-line no-console
    console.log({ email, password, remember });
    alert('Login attempted (check console)');
  };

  // use the bg image placed in public/ (bg.png)
  const bg = process.env.PUBLIC_URL + '/bg.png';

  return (
    <div className="login-page" style={{ backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="site-logo">
        <img src={process.env.PUBLIC_URL + '/logo.png'} alt="OKIL AI" />
        <span>OKIL AI</span>
      </div>

      <div className="login-card">
        <div className="left-panel">
          <div className="brand">OKIL AI</div>
          <h2>Welcome To OKIL AI</h2>
          <p>Sign in to your OKIL AI account. Your trusted partner in legal consultation.</p>
        </div>

        <div className="right-panel">
          <div className="tabs">
            <button className="tab active">Login</button>
            <button className="tab">Register</button>
          </div>

          <form className="login-form" onSubmit={submit}>
            <label className="field-label">Email Address / Username</label>
            <div className="input-group">
              <span className="icon">📧</span>
              <input
                type="text"
                placeholder="Enter your email or Username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <label className="field-label">Password</label>
            <div className="input-group">
              <span className="icon">🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="show-btn"
                onClick={() => setShowPassword((s) => !s)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>

            <div className="form-row">
              <label className="remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Remember me
              </label>
              <a className="forgot" href="#">Forgot password?</a>
            </div>

            <button className="primary-btn" type="submit">Login to Account</button>
          </form>
        </div>
      </div>
    </div>
  );
}
