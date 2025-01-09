from datetime import datetime

from typing import List
from pydantic import BaseModel, Field


class KyberKeyResponse(BaseModel):
    t: List[List[int]]
    seed: str


class ActivitiesResponse(BaseModel):
    email: str
    type: str


class ReceivedFilesResponse(BaseModel):
    file_id: str
    name: str
    size: int
    received_from: str
    received_on: str
    expiry: str
    download_count: int


class SharedFilesResponse(BaseModel):
    file_id: str
    name: str
    size: int
    sent_to: str
    sent_on: str
    expiry: str
    download_count: int
