"""Backend API tests for kik auction house."""
import os
import time
import uuid
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://kik-auction.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_EMAIL = "admin@kik.art"
ADMIN_PASSWORD = "kikadmin2025"


@pytest.fixture(scope="session")
def token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=20)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "access_token" in data and data.get("user", {}).get("role") == "admin"
    return data["access_token"]


@pytest.fixture(scope="session")
def auth(token):
    return {"Authorization": f"Bearer {token}"}


# ---- auth ----
def test_login_wrong_password():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"}, timeout=20)
    assert r.status_code == 401


def test_me_no_token():
    r = requests.get(f"{API}/auth/me", timeout=20)
    assert r.status_code in (401, 403)


def test_me_with_token(auth):
    r = requests.get(f"{API}/auth/me", headers=auth, timeout=20)
    assert r.status_code == 200
    body = r.json()
    assert body["email"] == ADMIN_EMAIL
    assert body["role"] == "admin"
    assert "_id" not in body


# ---- artists ----
def test_artist_crud(auth):
    payload = {"name": f"TEST_artist_{uuid.uuid4().hex[:6]}", "bio_en": "bio", "bio_ru": "био"}
    r = requests.post(f"{API}/admin/artists", json=payload, headers=auth, timeout=20)
    assert r.status_code == 200, r.text
    art = r.json()
    aid = art["id"]
    assert "_id" not in art

    # GET one
    r = requests.get(f"{API}/artists/{aid}", timeout=20)
    assert r.status_code == 200
    assert r.json()["name"] == payload["name"]

    # list
    r = requests.get(f"{API}/artists", timeout=20)
    assert r.status_code == 200
    assert any(a["id"] == aid for a in r.json())

    # update
    r = requests.put(f"{API}/admin/artists/{aid}", json={**payload, "bio_en": "updated"}, headers=auth, timeout=20)
    assert r.status_code == 200
    assert r.json()["bio_en"] == "updated"
    r = requests.get(f"{API}/artists/{aid}", timeout=20)
    assert r.json()["bio_en"] == "updated"

    # delete
    r = requests.delete(f"{API}/admin/artists/{aid}", headers=auth, timeout=20)
    assert r.status_code == 200
    r = requests.get(f"{API}/artists/{aid}", timeout=20)
    assert r.status_code == 404


# ---- auctions + lots cascading delete ----
def test_auction_lot_flow(auth):
    a_payload = {
        "title_en": "TEST Auction",
        "title_ru": "Тест Аукцион",
        "edition_number": 99,
        "date": "2026-06-15T19:00:00+00:00",
        "venue_en": "Loft",
        "city": "Berlin",
        "status": "upcoming",
    }
    r = requests.post(f"{API}/admin/auctions", json=a_payload, headers=auth, timeout=20)
    assert r.status_code == 200, r.text
    auction = r.json()
    aid = auction["id"]
    assert auction["title_en"] == "TEST Auction"
    assert "_id" not in auction

    # filter upcoming
    r = requests.get(f"{API}/auctions?status_filter=upcoming", timeout=20)
    assert r.status_code == 200
    assert any(a["id"] == aid for a in r.json())

    # filter past should not include
    r = requests.get(f"{API}/auctions?status_filter=past", timeout=20)
    assert all(a["id"] != aid for a in r.json())

    # update auction
    upd = {**a_payload, "title_en": "TEST Updated"}
    r = requests.put(f"{API}/admin/auctions/{aid}", json=upd, headers=auth, timeout=20)
    assert r.status_code == 200
    assert r.json()["title_en"] == "TEST Updated"

    # create lot
    lot_payload = {
        "auction_id": aid,
        "artist_name": "Test Artist",
        "lot_number": 1,
        "title_en": "TEST Lot",
        "estimate_low": 100.0,
        "estimate_high": 500.0,
    }
    r = requests.post(f"{API}/admin/lots", json=lot_payload, headers=auth, timeout=20)
    assert r.status_code == 200, r.text
    lot = r.json()
    lid = lot["id"]
    assert "_id" not in lot

    r = requests.get(f"{API}/auctions/{aid}/lots", timeout=20)
    assert r.status_code == 200
    lots = r.json()
    assert any(l["id"] == lid for l in lots)

    # update lot
    r = requests.put(f"{API}/admin/lots/{lid}", json={**lot_payload, "title_en": "TEST Lot Updated"}, headers=auth, timeout=20)
    assert r.status_code == 200
    assert r.json()["title_en"] == "TEST Lot Updated"

    # cascading delete: delete auction → lots gone
    r = requests.delete(f"{API}/admin/auctions/{aid}", headers=auth, timeout=20)
    assert r.status_code == 200
    r = requests.get(f"{API}/auctions/{aid}/lots", timeout=20)
    assert r.status_code == 200 and r.json() == []
    r = requests.get(f"{API}/auctions/{aid}", timeout=20)
    assert r.status_code == 404


def test_admin_lots_requires_auth():
    r = requests.get(f"{API}/admin/lots", timeout=20)
    assert r.status_code in (401, 403)


# ---- newsletter ----
def test_newsletter_dedupe(auth):
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    r1 = requests.post(f"{API}/newsletter", json={"email": email, "language": "en"}, timeout=20)
    assert r1.status_code == 200
    sid = r1.json()["id"]
    r2 = requests.post(f"{API}/newsletter", json={"email": email, "language": "ru"}, timeout=20)
    assert r2.status_code == 200
    assert r2.json()["id"] == sid  # dedup returns same record

    # admin list requires auth
    r = requests.get(f"{API}/admin/newsletter", timeout=20)
    assert r.status_code in (401, 403)
    r = requests.get(f"{API}/admin/newsletter", headers=auth, timeout=20)
    assert r.status_code == 200
    assert any(s["email"] == email for s in r.json())

    # cleanup
    requests.delete(f"{API}/admin/newsletter/{sid}", headers=auth, timeout=20)


# ---- contact ----
def test_contact_flow(auth):
    payload = {"name": "Tester", "email": f"c_{uuid.uuid4().hex[:6]}@example.com", "message": "hello"}
    r = requests.post(f"{API}/contact", json=payload, timeout=20)
    assert r.status_code == 200
    assert r.json()["message"] == "hello"

    r = requests.get(f"{API}/admin/contact", timeout=20)
    assert r.status_code in (401, 403)
    r = requests.get(f"{API}/admin/contact", headers=auth, timeout=20)
    assert r.status_code == 200
    assert any(m["email"] == payload["email"] for m in r.json())
