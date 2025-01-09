import os
import base64
import hashlib
import secrets

from dotenv import load_dotenv
from fastapi import UploadFile
from typing import Dict

from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import padding
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

from app.quantum_protocols.dilithium import Dilithium

load_dotenv()

AES_SECRET_KEY = os.getenv("AES_SECRET_KEY")


async def encrypt_file_data(file_data: bytes, hash_key: str) -> dict:
    if not AES_SECRET_KEY:
        raise ValueError("Key not found in environment variables.")

    hash_key_bytes = hash_key.encode("utf-8")
    aes_secret_key_bytes = AES_SECRET_KEY.encode("utf-8")

    if len(hash_key_bytes) < 16 or len(aes_secret_key_bytes) < 16:
        raise ValueError("Invalid key, encryption failed.")

    encryption_key = hash_key_bytes[:16] + aes_secret_key_bytes[:16]
    iv = secrets.token_bytes(16)

    cipher = Cipher(
        algorithms.AES(encryption_key), modes.CBC(iv), backend=default_backend()
    )
    encryptor = cipher.encryptor()

    padder = padding.PKCS7(algorithms.AES.block_size).padder()
    padded_file_data = padder.update(file_data) + padder.finalize()
    encrypted_data = encryptor.update(padded_file_data) + encryptor.finalize()

    return {
        "iv": base64.b64encode(iv).decode("utf-8"),
        "encrypted_file_data": encrypted_data,
    }


async def decrypt_file_data(
    encrypted_file_data: bytes, iv: str, hash_key: str
) -> bytes:
    if not AES_SECRET_KEY:
        raise ValueError("Key not found in environment variables.")

    hash_key_bytes = hash_key.encode("utf-8")
    aes_secret_key_bytes = AES_SECRET_KEY.encode("utf-8")

    if len(hash_key_bytes) < 16 or len(aes_secret_key_bytes) < 16:
        raise ValueError("Keys must be at least 16 bytes.")

    decryption_key = hash_key_bytes[:16] + aes_secret_key_bytes[:16]
    iv_bytes = base64.b64decode(iv)

    cipher = Cipher(
        algorithms.AES(decryption_key), modes.CBC(iv_bytes), backend=default_backend()
    )
    decryptor = cipher.decryptor()

    decrypted_padded_data = decryptor.update(encrypted_file_data) + decryptor.finalize()

    unpadder = padding.PKCS7(algorithms.AES.block_size).unpadder()
    decrypted_data = unpadder.update(decrypted_padded_data) + unpadder.finalize()

    return decrypted_data


async def encrypt_client_file_data(file_data: bytes, key: list) -> Dict[str, str]:
    if len(key) != 256 or not all(bit == 0 or bit == 1 for bit in key):
        raise ValueError("Error during encryption")

    byte_key = bytes(
        int("".join(str(bit) for bit in key[i * 8 : i * 8 + 8]), 2) for i in range(24)
    )

    init_vector_bytes = os.urandom(16)

    padder = padding.PKCS7(128).padder()
    padded_data = padder.update(file_data) + padder.finalize()

    cipher = Cipher(
        algorithms.AES(byte_key),
        modes.CBC(init_vector_bytes),
        backend=default_backend(),
    )
    encryptor = cipher.encryptor()
    encrypted_file_data = encryptor.update(padded_data) + encryptor.finalize()

    return {
        "iv": base64.b64encode(init_vector_bytes).decode("utf-8"),
        "encryptedFileBuffer": encrypted_file_data,
    }


async def decrypt_client_file_data(
    encrypted_file: UploadFile, init_vector: str, key: list
) -> bytes:
    byte_key = bytes(
        int("".join(map(str, key[i * 8 : (i + 1) * 8])), 2) for i in range(24)
    )
    init_vector_bytes = base64.b64decode(init_vector)

    encrypted_data = await encrypted_file.read()
    cipher = Cipher(
        algorithms.AES(byte_key),
        modes.CBC(init_vector_bytes),
        backend=default_backend(),
    )
    decryptor = cipher.decryptor()
    decrypted_file_data = decryptor.update(encrypted_data) + decryptor.finalize()

    return decrypted_file_data


def get_file_hash_key(email1: str, email2: str) -> str:
    sorted_emails = sorted([email1, email2])
    concatenated_emails = "".join(sorted_emails)

    sha3_256 = hashlib.sha3_256()
    sha3_256.update(concatenated_emails.encode())

    return sha3_256.hexdigest()


def generate_file_hash(file_data: bytes) -> str:
    sha3_256 = hashlib.sha3_256()
    sha3_256.update(file_data)

    return sha3_256.hexdigest()


def verify_file_signature(file_data, dl_file_signature, dl_public_key) -> bool:
    dilithium = Dilithium()
    byte_length = min(1024, len(file_data))
    file_segment = file_data[:byte_length]

    return dilithium.verify_dilthium_signature(
        file_segment,
        [dl_file_signature["z"], base64.b64decode(dl_file_signature["cp"])],
        dl_public_key,
    )
