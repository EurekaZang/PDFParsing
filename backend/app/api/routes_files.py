from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.auth import get_current_user
from app.schemas import ParseBatchResponse
from app.services.pdf_parser import parse_pdf_bytes

router = APIRouter(prefix="/api/files", tags=["files"])


@router.post("/parse", response_model=ParseBatchResponse)
async def parse_files(
    files: list[UploadFile] = File(...),
    current_user: str = Depends(get_current_user),
) -> ParseBatchResponse:
    del current_user
    for upload in files:
        if not upload.filename or not upload.filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF files are supported",
            )

    results = []
    for upload in files:
        content = await upload.read()
        results.append(parse_pdf_bytes(content, upload.filename or "uploaded.pdf"))
    return ParseBatchResponse(results=results)
