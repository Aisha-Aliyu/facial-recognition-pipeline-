import cloudinary
import cloudinary.uploader
import cloudinary.api
from app.core.config import get_settings
from typing import Tuple
import io

settings = get_settings()

cloudinary.config(
    cloud_name=settings.cloudinary_cloud_name,
    api_key=settings.cloudinary_api_key,
    api_secret=settings.cloudinary_api_secret,
    secure=True,
)


async def upload_image(contents: bytes, folder: str) -> Tuple[str, str]:
    result = cloudinary.uploader.upload(
        io.BytesIO(contents),
        folder=folder,
        resource_type="image",
        transformation=[
            {"width": 800, "height": 800, "crop": "limit"},
            {"quality": "auto:good"},
            {"fetch_format": "auto"},
        ],
    )
    return result["secure_url"], result["public_id"]


async def delete_image(public_id: str) -> None:
    cloudinary.uploader.destroy(public_id, resource_type="image")
