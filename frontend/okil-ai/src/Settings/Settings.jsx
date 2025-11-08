import React, { useMemo, useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import './Settings.css';

export default function Settings() {
	const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

	const storedUser = useMemo(() => {
		try {
			return JSON.parse(localStorage.getItem('okil_user') || '{}');
		} catch {
			return {};
		}
	}, []);

	const role = (storedUser.role === 'lawyer') ? 'lawyer' : 'user';

	const [profile, setProfile] = useState({
		name: storedUser.name || '',
		contact: '', // not persisted on backend yet
		email: storedUser.email || '',
		expertise: storedUser.expertise || '',
	});

	// simple toast
	const [toast, setToast] = useState(null);
	const showToast = (msg, type = 'success') => {
		setToast({ msg, type });
		setTimeout(() => setToast(null), 3000);
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setProfile((p) => ({ ...p, [name]: value }));
	};

	const handleSave = async (e) => {
		e.preventDefault();
		// Persist locally for now; backend update endpoint not implemented
		const merged = { ...storedUser, name: profile.name, email: profile.email };
		if (role === 'lawyer') merged.expertise = profile.expertise || null;
		localStorage.setItem('okil_user', JSON.stringify(merged));
		showToast('Changes saved');
	};

	const handleDelete = () => {
		if (!window.confirm('Delete account? This action cannot be undone.')) return;
		// Placeholder: just sign out locally
		localStorage.removeItem('okil_token');
		localStorage.removeItem('okil_user');
		window.location.href = '/';
	};

	return (
		<div className="settings-wrapper">
			<Sidebar activeMenu="settings" />
			<main className="settings-main">
				<div className="settings-container">
					<h1 className="settings-title">Settings</h1>

					<section className="settings-section">
						<h2 className="section-heading">Profile</h2>

						<form onSubmit={handleSave} className="settings-form">
							<div className="form-group">
								<label className="form-label">Full Name</label>
								<input className="form-input" name="name" value={profile.name} onChange={handleChange} placeholder="Enter your full name" />
							</div>

							<div className="form-group">
								<label className="form-label">Contact Number</label>
								<input className="form-input" name="contact" value={profile.contact} onChange={handleChange} placeholder="Enter your contact number" />
							</div>

							{role === 'lawyer' && (
								<div className="form-group">
									<label className="form-label">Experties</label>
									<input className="form-input" name="expertise" value={profile.expertise} onChange={handleChange} placeholder="Enter your Experties" />
								</div>
							)}

							<div className="form-group">
								<label className="form-label">Email Address / Username</label>
								<input className="form-input" type="email" name="email" value={profile.email} onChange={handleChange} placeholder="Enter your email or Username" />
							</div>

							<h3 className="section-subheading">Change Password</h3>

							<div className="form-grid">
								<div className="form-group">
									<label className="form-label">Current Password</label>
									<input className="form-input" type="password" placeholder="Enter your password" />
								</div>
								<div />
								<div className="form-group">
									<label className="form-label">New Password</label>
									<input className="form-input" type="password" placeholder="enter your new password" />
								</div>
								<div className="form-group">
									<label className="form-label">Confirm New Password</label>
									<input className="form-input" type="password" placeholder="confirm new password" />
								</div>
							</div>

							<div className="settings-actions">
								<button className="primary-btn" type="submit">SAVE CHANGES</button>
								<button className="danger-btn" type="button" onClick={handleDelete}>DELETE ACCOUNT</button>
							</div>
						</form>
					</section>

					{toast && (
						<div className={`simple-toast ${toast.type}`}>{toast.msg}</div>
					)}
				</div>
			</main>
		</div>
	);
}

