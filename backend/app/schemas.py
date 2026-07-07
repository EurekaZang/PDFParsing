from typing import Literal

from pydantic import BaseModel, Field

ParseStatus = Literal["parsed", "warning", "failed"]


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LineItem(BaseModel):
    item: str = ""
    material: str = ""
    description: str = ""
    manufacturer_part_number: str = ""
    uom: str = ""
    total_qty: str = ""
    qty_recd: str = ""
    qty_retd: str = ""
    unit_price: str = ""
    item_value: str = ""
    due_date: str = ""
    warnings: list[str] = Field(default_factory=list)


class ParseResult(BaseModel):
    source_file: str
    po_number: str = ""
    po_date: str = ""
    ship_to: str = ""
    status: ParseStatus = "parsed"
    warnings: list[str] = Field(default_factory=list)
    error: str | None = None
    line_items: list[LineItem] = Field(default_factory=list)


class ParseBatchResponse(BaseModel):
    results: list[ParseResult]


class ExportRequest(BaseModel):
    results: list[ParseResult]
