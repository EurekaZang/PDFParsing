import pytest

from app.config import get_settings


@pytest.fixture(autouse=True)
def configured_auth_environment(monkeypatch):
    monkeypatch.setenv("APP_USERNAME", "buyer")
    monkeypatch.setenv("APP_PASSWORD", "secret-password")
    monkeypatch.setenv("JWT_SECRET", "test-secret")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()
