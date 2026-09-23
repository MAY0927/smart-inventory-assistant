import argparse
from getpass import getpass
from sqlalchemy import select
from app.database import SessionLocal
from app.models.user import User
from app.security import hash_password

def main() -> None:
    parser = argparse.ArgumentParser(description="Create or update a STOW login account.")
    parser.add_argument("--email", required=True)
    parser.add_argument("--role", choices=("team", "judge"), required=True)
    args = parser.parse_args()
    password = getpass("Password: ")
    if len(password) < 12:
        raise SystemExit("Password must contain at least 12 characters.")
    if password != getpass("Confirm password: "):
        raise SystemExit("Passwords do not match.")
    email = args.email.strip().lower()
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == email))
        if user is None:
            user = User(email=email, password_hash=hash_password(password), role=args.role)
            db.add(user)
        else:
            user.password_hash = hash_password(password)
            user.role = args.role
            user.is_active = True
        db.commit()
    print(f"Account ready: {email} ({args.role})")

if __name__ == "__main__":
    main()
