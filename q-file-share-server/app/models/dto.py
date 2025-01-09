from pydantic import BaseModel
from fastapi import Form

from typing import List


class LoginRequest(BaseModel):
    email: str
    password: str


class SignUpRequest(BaseModel):
    name: str
    email: str
    password: str


class FileUploadDTO(BaseModel):
    init_vectors: List[str]
    file_names: List[str]
    file_sizes: List[int]
    file_types: List[str]
    file_signatures: List[str]
    dl_public_key: str
    kyber_key: str
    recipient_email: str
    expiration: int
    download_count: int
    anonymous: bool
    
    
class FileDownloadDTO(BaseModel):
    file_id: str
    kyber_key_pair: str


def file_upload_dto(
    init_vectors: List[str] = Form(..., alias="InitVector"),
    file_names: List[str] = Form(..., alias="FileNames"),
    file_sizes: List[int] = Form(..., alias="FileSizes"),
    file_types: List[str] = Form(..., alias="FileTypes"),
    file_signatures: List[str] = Form(..., alias="FileSignature"),
    dl_public_key=Form(..., alias="DLPublicKey"),
    kyber_key: str = Form(..., alias="KyberKey"),
    recipient_email: str = Form(..., alias="RecipientEmail"),
    expiration: str = Form(..., alias="Expiration"),
    download_count: int = Form(..., alias="DownloadCount"),
    anonymous: bool = Form(..., alias="Anonymous"),
) -> FileUploadDTO:
    return FileUploadDTO(
        init_vectors=init_vectors,
        file_names=file_names,
        file_sizes=file_sizes,
        file_types=file_types,
        file_signatures=file_signatures,
        dl_public_key=dl_public_key,
        kyber_key=kyber_key,
        recipient_email=recipient_email,
        expiration=expiration,
        download_count=download_count,
        anonymous=anonymous,
    )
