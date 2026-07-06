from fastapi import APIRouter, Depends
from fastapi.responses import Response

from app.auth import get_current_user
from app.schemas import ExportRequest
from app.services.excel_writer import build_workbook

router = APIRouter(prefix="/api/excel", tags=["excel"])

EXCEL_MEDIA_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


@router.post("/export")
def export_excel(
    payload: ExportRequest,
    current_user: str = Depends(get_current_user),
) -> Response:
    del current_user
    workbook_bytes = build_workbook(payload.results)
    return Response(
        content=workbook_bytes,
        media_type=EXCEL_MEDIA_TYPE,
        headers={"Content-Disposition": 'attachment; filename="purchase_orders.xlsx"'},
    )
