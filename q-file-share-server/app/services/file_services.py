import base64
import json

from fastapi import HTTPException
from datetime import datetime, timezone, timedelta

from app.db.db_session import get_db_session
from app.models.db_models import Files, FileLogs, Users
from app.models.dto import FileUploadDTO, FileDownloadDTO
from app.models.response_models import (
    ActivitiesResponse,
    ReceivedFilesResponse,
    SharedFilesResponse,
)
from app.quantum_protocols.kyber import Kyber
from app.utils.file_handler import (
    encrypt_file_data,
    encrypt_client_file_data,
    decrypt_file_data,
    decrypt_client_file_data,
    generate_file_hash,
    get_file_hash_key,
    verify_file_signature,
)


def get_kyber_key_details():
    kyber = Kyber()
    key_pair = kyber.generate_key_pair()
    seed = base64.b64encode(key_pair["public_key"]["seed"]).decode(
        "utf-8", errors="ignore"
    )

    return {"t": key_pair["public_key"]["t"], "seed": seed, "s": key_pair["secret_key"]}


async def process_upload_files(
    encrypted_file_buffers: list,
    file_upload_dto: FileUploadDTO,
    secret_key: list,
    user_email: str,
) -> None:
    db = next(get_db_session())
    try:
        if file_upload_dto.recipient_email.strip() == user_email:
            raise ValueError("Cannot send to same email")

        emails_exist = (
            db.query(Users)
            .filter(Users.email.in_([file_upload_dto.recipient_email, user_email]))
            .count()
            == 2
        )
        if not emails_exist:
            raise ValueError("Cannot find the recipient email")

        kyber = Kyber()
        uv_kyber_key = json.loads(file_upload_dto.kyber_key)
        shared_key = kyber.cpa_decrypt(secret_key, uv_kyber_key)

        dl_file_signatures = [
            json.loads(signature) for signature in (file_upload_dto.file_signatures)
        ]

        dl_public_key = json.loads(file_upload_dto.dl_public_key)
        file_logs = list()

        for index in range(len(encrypted_file_buffers)):
            file_data = await decrypt_client_file_data(
                encrypted_file_buffers[index],
                file_upload_dto.init_vectors[index],
                shared_key,
            )

            is_valid_file = verify_file_signature(
                file_data, dl_file_signatures[index], dl_public_key
            )
            if not is_valid_file:
                raise ValueError("Corrupted file, please check and re-upload")

            file_hash = generate_file_hash(file_data)
            encrypted_file_data = await encrypt_file_data(
                file_data,
                get_file_hash_key(file_upload_dto.recipient_email, user_email),
            )

            if not db.query(Files).filter(Files.file_id == file_hash).first():
                new_file = Files(
                    file_id=file_hash,
                    file_data=encrypted_file_data["encrypted_file_data"],
                    iv=encrypted_file_data["iv"],
                )

                db.add(new_file)
                db.commit()

            expiry_timestamp = datetime.now(timezone.utc) + timedelta(
                days=file_upload_dto.expiration
            )

            file_logs.append(
                FileLogs(
                    name=file_upload_dto.file_names[index],
                    size=file_upload_dto.file_sizes[index],
                    from_email=user_email,
                    to_email=file_upload_dto.recipient_email,
                    sent_on=datetime.now(timezone.utc),
                    expiry=expiry_timestamp,
                    download_count=file_upload_dto.download_count,
                    updated_download_count=file_upload_dto.download_count,
                    file_id=file_hash,
                    is_anonymous=file_upload_dto.anonymous,
                    status="active",
                )
            )

        db.add_all(file_logs)
        db.commit()

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=400, detail="Invalid JSON format in FileSignature"
        )
    except ValueError as error:
        raise ValueError(str(error))
    except Exception as error:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(error))


async def process_download_file(
    file_download_dto: FileDownloadDTO, user_email: str
) -> dict:
    db = next(get_db_session())
    try:
        file_log = (
            db.query(FileLogs)
            .filter(
                (
                    (FileLogs.from_email == user_email)
                    | (FileLogs.to_email == user_email)
                )
                & (FileLogs.public_id == file_download_dto.file_id)
            )
            .first()
        )
        if not file_log:
            raise HTTPException(status_code=404, detail="Record not found")
        if file_log.updated_download_count < 1:
            raise HTTPException(status_code=400, detail="Download limit reached.")

        existing_file = (
            db.query(Files).filter(Files.file_id == file_log.file_id).first()
        )
        if not existing_file:
            raise HTTPException(status_code=404, detail="File not found")

        decrypted_file_data = await decrypt_file_data(
            existing_file.file_data,
            existing_file.iv,
            get_file_hash_key(file_log.to_email, file_log.from_email),
        )

        kyber = Kyber()
        ts_kyber_key = json.loads(file_download_dto.kyber_key_pair)
        kyber_public_key = kyber.cpa_encrypt(
            ts_kyber_key["t"], base64.b64decode(ts_kyber_key["seed"])
        )

        encrypted_file_data = await encrypt_client_file_data(
            decrypted_file_data, kyber_public_key["key"]
        )

        if file_log.to_email == user_email:
            file_log.updated_download_count -= 1
        db.commit()
        db.refresh(file_log)

        return {
            "file_data": encrypted_file_data["encryptedFileBuffer"],
            "kyber_public_key": {
                "u": kyber_public_key["u"],
                "v": kyber_public_key["v"],
                "iv": encrypted_file_data["iv"],
            },
            "file_name": file_log.name,
        }

    except ValueError as error:
        raise ValueError(str(error))
    except HTTPException as error:
        raise error
    except Exception as error:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(error))


def get_files_actitvity(user_email: str):
    db = next(get_db_session())
    file_logs = (
        db.query(FileLogs)
        .filter((FileLogs.from_email == user_email) | (FileLogs.to_email == user_email))
        .order_by(FileLogs.sent_on.desc())
        .limit(10)
        .all()
    )
    return [
        ActivitiesResponse(
            email=(
                "*"
                if file_log.is_anonymous
                else (
                    file_log.to_email
                    if file_log.from_email == user_email
                    else file_log.from_email
                )
            ),
            type="send" if file_log.from_email == user_email else "receive",
        ).model_dump()
        for file_log in file_logs
    ]


def retrieve_received_files(user_email: str) -> str:
    db = next(get_db_session())
    file_logs = (
        db.query(
            FileLogs.name,
            FileLogs.size,
            FileLogs.sent_on,
            FileLogs.from_email,
            FileLogs.expiry,
            FileLogs.is_anonymous,
            FileLogs.updated_download_count,
            FileLogs.public_id,
        )
        .filter(
            FileLogs.to_email == user_email,
            FileLogs.status == "active",
            FileLogs.expiry > datetime.now(),
        )
        .order_by(FileLogs.sent_on.desc())
        .all()
    )

    return [
        ReceivedFilesResponse(
            name=file_log.name,
            size=file_log.size,
            received_on=file_log.sent_on.isoformat(),
            received_from=file_log.from_email if not file_log.is_anonymous else "*",
            expiry=file_log.expiry.isoformat(),
            download_count=file_log.updated_download_count,
            file_id=file_log.public_id,
        ).model_dump()
        for file_log in file_logs
    ]


def retrieve_shared_files(user_email: str) -> str:
    db = next(get_db_session())
    file_logs = (
        db.query(
            FileLogs.name,
            FileLogs.size,
            FileLogs.sent_on,
            FileLogs.to_email,
            FileLogs.expiry,
            FileLogs.is_anonymous,
            FileLogs.download_count,
            FileLogs.public_id,
        )
        .filter(
            FileLogs.from_email == user_email,
            FileLogs.status == "active",
            FileLogs.expiry > datetime.now(),
        )
        .order_by(FileLogs.sent_on.desc())
        .all()
    )

    return [
        SharedFilesResponse(
            name=file_log.name,
            size=file_log.size,
            sent_on=file_log.sent_on.isoformat(),
            sent_to=file_log.to_email if not file_log.is_anonymous else "*",
            expiry=file_log.expiry.isoformat(),
            download_count=file_log.download_count,
            file_id=file_log.public_id,
        ).model_dump()
        for file_log in file_logs
    ]
