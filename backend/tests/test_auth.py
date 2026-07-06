import pytest
from fastapi.testclient import TestClient

from app.auth import create_access_token, decode_access_token
from app.main import create_app


def test_create_and_decode_access_token_round_trip():
    token = create_access_token("buyer")

    assert decode_access_token(token) == "buyer"


def test_login_success_returns_bearer_token():
    client = TestClient(create_app())

    response = client.post(
        "/api/auth/login",
        json={"username": "buyer", "password": "secret-password"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert decode_access_token(body["access_token"]) == "buyer"


def test_login_rejects_wrong_password():
    client = TestClient(create_app())

    response = client.post(
        "/api/auth/login",
        json={"username": "buyer", "password": "wrong"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid username or password"


def test_decode_access_token_rejects_invalid_token():
    with pytest.raises(ValueError, match="Invalid authentication token"):
        decode_access_token("not-a-valid-token")
