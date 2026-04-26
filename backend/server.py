from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
import smtplib
import time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr
from datetime import datetime, timezone, timedelta
from typing import List, Optional

import bcrypt
import jwt
import cloudinary
import cloudinary.utils
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict


# ---------------- Setup ----------------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
ADMIN_EMAIL = os.environ['ADMIN_EMAIL']
ADMIN_PASSWORD = os.environ['ADMIN_PASSWORD']

CLOUDINARY_CLOUD_NAME = os.environ.get('CLOUDINARY_CLOUD_NAME', '')
CLOUDINARY_API_KEY = os.environ.get('CLOUDINARY_API_KEY', '')
CLOUDINARY_API_SECRET = os.environ.get('CLOUDINARY_API_SECRET', '')
if CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET:
    cloudinary.config(
        cloud_name=CLOUDINARY_CLOUD_NAME,
        api_key=CLOUDINARY_API_KEY,
        api_secret=CLOUDINARY_API_SECRET,
        secure=True,
    )

SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.mail.ru')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '465') or 465)
SMTP_USER = os.environ.get('SMTP_USER', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
SMTP_FROM = os.environ.get('SMTP_FROM', '') or SMTP_USER
SMTP_FROM_NAME = os.environ.get('SMTP_FROM_NAME', 'kik')

app = FastAPI(title="kik auction house API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)


# ---------------- Utility ----------------
def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": now_utc() + timedelta(days=1),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> dict:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user_id = payload.get("sub")
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=401, detail="Admin not found")
    return user


# ---------------- Models ----------------
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class TranslatedField(BaseModel):
    en: str = ""
    ru: str = ""


class Artist(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    bio_en: str = ""
    bio_ru: str = ""
    image_url: str = ""
    instagram: str = ""
    website: str = ""
    created_at: datetime = Field(default_factory=now_utc)


class ArtistCreate(BaseModel):
    name: str
    bio_en: str = ""
    bio_ru: str = ""
    image_url: str = ""
    instagram: str = ""
    website: str = ""


class Auction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title_en: str
    title_ru: str = ""
    edition_number: int = 1
    date: datetime
    venue_en: str = ""
    venue_ru: str = ""
    city: str = ""
    description_en: str = ""
    description_ru: str = ""
    cover_image: str = ""
    status: str = "upcoming"  # upcoming | past
    created_at: datetime = Field(default_factory=now_utc)


class AuctionCreate(BaseModel):
    title_en: str
    title_ru: str = ""
    edition_number: int = 1
    date: datetime
    venue_en: str = ""
    venue_ru: str = ""
    city: str = ""
    description_en: str = ""
    description_ru: str = ""
    cover_image: str = ""
    status: str = "upcoming"


class Lot(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    auction_id: str
    artist_id: Optional[str] = None
    artist_name: str = ""
    lot_number: int = 1
    title_en: str
    title_ru: str = ""
    medium_en: str = ""
    medium_ru: str = ""
    year: Optional[int] = None
    dimensions: str = ""
    estimate_low: Optional[float] = None
    estimate_high: Optional[float] = None
    currency: str = "EUR"
    image_url: str = ""
    sold: bool = False
    sold_price: Optional[float] = None
    description_en: str = ""
    description_ru: str = ""
    created_at: datetime = Field(default_factory=now_utc)


class LotCreate(BaseModel):
    auction_id: str
    artist_id: Optional[str] = None
    artist_name: str = ""
    lot_number: int = 1
    title_en: str
    title_ru: str = ""
    medium_en: str = ""
    medium_ru: str = ""
    year: Optional[int] = None
    dimensions: str = ""
    estimate_low: Optional[float] = None
    estimate_high: Optional[float] = None
    currency: str = "EUR"
    image_url: str = ""
    sold: bool = False
    sold_price: Optional[float] = None
    description_en: str = ""
    description_ru: str = ""


class NewsletterSubscriber(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    language: str = "en"
    created_at: datetime = Field(default_factory=now_utc)


class NewsletterCreate(BaseModel):
    email: EmailStr
    language: str = "en"


class ContactMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    message: str
    created_at: datetime = Field(default_factory=now_utc)


class ContactCreate(BaseModel):
    name: str
    email: EmailStr
    message: str


# ---------------- Helpers ----------------
def _serialize_dt(d: dict) -> dict:
    for k, v in list(d.items()):
        if isinstance(v, datetime):
            d[k] = v.isoformat()
    return d


def _deserialize_dt(d: dict, fields: List[str]) -> dict:
    for f in fields:
        v = d.get(f)
        if isinstance(v, str):
            try:
                d[f] = datetime.fromisoformat(v)
            except Exception:
                pass
    return d


# ---------------- Auth ----------------
@api_router.post("/auth/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    email = body.email.lower()
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(user["id"], user["email"])
    safe_user = {"id": user["id"], "email": user["email"], "role": user["role"], "name": user.get("name", "")}
    return TokenResponse(access_token=token, user=safe_user)


@api_router.get("/auth/me")
async def me(current=Depends(get_current_admin)):
    return current


# ---------------- Public: Auctions ----------------
@api_router.get("/auctions", response_model=List[Auction])
async def list_auctions(status_filter: Optional[str] = None):
    q = {}
    if status_filter in ("upcoming", "past"):
        q["status"] = status_filter
    docs = await db.auctions.find(q, {"_id": 0}).sort("date", -1).to_list(500)
    for d in docs:
        _deserialize_dt(d, ["date", "created_at"])
    return [Auction(**d) for d in docs]


@api_router.get("/auctions/{auction_id}", response_model=Auction)
async def get_auction(auction_id: str):
    doc = await db.auctions.find_one({"id": auction_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Auction not found")
    _deserialize_dt(doc, ["date", "created_at"])
    return Auction(**doc)


@api_router.get("/auctions/{auction_id}/lots", response_model=List[Lot])
async def auction_lots(auction_id: str):
    docs = await db.lots.find({"auction_id": auction_id}, {"_id": 0}).sort("lot_number", 1).to_list(1000)
    for d in docs:
        _deserialize_dt(d, ["created_at"])
    return [Lot(**d) for d in docs]


# ---------------- Public: Artists ----------------
@api_router.get("/artists", response_model=List[Artist])
async def list_artists():
    docs = await db.artists.find({}, {"_id": 0}).sort("name", 1).to_list(500)
    for d in docs:
        _deserialize_dt(d, ["created_at"])
    return [Artist(**d) for d in docs]


@api_router.get("/artists/{artist_id}", response_model=Artist)
async def get_artist(artist_id: str):
    doc = await db.artists.find_one({"id": artist_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Artist not found")
    _deserialize_dt(doc, ["created_at"])
    return Artist(**doc)


# ---------------- Public: Newsletter & Contact ----------------
@api_router.post("/newsletter", response_model=NewsletterSubscriber)
async def subscribe(body: NewsletterCreate):
    email = body.email.lower()
    existing = await db.newsletter.find_one({"email": email})
    if existing:
        existing.pop("_id", None)
        _deserialize_dt(existing, ["created_at"])
        return NewsletterSubscriber(**existing)
    obj = NewsletterSubscriber(email=email, language=body.language)
    doc = _serialize_dt(obj.model_dump())
    await db.newsletter.insert_one(doc)
    return obj


@api_router.post("/contact", response_model=ContactMessage)
async def contact(body: ContactCreate):
    obj = ContactMessage(**body.model_dump())
    doc = _serialize_dt(obj.model_dump())
    await db.contact_messages.insert_one(doc)
    return obj


# ---------------- Admin: Auctions ----------------
@api_router.post("/admin/auctions", response_model=Auction)
async def admin_create_auction(body: AuctionCreate, _=Depends(get_current_admin)):
    obj = Auction(**body.model_dump())
    doc = _serialize_dt(obj.model_dump())
    await db.auctions.insert_one(doc)
    return obj


@api_router.put("/admin/auctions/{auction_id}", response_model=Auction)
async def admin_update_auction(auction_id: str, body: AuctionCreate, _=Depends(get_current_admin)):
    existing = await db.auctions.find_one({"id": auction_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Not found")
    update = body.model_dump()
    update["id"] = auction_id
    update["created_at"] = existing.get("created_at", now_utc().isoformat())
    update_serialized = _serialize_dt(dict(update))
    await db.auctions.update_one({"id": auction_id}, {"$set": update_serialized})
    new_doc = await db.auctions.find_one({"id": auction_id}, {"_id": 0})
    _deserialize_dt(new_doc, ["date", "created_at"])
    return Auction(**new_doc)


@api_router.delete("/admin/auctions/{auction_id}")
async def admin_delete_auction(auction_id: str, _=Depends(get_current_admin)):
    res = await db.auctions.delete_one({"id": auction_id})
    await db.lots.delete_many({"auction_id": auction_id})
    return {"deleted": res.deleted_count}


# ---------------- Admin: Lots ----------------
@api_router.post("/admin/lots", response_model=Lot)
async def admin_create_lot(body: LotCreate, _=Depends(get_current_admin)):
    obj = Lot(**body.model_dump())
    doc = _serialize_dt(obj.model_dump())
    await db.lots.insert_one(doc)
    return obj


@api_router.put("/admin/lots/{lot_id}", response_model=Lot)
async def admin_update_lot(lot_id: str, body: LotCreate, _=Depends(get_current_admin)):
    existing = await db.lots.find_one({"id": lot_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Not found")
    update = body.model_dump()
    update["id"] = lot_id
    update["created_at"] = existing.get("created_at", now_utc().isoformat())
    update_serialized = _serialize_dt(dict(update))
    await db.lots.update_one({"id": lot_id}, {"$set": update_serialized})
    new_doc = await db.lots.find_one({"id": lot_id}, {"_id": 0})
    _deserialize_dt(new_doc, ["created_at"])
    return Lot(**new_doc)


@api_router.delete("/admin/lots/{lot_id}")
async def admin_delete_lot(lot_id: str, _=Depends(get_current_admin)):
    res = await db.lots.delete_one({"id": lot_id})
    return {"deleted": res.deleted_count}


@api_router.get("/admin/lots", response_model=List[Lot])
async def admin_list_lots(_=Depends(get_current_admin)):
    docs = await db.lots.find({}, {"_id": 0}).sort("created_at", -1).to_list(2000)
    for d in docs:
        _deserialize_dt(d, ["created_at"])
    return [Lot(**d) for d in docs]


# ---------------- Admin: Artists ----------------
@api_router.post("/admin/artists", response_model=Artist)
async def admin_create_artist(body: ArtistCreate, _=Depends(get_current_admin)):
    obj = Artist(**body.model_dump())
    doc = _serialize_dt(obj.model_dump())
    await db.artists.insert_one(doc)
    return obj


@api_router.put("/admin/artists/{artist_id}", response_model=Artist)
async def admin_update_artist(artist_id: str, body: ArtistCreate, _=Depends(get_current_admin)):
    existing = await db.artists.find_one({"id": artist_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Not found")
    update = body.model_dump()
    update["id"] = artist_id
    update["created_at"] = existing.get("created_at", now_utc().isoformat())
    await db.artists.update_one({"id": artist_id}, {"$set": _serialize_dt(dict(update))})
    new_doc = await db.artists.find_one({"id": artist_id}, {"_id": 0})
    _deserialize_dt(new_doc, ["created_at"])
    return Artist(**new_doc)


@api_router.delete("/admin/artists/{artist_id}")
async def admin_delete_artist(artist_id: str, _=Depends(get_current_admin)):
    res = await db.artists.delete_one({"id": artist_id})
    return {"deleted": res.deleted_count}


# ---------------- Admin: Newsletter & Contact ----------------
@api_router.get("/admin/newsletter", response_model=List[NewsletterSubscriber])
async def admin_list_newsletter(_=Depends(get_current_admin)):
    docs = await db.newsletter.find({}, {"_id": 0}).sort("created_at", -1).to_list(5000)
    for d in docs:
        _deserialize_dt(d, ["created_at"])
    return [NewsletterSubscriber(**d) for d in docs]


@api_router.delete("/admin/newsletter/{sub_id}")
async def admin_delete_subscriber(sub_id: str, _=Depends(get_current_admin)):
    res = await db.newsletter.delete_one({"id": sub_id})
    return {"deleted": res.deleted_count}


@api_router.get("/admin/contact", response_model=List[ContactMessage])
async def admin_list_contact(_=Depends(get_current_admin)):
    docs = await db.contact_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(5000)
    for d in docs:
        _deserialize_dt(d, ["created_at"])
    return [ContactMessage(**d) for d in docs]


# ---------------- RSVPs (public + admin) ----------------
class RSVP(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    auction_id: str
    name: str
    email: EmailStr
    favorite_color: str = ""
    created_at: datetime = Field(default_factory=now_utc)


class RSVPCreate(BaseModel):
    name: str
    email: EmailStr
    favorite_color: str = ""


@api_router.post("/auctions/{auction_id}/rsvp", response_model=RSVP)
async def rsvp(auction_id: str, body: RSVPCreate):
    auction = await db.auctions.find_one({"id": auction_id}, {"_id": 0})
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    obj = RSVP(auction_id=auction_id, **body.model_dump())
    await db.rsvps.insert_one(_serialize_dt(obj.model_dump()))
    return obj


@api_router.get("/admin/rsvps", response_model=List[RSVP])
async def admin_list_rsvps(auction_id: Optional[str] = None, _=Depends(get_current_admin)):
    q = {"auction_id": auction_id} if auction_id else {}
    docs = await db.rsvps.find(q, {"_id": 0}).sort("created_at", -1).to_list(5000)
    for d in docs:
        _deserialize_dt(d, ["created_at"])
    return [RSVP(**d) for d in docs]


@api_router.delete("/admin/rsvps/{rsvp_id}")
async def admin_delete_rsvp(rsvp_id: str, _=Depends(get_current_admin)):
    res = await db.rsvps.delete_one({"id": rsvp_id})
    return {"deleted": res.deleted_count}


# ---------------- Cloudinary signed upload ----------------
class CloudinarySignature(BaseModel):
    signature: str
    timestamp: int
    cloud_name: str
    api_key: str
    folder: str
    resource_type: str


@api_router.get("/cloudinary/signature", response_model=CloudinarySignature)
async def cloudinary_signature(
    folder: str = Query("auctions", regex=r"^(auctions|lots|artists)$"),
    resource_type: str = Query("image", regex=r"^(image|video)$"),
    _=Depends(get_current_admin),
):
    if not (CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET):
        raise HTTPException(
            status_code=503,
            detail="Cloudinary not configured. Set CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET in backend/.env",
        )
    timestamp = int(time.time())
    safe_folder = f"kik/{folder}"
    params = {"timestamp": timestamp, "folder": safe_folder}
    signature = cloudinary.utils.api_sign_request(params, CLOUDINARY_API_SECRET)
    return CloudinarySignature(
        signature=signature,
        timestamp=timestamp,
        cloud_name=CLOUDINARY_CLOUD_NAME,
        api_key=CLOUDINARY_API_KEY,
        folder=safe_folder,
        resource_type=resource_type,
    )


# ---------------- Newsletter send (Mail.ru SMTP) ----------------
class NewsletterSend(BaseModel):
    subject: str
    html_body: str
    language: Optional[str] = None  # "en" | "ru" | None=all


def _send_email(to_addr: str, subject: str, html_body: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = formataddr((SMTP_FROM_NAME, SMTP_FROM))
    msg["To"] = to_addr
    msg.attach(MIMEText(html_body, "html", "utf-8"))
    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=15) as smtp:
        smtp.login(SMTP_USER, SMTP_PASSWORD)
        smtp.sendmail(SMTP_FROM, [to_addr], msg.as_string())


@api_router.post("/admin/newsletter/send")
async def admin_newsletter_send(body: NewsletterSend, _=Depends(get_current_admin)):
    if not (SMTP_USER and SMTP_PASSWORD and SMTP_FROM):
        raise HTTPException(
            status_code=503,
            detail="SMTP not configured. Set SMTP_USER / SMTP_PASSWORD / SMTP_FROM in backend/.env",
        )
    q = {"language": body.language} if body.language in ("en", "ru") else {}
    subs = await db.newsletter.find(q, {"_id": 0, "email": 1}).to_list(10000)
    sent, failed = 0, []
    for s in subs:
        try:
            _send_email(s["email"], body.subject, body.html_body)
            sent += 1
        except Exception as e:
            failed.append({"email": s["email"], "error": str(e)[:200]})
    logger.info("Newsletter send: sent=%d failed=%d", sent, len(failed))
    return {"sent": sent, "failed": failed, "total": len(subs)}


# ---------------- Health ----------------
@api_router.get("/")
async def root():
    return {"service": "kik", "status": "ok"}


# ---------------- Startup ----------------
@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.auctions.create_index("date")
    await db.lots.create_index("auction_id")
    await db.newsletter.create_index("email", unique=True)
    await db.rsvps.create_index("auction_id")

    existing = await db.users.find_one({"email": ADMIN_EMAIL.lower()})
    if existing is None:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": ADMIN_EMAIL.lower(),
            "password_hash": hash_password(ADMIN_PASSWORD),
            "name": "kik admin",
            "role": "admin",
            "created_at": now_utc().isoformat(),
        })
    elif not verify_password(ADMIN_PASSWORD, existing["password_hash"]):
        await db.users.update_one(
            {"email": ADMIN_EMAIL.lower()},
            {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}},
        )


@app.on_event("shutdown")
async def on_shutdown():
    client.close()


# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
