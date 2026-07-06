from app.config import get_settings
from app.schemas import LineItem, ParseResult


def test_settings_reads_environment(monkeypatch):
    monkeypatch.setenv("APP_USERNAME", "buyer")
    monkeypatch.setenv("APP_PASSWORD", "secret-password")
    monkeypatch.setenv("JWT_SECRET", "test-secret")
    get_settings.cache_clear()

    settings = get_settings()

    assert settings.app_username == "buyer"
    assert settings.app_password == "secret-password"
    assert settings.jwt_secret == "test-secret"
    assert settings.jwt_algorithm == "HS256"
    assert settings.jwt_expire_minutes == 480


def test_parse_result_defaults_to_empty_warnings_and_items():
    result = ParseResult(source_file="sample.pdf", status="warning")

    assert result.source_file == "sample.pdf"
    assert result.status == "warning"
    assert result.line_items == []
    assert result.warnings == []
    assert result.error is None


def test_line_item_accepts_purchase_order_fields():
    item = LineItem(
        item="1",
        material="W10165202",
        description="TRANSISTOR PNP 100MA 45V HFE150 SOT23",
        uom="EA",
        total_qty="78,000",
        qty_recd="0",
        qty_retd="0",
        unit_price="0.",
        item_value="0.00",
        due_date="10/03/2026",
    )

    assert item.material == "W10165202"
    assert item.warnings == []
