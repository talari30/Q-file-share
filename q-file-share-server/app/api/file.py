from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import JSONResponse, StreamingResponse
from typing import Dict, List

from app.auth.jwt_handler import get_access_token
from app.models.dto import FileDownloadDTO, FileUploadDTO, file_upload_dto
from app.models.response_models import (
    KyberKeyResponse,
    ActivitiesResponse,
    ReceivedFilesResponse,
    SharedFilesResponse,
)
from app.services.file_services import (
    get_kyber_key_details,
    get_files_actitvity,
    process_download_file,
    process_upload_files,
    retrieve_received_files,
    retrieve_shared_files,
)


router = APIRouter()

kyber_sk_details: Dict[str, str] = {}


@router.get("/kyber-key", response_model=List[KyberKeyResponse])
async def get_kyber_key(
    tokenPayload: str = Depends(get_access_token),
) -> JSONResponse:
    try:
        email = tokenPayload.get("email")
        kyber_key_details = get_kyber_key_details()
        kyber_sk_details[email] = kyber_key_details["s"]

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"t": kyber_key_details["t"], "seed": kyber_key_details["seed"]},
        )
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    except Exception:

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred.",
        )


@router.post("/upload")
async def upload_files(
    encrypted_file_buffers: List[UploadFile] = File(..., alias="EncryptedFileBuffers"),
    file_upload_dto: FileUploadDTO = Depends(file_upload_dto),
    tokenPayload: str = Depends(get_access_token),
) -> JSONResponse:
    try:
        user_email = tokenPayload.get("email")
        await process_upload_files(
            encrypted_file_buffers,
            file_upload_dto,
            kyber_sk_details[user_email],
            user_email,
        )
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"message": "Successful"},
        )
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred.",
        )


import json


@router.post("/download", response_class=StreamingResponse)
async def download_file(
    file_download_dto: FileDownloadDTO, tokenPayload: str = Depends(get_access_token)
) -> StreamingResponse:
    try:
        downloaded_file_data = await process_download_file(
            file_download_dto, tokenPayload.get("email")
        )
        kyber_public_key_data = json.dumps(downloaded_file_data["kyber_public_key"])

        return StreamingResponse(
            iter([downloaded_file_data["file_data"]]),
            media_type="application/octet-stream",
            headers={
                "Content-Disposition": f'attachment; filename="{downloaded_file_data["file_name"]}"',
                "X-Array-Data": kyber_public_key_data,
                "Access-Control-Expose-Headers": "Content-Disposition, X-Array-Data",
            },
        )
    except (ValueError, HTTPException) as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error.detail))
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred.",
        )


@router.get("/activity", response_model=List[ActivitiesResponse])
async def get_activity(
    tokenPayload: str = Depends(get_access_token),
) -> JSONResponse:
    try:
        file_activities = get_files_actitvity(tokenPayload.get("email"))
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "activities": file_activities,
            },
        )
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred.",
        )


@router.get("/received-files", response_model=List[ReceivedFilesResponse])
async def get_received_files(
    tokenPayload: str = Depends(get_access_token),
) -> JSONResponse:
    try:
        received_files: list = retrieve_received_files(tokenPayload.get("email"))
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "receivedFiles": received_files,
            },
        )
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(error)
        )
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred.",
        )


@router.get("/shared-files", response_model=List[SharedFilesResponse])
async def get_shared_files(
    tokenPayload: str = Depends(get_access_token),
) -> JSONResponse:
    try:
        shared_files: list = retrieve_shared_files(tokenPayload.get("email"))
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "sharedFiles": shared_files,
            },
        )
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(error)
        )
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred.",
        )
