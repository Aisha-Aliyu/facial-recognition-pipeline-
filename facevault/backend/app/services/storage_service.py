import cloudinary
import cloudinary.uploader
from app.core.config import get_settings

settings = get_settings()

cloudinary.config(
    cloud_name=settings.cloudinary_cloud_name,
    api_key=settings.cloudinary_api_key,
    api_secret=settings.cloudinary_api_secret,
    secure=True,
)


def upload_face_image(file_bytes: bytes, public_id: str) -> dict:
    result = cloudinary.uploader.upload(
        file_bytes,
        public_id=public_id,
        folder="facevault/faces",
        resource_type="image",
        overwrite=True,
        transformation=[
            {"width": 512, "height": 512, "crop": "fill", "gravity": "face"},
            {"quality": "auto:best"},
            {"fetch_format": "auto"},
        ],
    )
    return {
        "url": result["secure_url"],
        "public_id": result["public_id"],
    }


def delete_face_image(public_id: str) -> bool:
    result = cloudinary.uploader.destroy(public_id, resource_type="image")
    return result.get("result") == "ok"
