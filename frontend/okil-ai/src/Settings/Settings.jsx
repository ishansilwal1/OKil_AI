import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import './Settings.css';

export default function Settings() {
	const navigate = useNavigate();
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
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
	});

	const [recentChats, setRecentChats] = useState([]);

	// Password visibility state
	const [showPasswords, setShowPasswords] = useState({
		current: false,
		new: false,
		confirm: false
	});

	const togglePasswordVisibility = (field) => {
		setShowPasswords(prev => ({
			...prev,
			[field]: !prev[field]
		}));
	};

	// simple toast
	const [toast, setToast] = useState(null);
	const showToast = (msg, type = 'success') => {
		setToast({ msg, type });
		setTimeout(() => setToast(null), 3000);
	};

	const loadRecentChats = useCallback(async () => {
		const token = localStorage.getItem('okil_token');
		if (!token) return;

		try {
			const response = await fetch(`${API_BASE}/api/v1/chat/sessions`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});

			if (!response.ok) {
				console.error('Failed to load recent chats');
				return;
			}

			const data = await response.json();
			setRecentChats(Array.isArray(data) ? data : []);
		} catch (error) {
			console.error('Error loading recent chats:', error);
		}
	}, [API_BASE]);

	// Load recent chats on mount
	useEffect(() => {
		loadRecentChats();
	}, [loadRecentChats]);

	const handleNewChat = () => {
		navigate('/user-dashboard');
	};

	const handleLoadChat = (chatId) => {
		navigate(`/user-dashboard?chatId=${chatId}`);
	};

	const handleDeleteChat = async (chatId) => {
		const token = localStorage.getItem('okil_token');
		if (!token) return;

		try {
			const response = await fetch(`${API_BASE}/api/v1/chat/sessions/${chatId}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});

			if (!response.ok) {
				showToast('Failed to delete chat', 'error');
				return;
			}

			// Remove from local state
			setRecentChats(prev => prev.filter(chat => chat.id !== chatId));
			showToast('Chat deleted successfully');
		} catch (error) {
			console.error('Error deleting chat:', error);
			showToast('Network error. Please try again.', 'error');
		}
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setProfile((p) => ({ ...p, [name]: value }));
	};

	const handleSave = async (e) => {
		e.preventDefault();
		
		const token = localStorage.getItem('okil_token');
		if (!token) {
			showToast('Not authenticated', 'error');
			return;
		}

		// Validate password fields if any are filled
		if (profile.currentPassword || profile.newPassword || profile.confirmPassword) {
			if (!profile.currentPassword || !profile.newPassword || !profile.confirmPassword) {
				showToast('Please fill all password fields to change password', 'error');
				return;
			}
			
			if (profile.newPassword !== profile.confirmPassword) {
				showToast('New passwords do not match', 'error');
				return;
			}
			
			if (profile.newPassword.length < 6) {
				showToast('New password must be at least 6 characters long', 'error');
				return;
			}
		}

		try {
			// Prepare update payload
			const updateData = {
				name: profile.name,
			};
			
			// Only include expertise for lawyers
			if (role === 'lawyer') {
				updateData.expertise = profile.expertise || null;
			}

			// Add password fields if changing password
			if (profile.currentPassword && profile.newPassword) {
				updateData.current_password = profile.currentPassword;
				updateData.new_password = profile.newPassword;
			}

			// Call backend API to update profile
			const res = await fetch(`${API_BASE}/auth/me`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify(updateData)
			});

			if (!res.ok) {
				const errorData = await res.json();
				showToast(errorData.detail || 'Failed to save changes', 'error');
				return;
			}

			const updatedUser = await res.json();
			
			// Update localStorage with the response from backend
			const merged = { ...storedUser, ...updatedUser };
			localStorage.setItem('okil_user', JSON.stringify(merged));
			
			// Clear password fields after successful update
			setProfile(prev => ({
				...prev,
				currentPassword: '',
				newPassword: '',
				confirmPassword: ''
			}));
			
			showToast('Changes saved successfully');
		} catch (e) {
			console.error('Error saving profile:', e);
			showToast('Network error. Please try again.', 'error');
		}
	};

	// Delete account modal state
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const openDeleteModal = () => setShowDeleteModal(true);
	const closeDeleteModal = () => setShowDeleteModal(false);
	const performDelete = async () => {
		const token = localStorage.getItem('okil_token');
		if (!token) {
			localStorage.removeItem('okil_user');
			window.location.href = '/';
			return;
		}
		try {
			const res = await fetch(`${API_BASE}/auth/me`, {
				method: 'DELETE',
				headers: { 'Authorization': `Bearer ${token}` }
			});
			if (!res.ok) {
				// surface error
				showToast('Failed to delete account', 'error');
				return;
			}
			localStorage.removeItem('okil_token');
			localStorage.removeItem('okil_user');
			window.location.href = '/';
		} catch (e) {
			showToast('Network error deleting account', 'error');
		}
	};

	return (
		<div className="settings-wrapper">
			<Sidebar 
				activeMenu="settings" 
				recentChats={recentChats}
				onNewChat={handleNewChat}
				onLoadChat={handleLoadChat}
				onDeleteChat={handleDeleteChat}
			/>
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
									<div className="input-container">
										<input 
											className="form-input" 
											type={showPasswords.current ? "text" : "password"}
											name="currentPassword"
											value={profile.currentPassword}
											onChange={handleChange}
											placeholder="Enter your current password" 
											style={{ paddingRight: '40px' }}
										/>
										<button
											type="button"
											className="password-toggle"
											onClick={() => togglePasswordVisibility('current')}
										>
											<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
												<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#9CA3AF" strokeWidth="2"/>
												<circle cx="12" cy="12" r="3" stroke="#9CA3AF" strokeWidth="2"/>
											</svg>
										</button>
									</div>
								</div>
								<div />
								<div className="form-group">
									<label className="form-label">New Password</label>
									<div className="input-container">
										<input 
											className="form-input" 
											type={showPasswords.new ? "text" : "password"}
											name="newPassword"
											value={profile.newPassword}
											onChange={handleChange}
											placeholder="Enter your new password" 
											style={{ paddingRight: '40px' }}
										/>
										<button
											type="button"
											className="password-toggle"
											onClick={() => togglePasswordVisibility('new')}
										>
											<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
												<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#9CA3AF" strokeWidth="2"/>
												<circle cx="12" cy="12" r="3" stroke="#9CA3AF" strokeWidth="2"/>
											</svg>
										</button>
									</div>
								</div>
								<div className="form-group">
									<label className="form-label">Confirm New Password</label>
									<div className="input-container">
										<input 
											className="form-input" 
											type={showPasswords.confirm ? "text" : "password"}
											name="confirmPassword"
											value={profile.confirmPassword}
											onChange={handleChange}
											placeholder="Confirm new password" 
											style={{ paddingRight: '40px' }}
										/>
										<button
											type="button"
											className="password-toggle"
											onClick={() => togglePasswordVisibility('confirm')}
										>
											<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
												<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#9CA3AF" strokeWidth="2"/>
												<circle cx="12" cy="12" r="3" stroke="#9CA3AF" strokeWidth="2"/>
											</svg>
										</button>
									</div>
								</div>
							</div>

							<div className="settings-actions">
								<button className="primary-btn" type="submit">SAVE CHANGES</button>
								<button className="danger-btn" type="button" onClick={openDeleteModal}>DELETE ACCOUNT</button>
							</div>
						</form>
					</section>

					{toast && (
						<div className={`simple-toast ${toast.type}`}>{toast.msg}</div>
					)}

					{showDeleteModal && (
						<div className="modal-overlay" role="dialog" aria-modal="true">
							<div className="modal-content danger">
								<div className="modal-header">Delete Account</div>
								<div className="modal-body">This action will permanently remove your account data. Are you sure you want to continue?</div>
								<div className="modal-actions">
									<button className="modal-btn confirm" onClick={performDelete}>Yes, Delete</button>
									<button className="modal-btn" onClick={closeDeleteModal}>Cancel</button>
								</div>
							</div>
						</div>
					)}
				</div>
			</main>
		</div>
	);
}

