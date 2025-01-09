import uuid

from app.db.config import Base

from sqlalchemy import Column, Integer, String, LargeBinary, Boolean, TIMESTAMP, func


class Users(Base):
    __tablename__ = "Users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    created_at = Column(TIMESTAMP)
    updated_at = Column(TIMESTAMP)


class Files(Base):
    __tablename__ = "Files"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(String, unique=True, nullable=False)
    file_data = Column(LargeBinary, nullable=False)
    iv = Column(String, nullable=False)


class FileLogs(Base):
    __tablename__ = "FileLogs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    size = Column(Integer, nullable=False)
    from_email = Column(String)
    to_email = Column(String)
    sent_on = Column(TIMESTAMP)
    expiry = Column(TIMESTAMP)
    download_count = Column(Integer, default=10)
    updated_download_count = Column(Integer, default=10)
    file_id = Column(String)
    public_id = Column(String, unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    is_anonymous = Column(Boolean, default=False)
    status = Column(String, default="active")
    updated_at = Column(TIMESTAMP, onupdate=func.now())
