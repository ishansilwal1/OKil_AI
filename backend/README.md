# Backend API quick guide

Base URL: `http://localhost:8000`

Auth: Use `/auth/login` to obtain `access_token` and send as `Authorization: Bearer <token>`.

## Lawyers

- `GET /lawyers` — List registered lawyers

- `GET /lawyers/{lawyer_id}/availability` — Public upcoming, not-booked slots for a lawyer

- `POST /lawyers/availability` — Add an availability slot (lawyer only)
	- Body:
	```json
	{
		"start_at": "2025-11-05T14:30:00Z",
		"end_at": "2025-11-05T15:00:00Z"
	}
	```

## Appointments

- `POST /appointments` — Create appointment (user)
	- Prefer booking by slot id:
	```json
	{
		"lawyer_id": 5,
		"slot_id": 12,
		"message": "Short description"
	}
	```
	- Or fallback to a specific datetime (will be validated against conflicts):
	```json
	{
		"lawyer_id": 5,
		"preferred_at": "2025-11-05T14:30:00Z",
		"message": "Short description"
	}
	```

- `GET /appointments` — List appointments for current user or lawyer

## Queries

- `POST /queries` — Create query (user)
	```json
	{
		"title": "Need help on rental agreement",
		"content": "My situation is...",
		"lawyer_id": 5
	}
	```

- `GET /queries` — List queries for current user or lawyer

