import os
import smtplib
from email.message import EmailMessage
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
SMTP_USER = os.environ.get('SMTP_USER')
SMTP_PASS = os.environ.get('SMTP_PASS')
SMTP_FROM = os.environ.get('SMTP_FROM') or SMTP_USER


def send_email(to_email: str, subject: str, body: str, html: Optional[str] = None) -> None:
    if not SMTP_USER or not SMTP_PASS:
        # If SMTP not configured, raise so the caller can fallback or log
        raise RuntimeError('SMTP credentials are not configured')

    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = SMTP_FROM
    msg['To'] = to_email
    msg.set_content(body)
    if html:
        msg.add_alternative(html, subtype='html')

    # Use STARTTLS
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)
