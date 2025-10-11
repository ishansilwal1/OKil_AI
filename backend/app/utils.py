import json
import os
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone


def read_json(path):
	if not os.path.exists(path):
		return {}
	with open(path, 'r', encoding='utf-8') as f:
		try:
			return json.load(f)
		except Exception:
			return {}


def write_json(path, data):
	with open(path, 'w', encoding='utf-8') as f:
		json.dump(data, f, indent=2)


def hash_password(password: str, salt: str = None):
	if salt is None:
		salt = secrets.token_hex(16)
	hashed = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
	return f"{salt}${hashed.hex()}"


def verify_password(stored: str, provided: str) -> bool:
	try:
		salt, hashed = stored.split('$', 1)
	except ValueError:
		return False
	check = hashlib.pbkdf2_hmac('sha256', provided.encode(), salt.encode(), 100000).hex()
	return hmac.compare_digest(check, hashed)


def generate_token() -> str:
	return secrets.token_urlsafe(32)


def token_expiration(minutes: int = 60):
	return datetime.now(timezone.utc) + timedelta(minutes=minutes)

