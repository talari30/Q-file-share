import bcrypt

def hash_password(plaing_password: str) -> str:
    hashed_password = bcrypt.hashpw(plaing_password.encode('utf-8'), bcrypt.gensalt(rounds=15))
    return hashed_password.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
