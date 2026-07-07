from __future__ import annotations

import re
from io import BytesIO

import pdfplumber

from app.schemas import LineItem, ParseResult

PO_PATTERN = re.compile(
    r"PO number/date\s*\(MM/DD/YYYY\)\s*:\s*(?P<number>\d+)\s*/\s*(?P<date>\d{2}/\d{2}/\d{4})"
)

ITEM_PATTERN = re.compile(
    r"^\s*(?P<item>\d+)\s+"
    r"(?P<material>[A-Z0-9][A-Z0-9\-]*)\s+"
    r"(?P<uom>[A-Z]{1,5})\s+"
    r"(?P<total_qty>[\d,]+)\s+"
    r"(?P<qty_recd>[\d,]+)\s+"
    r"(?P<qty_retd>[\d,]+)\s+"
    r"(?P<unit_price>[\d,.]+)\s+"
    r"(?P<item_value>[\d,.]+)\s+"
    r"(?P<due_date>\d{2}/\d{2}/\d{4})\s*$"
)
ITEM_LIKE_PATTERN = re.compile(r"^\s*\d+\s+[A-Z][A-Z0-9\-]{3,}\b")

DESCRIPTION_STOP_PREFIXES = (
    "Manufacturer",
    "Material Group",
    "L/T",
    "Cancel L/T",
    "MOQ",
    "Order Inc",
    "Ship Routing",
    "For each delivery",
    "I/P",
    "Please ensure",
    "Delivery date changed",
    "Total net value",
)

SHIP_TO_STOP_MARKERS = ("Bill To", "Payment Terms", "Terms of delivery")


def parse_pdf_bytes(content: bytes, source_file: str) -> ParseResult:
    try:
        text = _extract_text_from_pdf(content)
    except Exception as exc:
        return ParseResult(
            source_file=source_file,
            status="failed",
            error=f"Unable to extract PDF text: {exc}",
        )

    if not text.strip():
        return ParseResult(
            source_file=source_file,
            status="failed",
            error="No extractable PDF text found; OCR is not supported in version 1",
        )
    return _parse_text(text, source_file)


def _extract_text_from_pdf(content: bytes) -> str:
    pages: list[str] = []
    with pdfplumber.open(BytesIO(content)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text(layout=True, x_tolerance=1, y_tolerance=3) or ""
            pages.append(page_text)
    return "\n\f\n".join(pages)


def _parse_text(text: str, source_file: str) -> ParseResult:
    po_match = PO_PATTERN.search(text)
    if not po_match:
        return ParseResult(
            source_file=source_file,
            status="failed",
            error="PO number/date not found",
        )

    lines = text.splitlines()
    ship_to = _extract_ship_to(lines)
    line_items, line_item_warnings = _extract_line_items(lines)
    warnings: list[str] = []

    if not ship_to:
        warnings.append("Ship To not found")
    if not line_items:
        warnings.append("No material line items found")
    for item in line_items:
        warnings.extend(f"Item {item.item}: {warning}" for warning in item.warnings)
    warnings.extend(line_item_warnings)

    status = "parsed" if not warnings else "warning"
    return ParseResult(
        source_file=source_file,
        po_number=po_match.group("number"),
        po_date=po_match.group("date"),
        ship_to=ship_to,
        status=status,
        warnings=warnings,
        line_items=line_items,
    )


def _extract_ship_to(lines: list[str]) -> str:
    ship_col: int | None = None
    captured: list[str] = []

    for index, line in enumerate(lines):
        if "Ship To:" not in line:
            continue
        ship_col = line.index("Ship To:")
        after_label = line[ship_col + len("Ship To:") :].strip()
        if after_label:
            captured.append(after_label)

        for next_line in lines[index + 1 :]:
            right_side = next_line[ship_col:].strip() if ship_col < len(next_line) else ""
            if any(marker in right_side for marker in SHIP_TO_STOP_MARKERS):
                break
            if right_side:
                captured.append(right_side)
        break

    return "\n".join(_dedupe_preserve_order(captured)).strip()


def _extract_line_items(lines: list[str]) -> tuple[list[LineItem], list[str]]:
    items: list[LineItem] = []
    warnings: list[str] = []
    item_like_rows = 0

    for index, line in enumerate(lines):
        if ITEM_LIKE_PATTERN.match(line):
            item_like_rows += 1

        match = ITEM_PATTERN.match(line)
        if not match:
            continue

        description = _extract_description_after_row(lines, index + 1)
        manufacturer_part_number = _extract_manufacturer_part_number_after_row(lines, index + 1)
        item = LineItem(
            item=match.group("item"),
            material=match.group("material"),
            description=description,
            manufacturer_part_number=manufacturer_part_number,
            uom=match.group("uom"),
            total_qty=match.group("total_qty"),
            qty_recd=match.group("qty_recd"),
            qty_retd=match.group("qty_retd"),
            unit_price=match.group("unit_price"),
            item_value=match.group("item_value"),
            due_date=match.group("due_date"),
        )
        if not description:
            item.warnings.append("Description not found")
        items.append(item)

    if item_like_rows > len(items):
        warnings.append(f"{item_like_rows - len(items)} material line item row could not be parsed")

    return items, warnings


def _extract_description_after_row(lines: list[str], start_index: int) -> str:
    for line in lines[start_index : start_index + 8]:
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith(DESCRIPTION_STOP_PREFIXES):
            return ""
        return re.sub(r"\s+", " ", stripped)
    return ""


def _extract_manufacturer_part_number_after_row(lines: list[str], start_index: int) -> str:
    for line in lines[start_index : start_index + 12]:
        stripped = re.sub(r"\s+", " ", line.strip())
        if not stripped:
            continue
        if not stripped.startswith("Manufacturer"):
            continue
        tokens = stripped.split()
        if tokens and tokens[-1].upper() == "REEL":
            tokens = tokens[:-1]
        for token in reversed(tokens[1:]):
            if re.fullmatch(r"[A-Z][A-Z0-9_\-]{3,}", token):
                return token
        return ""
    return ""


def _dedupe_preserve_order(values: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        normalized = re.sub(r"\s+", " ", value).strip()
        if normalized and normalized not in seen:
            seen.add(normalized)
            result.append(normalized)
    return result
