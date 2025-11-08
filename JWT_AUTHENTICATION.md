# JWT Authentication Implementation

## Overview
Complete JWT (JSON Web Token) authentication system for OKIL AI legal assistant application.

## Components Implemented

### 1. Backend (FastAPI)

#### Authentication Files
- **`backend/app/auth.py`**: Main authentication router with JWT endpoints
  - `POST /login`: Login with JWT token generation
  - `POST /register`: User registration  
  - `GET /me`: Get current user profile (protected)
  - `POST /verify-token`: Verify JWT token validity (protected)
  - `get_current_user()`: Dependency for protecting routes

- **`backend/app/utils.py`**: JWT utility functions
  - `create_jwt_token()`: Generate JWT with HS256 algorithm
  - `decode_jwt_token()`: Verify and decode JWT tokens
  - Uses python-jose[cryptography] library

#### Protected API Endpoints
- **`backend/app/api/v1/legal_chat.py`**: Legal chat endpoint
  - `POST /api/v1/legal/chat`: Requires JWT authentication
  - Validates token using `get_current_user()` dependency
  - Returns 401 Unauthorized for invalid/missing tokens

#### Configuration (.env)
```env
SECRET_KEY=your-super-secret-key-here-minimum-32-characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### 2. Frontend (React)

#### Authentication Flow
1. **Login (`Auth.jsx`)**:
   - User enters credentials
   - Backend returns JWT token + user data
   - Token stored in `localStorage.okil_token`
   - User data stored in `localStorage.okil_user`
   - Redirects to `/dashboard`

2. **Protected Routes (`Routs.jsx`)**:
   - `ProtectedRoute` component checks for token
   - Redirects to `/login` if no token found

3. **API Requests (`UserDashboard.jsx`)**:
   - All API calls include `Authorization: Bearer <token>` header
   - Token automatically retrieved from localStorage
   - Handles 401 errors by clearing token and redirecting to login

## Security Features

### Token Security
- **HS256 Algorithm**: Industry-standard HMAC with SHA-256
- **24-Hour Expiration**: Tokens auto-expire after 1440 minutes
- **Secure Storage**: Tokens stored in browser localStorage
- **Bearer Authentication**: Standard HTTP Authorization header

### Protected Endpoints
- Legal chat API requires valid JWT
- User profile endpoints require authentication
- Automatic logout on token expiration/invalidity

### Password Security
- Passwords hashed with SHA-256 (should upgrade to bcrypt/argon2)
- Never transmitted in plain text after initial login

## API Usage Examples

### 1. Login and Get Token
```bash
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com",
    "role": "user"
  }
}
```

### 2. Access Protected Endpoint
```bash
curl -X POST http://localhost:8000/api/v1/legal/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{"message": "What is the constitution?", "history": [], "top_k": 3}'
```

### 3. Verify Token
```bash
curl -X POST http://localhost:8000/verify-token \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### 4. Get User Profile
```bash
curl -X GET http://localhost:8000/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

## Token Structure

JWT payload contains:
```json
{
  "sub": "user@example.com",      // Subject (user email)
  "user_id": 1,                    // User ID from database
  "role": "user",                  // User role (user/lawyer)
  "exp": 1699401600                // Expiration timestamp
}
```

## Error Handling

### Frontend
- **401 Unauthorized**: Clears token, redirects to login
- **Network errors**: Shows error message in chat
- **Invalid token**: Automatic logout

### Backend
- **Missing token**: Returns 401 with "Invalid authentication credentials"
- **Invalid token**: Returns 401 with "Invalid authentication credentials"
- **Expired token**: Returns 401 with JWT expiration error
- **User not found**: Returns 401 with "User not found"

## Testing the Implementation

### 1. Test Registration
```javascript
// In browser console or Auth.jsx
fetch('http://localhost:8000/register', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    name: "Test User",
    username: "testuser",
    email: "test@example.com",
    password: "password123"
  })
})
```

### 2. Test Login
```javascript
fetch('http://localhost:8000/login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    email: "test@example.com",
    password: "password123"
  })
}).then(r => r.json()).then(console.log)
```

### 3. Test Protected Endpoint
```javascript
const token = localStorage.getItem('okil_token');
fetch('http://localhost:8000/api/v1/legal/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    message: "What is Article 1?",
    history: [],
    top_k: 3
  })
}).then(r => r.json()).then(console.log)
```

### 4. Test Token Verification
```javascript
const token = localStorage.getItem('okil_token');
fetch('http://localhost:8000/verify-token', {
  method: 'POST',
  headers: {'Authorization': `Bearer ${token}`}
}).then(r => r.json()).then(console.log)
```

## Dependencies

### Backend
```txt
python-jose[cryptography]==3.3.0  # JWT encoding/decoding
fastapi                            # Web framework
sqlalchemy                         # Database ORM
```

### Frontend
```json
{
  "react": "^18.0.0",
  "react-router-dom": "^6.0.0",
  "react-toastify": "^11.0.5"
}
```

## Future Enhancements

1. **Refresh Tokens**: Implement refresh token mechanism for seamless re-authentication
2. **Token Blacklist**: Add token revocation/blacklist for logout
3. **Password Hashing**: Upgrade from SHA-256 to bcrypt or argon2
4. **Rate Limiting**: Add rate limiting to prevent brute force attacks
5. **CORS Configuration**: Properly configure CORS for production
6. **HTTPS Only**: Enforce HTTPS in production for secure token transmission
7. **Token Rotation**: Implement automatic token rotation before expiration
8. **Multi-factor Authentication**: Add 2FA for enhanced security

## Production Checklist

- [ ] Change SECRET_KEY to strong random value (min 32 characters)
- [ ] Set secure CORS origins (no wildcard *)
- [ ] Enable HTTPS only
- [ ] Use environment variables for all secrets
- [ ] Set httpOnly cookies instead of localStorage (more secure)
- [ ] Add rate limiting on auth endpoints
- [ ] Implement token refresh mechanism
- [ ] Add comprehensive logging for security events
- [ ] Regular security audits
- [ ] Upgrade to bcrypt/argon2 for password hashing

## Troubleshooting

### "Invalid authentication credentials" Error
- Check if token exists in localStorage
- Verify token hasn't expired (24 hours)
- Ensure Authorization header format: `Bearer <token>`

### Token Not Being Sent
- Check if token is stored: `localStorage.getItem('okil_token')`
- Verify Authorization header in network tab
- Check for CORS issues in browser console

### Backend Not Validating Token
- Verify python-jose is installed: `pip list | grep jose`
- Check SECRET_KEY matches in .env
- Ensure ALGORITHM is "HS256"
- Check backend logs for JWT errors

## Summary

✅ **Complete JWT authentication implemented**
- Secure token generation with HS256
- Protected API endpoints with dependency injection
- Frontend token storage and automatic header inclusion
- Token verification and user profile endpoints
- Proper error handling and automatic logout
- 24-hour token expiration
- Ready for production with security enhancements
