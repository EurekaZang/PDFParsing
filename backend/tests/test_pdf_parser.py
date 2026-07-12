from pathlib import Path

from app.services.pdf_parser import _parse_text, parse_pdf_bytes

SAMPLE_DIR = Path("/home/eureka/catch")
SAMPLE_4515457833 = SAMPLE_DIR / "4515457833 WHIRLPOOL.PDF"
SAMPLE_4515662616 = SAMPLE_DIR / "4515662616 WHIRLPOOL.PDF"


def test_parse_first_sample_extracts_po_header_ship_to_and_line_item():
    result = parse_pdf_bytes(SAMPLE_4515457833.read_bytes(), SAMPLE_4515457833.name)

    assert result.status == "parsed"
    assert result.warnings == []
    assert result.error is None
    assert result.po_number == "4515457833"
    assert result.po_date == "02/17/2026"
    assert "Jabil Circuit India Pvt Ltd" in result.ship_to
    assert "B-26, MIDC Industrial Area" in result.ship_to
    assert len(result.line_items) == 1

    item = result.line_items[0]
    assert item.item == "1"
    assert item.material == "W10165202"
    assert item.description == "TRANSISTOR PNP 100MA 45V HFE150 SOT23"
    assert item.manufacturer_part_number == "LBC857BLT1G"
    assert item.uom == "EA"
    assert item.total_qty == "78,000"
    assert item.qty_recd == "0"
    assert item.qty_retd == "0"
    assert item.unit_price == "0."
    assert item.item_value == "0.00"
    assert item.due_date == "10/03/2026"


def test_parse_second_sample_extracts_po_header_and_line_item():
    result = parse_pdf_bytes(SAMPLE_4515662616.read_bytes(), SAMPLE_4515662616.name)

    assert result.status == "parsed"
    assert result.warnings == []
    assert result.po_number == "4515662616"
    assert result.po_date == "03/23/2026"
    assert len(result.line_items) == 1

    item = result.line_items[0]
    assert item.material == "W10155978"
    assert item.description == "DIODE SM SIG 200MA 100V SOD123"
    assert item.manufacturer_part_number == "L1N4148WT1G"
    assert item.total_qty == "81,000"
    assert item.due_date == "08/30/2026"


def test_parse_text_fails_when_po_number_is_missing():
    result = _parse_text("Change to Purchase order\nItem Material/ Desc.", "broken.pdf")

    assert result.status == "failed"
    assert result.error == "PO number/date not found"
    assert result.line_items == []


def test_parse_text_warns_when_no_line_items_are_found():
    text = "PO number/date (MM/DD/YYYY) : 1234567890 / 01/02/2026\nShip To:\n  Example Address\nBill To :"

    result = _parse_text(text, "empty.pdf")

    assert result.status == "warning"
    assert result.po_number == "1234567890"
    assert result.warnings == ["No material line items found"]


def test_parse_pdf_bytes_fails_cleanly_for_non_pdf_bytes():
    result = parse_pdf_bytes(b"not a pdf at all", "broken.bin")

    assert result.status == "failed"
    assert result.error
    assert result.line_items == []


def test_parse_text_extracts_manufacturer_part_number_from_manufacturer_line():
    text = "\n".join(
        [
            "PO number/date (MM/DD/YYYY) : 1234567890 / 01/02/2026",
            "Ship To:",
            "  Example Address",
            "1 DZ-I1PRO3-084 EA 5,000 0 0 0.323 1,615.00 07/26/2026",
            "REG_3V3_LDK320ADU33R",
            "Manufacturer LESHANRADI LR6302A33P REEL",
        ]
    )

    result = _parse_text(text, "manufacturer.pdf")

    assert result.status == "parsed"
    assert result.warnings == []
    assert len(result.line_items) == 1
    assert result.line_items[0].material == "DZ-I1PRO3-084"
    assert result.line_items[0].manufacturer_part_number == "LR6302A33P"


def test_parse_text_extracts_keurig_item_due_date_from_vendor_confirmation():
    text = "\n".join(
        [
            "PO number/date (MM/DD/YYYY) : 4515743459 / 04/06/2026",
            "Ship To:",
            "  Example Address",
            "1 ECMP001966 EA 21,000 0 0 0.0062",
            "TRANS PREBIAS NPN 50V 100mA SOT23",
            "Manufacturer LESHANRADI LMUN2211LT1G REEL",
            "Material Group : KEURIG              Vendor Confirmation",
            "Line    Quantity Delivery Date ( ETA Shipping Address )",
            "L/T : 84",
            "2       21,000        08/28/2026",
        ]
    )

    result = _parse_text(text, "keurig.pdf")

    assert result.status == "parsed"
    assert result.warnings == []
    assert len(result.line_items) == 1
    item = result.line_items[0]
    assert item.material == "ECMP001966"
    assert item.description == "TRANS PREBIAS NPN 50V 100mA SOT23"
    assert item.manufacturer_part_number == "LMUN2211LT1G"
    assert item.item_value == ""
    assert item.due_date == "08/28/2026"


def test_parse_text_warns_when_an_item_like_row_cannot_be_parsed():
    text = "\n".join(
        [
            "PO number/date (MM/DD/YYYY) : 1234567890 / 01/02/2026",
            "Ship To:",
            "  Example Address",
            "1 W10165202 EA 78,000 0 0 0. 0.00 10/03/2026",
            "2 W99999999 EA 1,000 0 0 0. 0.00",
        ]
    )

    result = _parse_text(text, "partial.pdf")

    assert result.status == "warning"
    assert len(result.line_items) == 1
    assert result.warnings == ["1 material line item row could not be parsed"]


def test_parse_text_promotes_line_item_warning_to_parse_result_warning():
    text = "\n".join(
        [
            "PO number/date (MM/DD/YYYY) : 1234567890 / 01/02/2026",
            "Ship To:",
            "  Example Address",
            "1 W10165202 EA 78,000 0 0 0. 0.00 10/03/2026",
            "Manufacturer: Example",
        ]
    )

    result = _parse_text(text, "missing-description.pdf")

    assert result.status == "warning"
    assert len(result.line_items) == 1
    assert result.line_items[0].warnings == ["Description not found"]
    assert result.warnings == ["Item 1: Description not found"]


def test_parse_text_warns_for_item_like_row_missing_uom_but_not_quantity_row():
    text = "\n".join(
        [
            "PO number/date (MM/DD/YYYY) : 1234567890 / 01/02/2026",
            "Ship To:",
            "  Example Address",
            "1 W10165202 EA 78,000 0 0 0. 0.00 10/03/2026",
            "2 W99999999 1,000 0 0 0. 0.00 10/03/2026",
            "2 78,000 0 0 vendor confirmation quantity row",
        ]
    )

    result = _parse_text(text, "missing-uom.pdf")

    assert result.status == "warning"
    assert len(result.line_items) == 1
    assert result.warnings == ["1 material line item row could not be parsed"]


def test_parse_text_ignores_postal_code_address_as_item_like_row():
    """Vendor address lines like '518100 SHENZHEN-BAO'AN' must not raise warnings."""
    text = "\n".join(
        [
            "PO number/date (MM/DD/YYYY) : 4516327359 / 07/06/2026",
            "Ship To:",
            "  Jabil Circuit (Guangzhou) Limited",
            "                 XIXIANG AVENUE,",
            "                 518100 SHENZHEN-BAO'AN",
            "                 China",
            "                 518100 SHENZHEN-BAO'AN",
            "1 TG-IC-000606 EA 12,000 0 0 1.12818 13,538.16 10/03/2026",
            "IC REG BUCK ADJ 2A 8SOIC",
            "Manufacturer SILICONTEC SCT9320STDR REEL",
        ]
    )

    result = _parse_text(text, "address-false-positive.pdf")

    assert result.status == "parsed"
    assert result.warnings == []
    assert len(result.line_items) == 1
    assert result.line_items[0].material == "TG-IC-000606"


def test_parse_text_counts_digit_leading_material_as_item_like():
    """Materials starting with digits (e.g. 807W45002-LF) should still be item-like."""
    text = "\n".join(
        [
            "PO number/date (MM/DD/YYYY) : 4516339174 / 07/08/2026",
            "Ship To:",
            "  Example Address",
            "1 807W45002-LF EA 15,000 0 0 0.028 420.00 10/26/2026",
            "TRANSISTOR, PNP, 40V, 200MA,SOT23,ROHS",
            "Manufacturer LESHANRADI LMBT3906LT1G REEL",
            "2 999W00001-LF EA 1,000 0 0 0.01",
        ]
    )

    result = _parse_text(text, "digit-material.pdf")

    assert result.status == "warning"
    assert len(result.line_items) == 1
    assert result.line_items[0].material == "807W45002-LF"
    assert result.warnings == ["1 material line item row could not be parsed"]
