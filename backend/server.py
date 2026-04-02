from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File, Header, Query
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import base64
import json
import hashlib
import requests
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Object Storage
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "yellow-pecora"
storage_key = None

def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str):
    key = init_storage()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- Models ---
class UserOut(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    level: Optional[str] = "Principiante"
    badges: Optional[List[str]] = []
    created_at: Optional[str] = None

class ItemOut(BaseModel):
    model_config = ConfigDict(extra="ignore")
    item_id: str
    name: str
    category: str
    subcategory: Optional[str] = None
    tags: List[str] = []
    condition: str = "Buono"
    estimated_value: Optional[float] = None
    transaction_type: str = "scambio"
    description: Optional[str] = None
    images: List[str] = []
    owner_id: str
    owner_name: Optional[str] = None
    owner_avatar: Optional[str] = None
    created_at: Optional[str] = None

# --- Auth helpers ---
async def get_current_user(request: Request) -> dict:
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    if not session_token:
        raise HTTPException(status_code=401, detail="Non autenticato")
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Sessione non valida")
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Sessione scaduta")
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Utente non trovato")
    return user

# --- Auth Endpoints ---
@api_router.post("/auth/session")
async def exchange_session(request: Request):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id richiesto")
    resp = requests.get(
        "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
        headers={"X-Session-ID": session_id}, timeout=15
    )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Sessione OAuth non valida")
    data = resp.json()
    email = data["email"]
    name = data.get("name", "")
    picture = data.get("picture", "")
    session_token = data["session_token"]
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"email": email}, {"$set": {"name": name, "picture": picture}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "level": "Principiante",
            "badges": ["Prima collezione"],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    response = JSONResponse(content=user)
    response.set_cookie(
        key="session_token", value=session_token,
        httponly=True, secure=True, samesite="none",
        path="/", max_age=7*24*3600
    )
    return response

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

@api_router.post("/auth/logout")
async def logout(request: Request):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    response = JSONResponse(content={"message": "Logout effettuato"})
    response.delete_cookie(key="session_token", path="/", samesite="none", secure=True)
    return response

# --- Email/Password Auth ---
@api_router.post("/auth/register")
async def register_email(request: Request):
    body = await request.json()
    email = body.get("email", "").strip().lower()
    password = body.get("password", "")
    name = body.get("name", "")
    if not email or not password or not name:
        raise HTTPException(status_code=400, detail="Email, password e nome richiesti")
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email gia registrata")
    pw_hash = hashlib.sha256(password.encode()).hexdigest()
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    session_token = f"sess_{uuid.uuid4().hex}"
    await db.users.insert_one({
        "user_id": user_id, "email": email, "name": name,
        "password_hash": pw_hash, "picture": "",
        "level": "Principiante", "badges": ["Prima collezione"],
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    await db.user_sessions.insert_one({
        "user_id": user_id, "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    response = JSONResponse(content=user)
    response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite="none", path="/", max_age=7*24*3600)
    return response

@api_router.post("/auth/login-email")
async def login_email(request: Request):
    body = await request.json()
    email = body.get("email", "").strip().lower()
    password = body.get("password", "")
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email e password richiesti")
    pw_hash = hashlib.sha256(password.encode()).hexdigest()
    user = await db.users.find_one({"email": email, "password_hash": pw_hash})
    if not user:
        raise HTTPException(status_code=401, detail="Email o password non validi")
    user_id = user["user_id"]
    session_token = f"sess_{uuid.uuid4().hex}"
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one({
        "user_id": user_id, "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    user_data = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    response = JSONResponse(content=user_data)
    response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite="none", path="/", max_age=7*24*3600)
    return response

# --- Trade Proposals ---
@api_router.post("/trades")
async def create_trade_proposal(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    target_item_id = body.get("target_item_id")
    offered_item_ids = body.get("offered_item_ids", [])
    money_offer = body.get("money_offer", 0)
    message = body.get("message", "")
    if not target_item_id or (not offered_item_ids and not money_offer):
        raise HTTPException(status_code=400, detail="Devi offrire almeno un oggetto o un importo")
    target_item = await db.items.find_one({"item_id": target_item_id}, {"_id": 0})
    if not target_item:
        raise HTTPException(status_code=404, detail="Oggetto non trovato")
    if target_item["owner_id"] == user["user_id"]:
        raise HTTPException(status_code=400, detail="Non puoi scambiare con te stesso")
    offered_items = []
    for oid in offered_item_ids:
        oi = await db.items.find_one({"item_id": oid, "owner_id": user["user_id"]}, {"_id": 0})
        if oi:
            offered_items.append({"item_id": oi["item_id"], "name": oi["name"], "images": oi.get("images", [])})
    trade_id = f"trade_{uuid.uuid4().hex[:12]}"
    trade = {
        "trade_id": trade_id,
        "proposer_id": user["user_id"],
        "proposer_name": user.get("name", ""),
        "proposer_avatar": user.get("picture", ""),
        "receiver_id": target_item["owner_id"],
        "receiver_name": target_item.get("owner_name", ""),
        "target_item": {"item_id": target_item["item_id"], "name": target_item["name"], "images": target_item.get("images", [])},
        "offered_items": offered_items,
        "money_offer": money_offer,
        "message": message,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.trades.insert_one(trade)
    # Notify receiver
    await db.notifications.insert_one({
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
        "user_id": target_item["owner_id"],
        "type": "trade_proposal",
        "title": "Nuova proposta di scambio!",
        "message": f'{user.get("name", "Qualcuno")} vuole scambiare con il tuo "{target_item["name"]}"' + (f" + {money_offer} EUR" if money_offer else ""),
        "link": f"/oggetto/{target_item_id}",
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    created = await db.trades.find_one({"trade_id": trade_id}, {"_id": 0})
    return created

@api_router.get("/trades")
async def get_my_trades(request: Request):
    user = await get_current_user(request)
    uid = user["user_id"]
    trades = await db.trades.find(
        {"$or": [{"proposer_id": uid}, {"receiver_id": uid}]}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return trades

@api_router.put("/trades/{trade_id}")
async def update_trade(request: Request, trade_id: str):
    user = await get_current_user(request)
    body = await request.json()
    new_status = body.get("status")
    if new_status not in ("accepted", "rejected"):
        raise HTTPException(status_code=400, detail="Status non valido")
    trade = await db.trades.find_one({"trade_id": trade_id}, {"_id": 0})
    if not trade:
        raise HTTPException(status_code=404, detail="Proposta non trovata")
    if trade["receiver_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Solo il destinatario puo accettare/rifiutare")
    await db.trades.update_one({"trade_id": trade_id}, {"$set": {"status": new_status}})
    # Notify proposer
    status_label = "accettata" if new_status == "accepted" else "rifiutata"
    await db.notifications.insert_one({
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
        "user_id": trade["proposer_id"],
        "type": "trade_response",
        "title": f"Proposta {status_label}!",
        "message": f'{user.get("name", "")} ha {status_label} la tua proposta per "{trade["target_item"]["name"]}".',
        "link": f"/oggetto/{trade['target_item']['item_id']}",
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    updated = await db.trades.find_one({"trade_id": trade_id}, {"_id": 0})
    return updated

# --- Chat/Messages ---
@api_router.post("/chat")
async def send_chat_message(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    recipient_id = body.get("recipient_id")
    text = body.get("text", "")
    item_id = body.get("item_id", "")
    if not recipient_id or not text:
        raise HTTPException(status_code=400, detail="recipient_id e text richiesti")
    chat_key = "_".join(sorted([user["user_id"], recipient_id]))
    msg = {
        "message_id": f"msg_{uuid.uuid4().hex[:12]}",
        "chat_key": chat_key,
        "sender_id": user["user_id"],
        "sender_name": user.get("name", ""),
        "sender_avatar": user.get("picture", ""),
        "recipient_id": recipient_id,
        "text": text,
        "item_id": item_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.messages.insert_one(msg)
    return await db.messages.find_one({"message_id": msg["message_id"]}, {"_id": 0})

@api_router.get("/chat/{other_user_id}")
async def get_chat_messages(request: Request, other_user_id: str):
    user = await get_current_user(request)
    chat_key = "_".join(sorted([user["user_id"], other_user_id]))
    messages = await db.messages.find({"chat_key": chat_key}, {"_id": 0}).sort("created_at", 1).to_list(200)
    return messages

@api_router.get("/chats")
async def get_my_chats(request: Request):
    user = await get_current_user(request)
    uid = user["user_id"]
    pipeline = [
        {"$match": {"$or": [{"sender_id": uid}, {"recipient_id": uid}]}},
        {"$sort": {"created_at": -1}},
        {"$group": {
            "_id": "$chat_key",
            "last_message": {"$first": "$text"},
            "last_time": {"$first": "$created_at"},
            "sender_id": {"$first": "$sender_id"},
            "sender_name": {"$first": "$sender_name"},
            "sender_avatar": {"$first": "$sender_avatar"},
            "recipient_id": {"$first": "$recipient_id"},
            "item_id": {"$first": "$item_id"}
        }},
        {"$sort": {"last_time": -1}},
        {"$limit": 30}
    ]
    chats = await db.messages.aggregate(pipeline).to_list(30)
    
    # OPTIMIZED: Batch fetch users to avoid N+1 queries
    other_user_ids = list(set(
        c["recipient_id"] if c["sender_id"] == uid else c["sender_id"] 
        for c in chats
    ))
    
    # Fetch all users in ONE query
    users_cursor = db.users.find(
        {"user_id": {"$in": other_user_ids}},
        {"_id": 0, "password_hash": 0}
    )
    users_list = await users_cursor.to_list(len(other_user_ids))
    users_map = {u["user_id"]: u for u in users_list}
    
    result = []
    for c in chats:
        other_id = c["recipient_id"] if c["sender_id"] == uid else c["sender_id"]
        other_user = users_map.get(other_id)
        result.append({
            "chat_key": c["_id"],
            "other_user": other_user,
            "last_message": c["last_message"],
            "last_time": c["last_time"],
            "item_id": c.get("item_id", "")
        })
    return result

# --- Items Endpoints ---
@api_router.get("/items")
async def get_items(
    category: Optional[str] = None,
    subcategory: Optional[str] = None,
    transaction_type: Optional[str] = None,
    search: Optional[str] = None,
    sort: Optional[str] = "newest"
):
    query = {"visibility": {"$ne": "private"}}  # Exclude private items from public listings
    if category:
        query["category"] = category
    if subcategory:
        query["subcategory"] = subcategory
    if transaction_type:
        query["transaction_type"] = transaction_type
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}},
            {"category": {"$regex": search, "$options": "i"}},
            {"subcategory": {"$regex": search, "$options": "i"}}
        ]
    # Sorting options
    if sort == "price_asc":
        sort_field, sort_order = "estimated_value", 1
    elif sort == "price_desc":
        sort_field, sort_order = "estimated_value", -1
    elif sort == "oldest":
        sort_field, sort_order = "created_at", 1
    elif sort == "value":
        sort_field, sort_order = "estimated_value", -1
    else:
        sort_field, sort_order = "created_at", -1
    
    # OPTIMIZED: Project only necessary fields for listing view
    projection = {
        "_id": 0,
        "item_id": 1,
        "name": 1,
        "category": 1,
        "subcategory": 1,
        "tags": 1,
        "condition": 1,
        "estimated_value": 1,
        "transaction_type": 1,
        "images": {"$slice": 1},  # Only first image for listing
        "owner_id": 1,
        "owner_name": 1,
        "owner_avatar": 1,
        "created_at": 1,
        "desired_trade_for": 1,
        "community_verified": 1,
        "flagged_fake": 1
    }
    
    items = await db.items.find(query, projection).sort(sort_field, sort_order).to_list(100)
    return items

# --- Search Suggestions ---
@api_router.get("/search/suggestions")
async def search_suggestions(q: str = ""):
    if len(q) < 2:
        return []
    pipeline = [
        {"$match": {"$or": [
            {"name": {"$regex": q, "$options": "i"}},
            {"tags": {"$regex": q, "$options": "i"}},
            {"subcategory": {"$regex": q, "$options": "i"}}
        ]}},
        {"$project": {"_id": 0, "item_id": 1, "name": 1, "category": 1, "subcategory": 1, "images": {"$slice": ["$images", 1]}}},
        {"$limit": 8}
    ]
    results = await db.items.aggregate(pipeline).to_list(8)
    return results

@api_router.get("/items/{item_id}")
async def get_item(item_id: str):
    item = await db.items.find_one({"item_id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Oggetto non trovato")
    return item

@api_router.post("/items")
async def create_item(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    
    print(f"📤 [Upload] User {user.get('user_id')} ({user.get('name')}) uploading item")
    print(f"📤 [Upload] Item name: {body.get('name')}")
    print(f"📤 [Upload] Collection name: '{body.get('collection_name')}'")
    print(f"📤 [Upload] Category: {body.get('category')}, Subcategory: {body.get('subcategory')}")
    
    item_id = f"item_{uuid.uuid4().hex[:12]}"
    item = {
        "item_id": item_id,
        "name": body.get("name", ""),
        "category": body.get("category", ""),
        "subcategory": body.get("subcategory", ""),
        "tags": body.get("tags", []),
        "condition": body.get("condition", "Buono"),
        "estimated_value": body.get("estimated_value"),
        "transaction_type": body.get("transaction_type", "scambio"),
        "description": body.get("description", ""),
        "images": body.get("images", []),
        "desired_trade_for": body.get("desired_trade_for", ""),
        "collection_name": body.get("collection_name", ""),
        "collection_percentage": body.get("collection_percentage"),
        "auto_calculate_percentage": body.get("auto_calculate_percentage", True),
        "visibility": body.get("visibility", "public"),
        "profile_section": body.get("profile_section", "scambio_vendita"),
        # NEW: Sealed status
        "sealed": body.get("sealed", False),
        # NEW: Purchase info
        "purchase_info": {
            "store": body.get("purchase_store", ""),
            "date": body.get("purchase_date", ""),
            "price": body.get("purchase_price", None)
        },
        "owner_id": user["user_id"],
        "owner_name": user.get("name", ""),
        "owner_avatar": user.get("picture", ""),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.items.insert_one(item)
    print(f"✅ [Upload] Item saved with ID: {item_id}, MongoDB ID: {result.inserted_id}")
    print(f"✅ [Upload] Owner ID: {user['user_id']}")

    # Auto-catalog into collection if collection_name provided
    coll_name = body.get("collection_name", "")
    coll_pct = body.get("collection_percentage")
    if coll_name:
        existing_coll = await db.collections.find_one(
            {"owner_id": user["user_id"], "name": coll_name}, {"_id": 0}
        )
        if existing_coll:
            new_count = existing_coll.get("owned", 0) + 1
            update_data = {"owned": new_count}
            if coll_pct is not None:
                update_data["percentage"] = coll_pct
            elif existing_coll.get("total", 0) > 0:
                update_data["percentage"] = round((new_count / existing_coll["total"]) * 100)
            await db.collections.update_one(
                {"owner_id": user["user_id"], "name": coll_name},
                {"$set": update_data}
            )
        else:
            await db.collections.insert_one({
                "collection_id": f"coll_{uuid.uuid4().hex[:12]}",
                "owner_id": user["user_id"],
                "name": coll_name,
                "category": body.get("category", ""),
                "subcategory": body.get("subcategory", ""),
                "total": 0,
                "owned": 1,
                "percentage": coll_pct if coll_pct is not None else 0,
                "created_at": datetime.now(timezone.utc).isoformat()
            })

    # Match system: check if this item is on anyone's wishlist
    item_name_lower = item["name"].lower()
    item_tags = [t.lower() for t in item.get("tags", [])]
    search_terms = [item_name_lower] + item_tags + [item.get("category", "").lower(), item.get("subcategory", "").lower()]
    search_terms = [t for t in search_terms if t]

    # OPTIMIZED: Batch fetch wishlist items to avoid N+1 queries
    all_wishlists = await db.wishlist.find({}, {"_id": 0}).to_list(500)
    
    # Collect unique item_ids from wishlists
    wishlist_item_ids = list(set(wl["item_id"] for wl in all_wishlists if wl.get("item_id")))
    
    # Batch fetch all wishlist items in ONE query
    wishlist_items_cursor = db.items.find(
        {"item_id": {"$in": wishlist_item_ids}}, 
        {"_id": 0, "item_id": 1, "name": 1, "tags": 1, "category": 1, "subcategory": 1}
    )
    wishlist_items_list = await wishlist_items_cursor.to_list(len(wishlist_item_ids))
    
    # Create lookup dict for O(1) access
    wishlist_items_map = {item["item_id"]: item for item in wishlist_items_list}
    
    seekers_count = 0
    for wl in all_wishlists:
        if wl["user_id"] == user["user_id"]:
            continue
        
        wl_item = wishlist_items_map.get(wl["item_id"])
        if not wl_item:
            continue
            
        wl_tags = [t.lower() for t in wl_item.get("tags", [])]
        wl_name = wl_item.get("name", "").lower()
        overlap = set(search_terms) & set([wl_name] + wl_tags + [wl_item.get("category", "").lower()])
        if overlap:
            seekers_count += 1
            # Notify the wishlist owner
            await db.notifications.insert_one({
                "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
                "user_id": wl["user_id"],
                "type": "match_perfetto",
                "title": "Match Perfetto!",
                "message": f'{user.get("name", "Qualcuno")} ha caricato "{item["name"]}" che e\' nella tua lista desideri!',
                "link": f"/oggetto/{item_id}",
                "read": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            })

    # Also check desired_trade_for of existing items (reverse match)
    if item.get("desired_trade_for"):
        desired_lower = item["desired_trade_for"].lower()
        potential = await db.items.find({}, {"_id": 0, "item_id": 1, "name": 1, "owner_id": 1, "tags": 1}).to_list(500)
        for p in potential:
            if p["owner_id"] == user["user_id"]:
                continue
            p_name_lower = p.get("name", "").lower()
            p_tags = [t.lower() for t in p.get("tags", [])]
            if desired_lower in p_name_lower or any(desired_lower in t for t in p_tags):
                await db.notifications.insert_one({
                    "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
                    "user_id": p["owner_id"],
                    "type": "match_scambio",
                    "title": "Qualcuno cerca il tuo oggetto!",
                    "message": f'{user.get("name", "Qualcuno")} vuole scambiare "{item["name"]}" e cerca "{item["desired_trade_for"]}".',
                    "link": f"/oggetto/{item_id}",
                    "read": False,
                    "created_at": datetime.now(timezone.utc).isoformat()
                })

    created = await db.items.find_one({"item_id": item_id}, {"_id": 0})
    created["seekers_count"] = seekers_count
    return created

# --- Upload Endpoint ---
@api_router.post("/upload")
async def upload_file(request: Request, file: UploadFile = File(...)):
    user = await get_current_user(request)
    ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
    path = f"{APP_NAME}/uploads/{user['user_id']}/{uuid.uuid4()}.{ext}"
    data = await file.read()
    result = put_object(path, data, file.content_type or "application/octet-stream")
    await db.files.insert_one({
        "file_id": str(uuid.uuid4()),
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": result.get("size", len(data)),
        "owner_id": user["user_id"],
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"path": result["path"], "url": f"/api/files/{result['path']}"}

@api_router.get("/files/{path:path}")
async def serve_file(path: str, auth: Optional[str] = Query(None)):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="File non trovato")
    data, content_type = get_object(path)
    return Response(content=data, media_type=record.get("content_type", content_type))

# --- AI Recognition Endpoint ---
@api_router.post("/recognize")
async def recognize_item(request: Request):
    await get_current_user(request)  # Auth check
    body = await request.json()
    image_base64 = body.get("image_base64")
    if not image_base64:
        raise HTTPException(status_code=400, detail="image_base64 richiesto")
    try:
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=f"recognize_{uuid.uuid4().hex[:8]}",
            system_message="""Sei un esperto di oggetti da collezione. Analizza l'immagine fornita e identifica l'oggetto.
Rispondi SOLO con un JSON valido (senza markdown, senza ```), con questa struttura esatta:
{
  "name": "nome dell'oggetto identificato",
  "category": "una tra: Carte, Funko Pop, LEGO, Vintage, Manga & Anime",
  "subcategory": "sottocategoria specifica (es. Pokemon, Star Wars, Marvel, ecc.)",
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "estimated_value": 0,
  "condition_hint": "stima della condizione visiva: Nuovo, Eccellente, Buono, Discreto, Da restaurare",
  "description": "breve descrizione dell'oggetto"
}
Se non riesci a identificare l'oggetto, prova comunque a dare una stima ragionevole basata su quello che vedi."""
        ).with_model("openai", "gpt-4o")

        image_content = ImageContent(image_base64=image_base64)
        user_msg = UserMessage(
            text="Identifica questo oggetto da collezione e fornisci tutte le informazioni possibili.",
            file_contents=[image_content]
        )
        response_text = await chat.send_message(user_msg)
        # Parse JSON from response
        cleaned = response_text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
            cleaned = cleaned.rsplit("```", 1)[0]
        result = json.loads(cleaned)
        return result
    except json.JSONDecodeError:
        logger.error(f"AI response not valid JSON: {response_text[:200]}")
        return {
            "name": "Oggetto non identificato",
            "category": "Carte",
            "subcategory": "",
            "tags": ["da verificare"],
            "estimated_value": 0,
            "condition_hint": "Buono",
            "description": response_text[:200] if response_text else "L'AI non ha potuto identificare l'oggetto."
        }
    except Exception as e:
        logger.error(f"AI recognition error: {e}")
        return {
            "name": "Oggetto non identificato",
            "category": "Carte",
            "subcategory": "",
            "tags": ["da verificare"],
            "estimated_value": 0,
            "condition_hint": "Buono",
            "description": "Errore nel riconoscimento. Compila i campi manualmente."
        }

# --- Wishlist Endpoints ---
@api_router.post("/wishlist/add")
async def add_to_wishlist(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    item_id = body.get("item_id")
    if not item_id:
        raise HTTPException(status_code=400, detail="item_id richiesto")
    existing = await db.wishlist.find_one({"user_id": user["user_id"], "item_id": item_id})
    if existing:
        return {"message": "Gia nella lista desideri"}
    await db.wishlist.insert_one({
        "user_id": user["user_id"],
        "item_id": item_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "Aggiunto alla lista desideri"}

@api_router.delete("/wishlist/{item_id}")
async def remove_from_wishlist(request: Request, item_id: str):
    user = await get_current_user(request)
    await db.wishlist.delete_one({"user_id": user["user_id"], "item_id": item_id})
    return {"message": "Rimosso dalla lista desideri"}

@api_router.get("/wishlist")
async def get_wishlist(request: Request):
    user = await get_current_user(request)
    wishlist_items = await db.wishlist.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(100)
    item_ids = [w["item_id"] for w in wishlist_items]
    if not item_ids:
        return []
    items = await db.items.find({"item_id": {"$in": item_ids}}, {"_id": 0}).to_list(100)
    return items

# --- Notification Endpoints ---
@api_router.get("/notifications")
async def get_notifications(request: Request):
    user = await get_current_user(request)
    notifications = await db.notifications.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return notifications

@api_router.post("/notifications/read-all")
async def mark_notifications_read(request: Request):
    user = await get_current_user(request)
    await db.notifications.update_many(
        {"user_id": user["user_id"], "read": False},
        {"$set": {"read": True}}
    )
    return {"message": "Tutte le notifiche segnate come lette"}

# --- Collection Endpoints ---
@api_router.get("/collections/{user_id}")
async def get_user_collections(user_id: str):
    collections = await db.collections.find(
        {"owner_id": user_id}, {"_id": 0}
    ).to_list(100)
    return collections

@api_router.post("/collections")
async def create_collection(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    coll_name = body.get("name", "")
    if not coll_name:
        raise HTTPException(status_code=400, detail="Nome collezione richiesto")
    existing = await db.collections.find_one(
        {"owner_id": user["user_id"], "name": coll_name}
    )
    if existing:
        raise HTTPException(status_code=400, detail="Collezione gia esistente")
    coll = {
        "collection_id": f"coll_{uuid.uuid4().hex[:12]}",
        "owner_id": user["user_id"],
        "name": coll_name,
        "category": body.get("category", ""),
        "subcategory": body.get("subcategory", ""),
        "total": body.get("total", 0),
        "owned": body.get("owned", 0),
        "percentage": body.get("percentage", 0),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.collections.insert_one(coll)
    created = await db.collections.find_one({"collection_id": coll["collection_id"]}, {"_id": 0})
    return created

@api_router.put("/collections/{collection_id}")
async def update_collection(request: Request, collection_id: str):
    user = await get_current_user(request)
    body = await request.json()
    coll = await db.collections.find_one(
        {"collection_id": collection_id, "owner_id": user["user_id"]}
    )
    if not coll:
        raise HTTPException(status_code=404, detail="Collezione non trovata")
    update_data = {}
    if "percentage" in body:
        update_data["percentage"] = body["percentage"]
    if "total" in body:
        update_data["total"] = body["total"]
    if "owned" in body:
        update_data["owned"] = body["owned"]
    if "name" in body:
        update_data["name"] = body["name"]
    if update_data:
        await db.collections.update_one(
            {"collection_id": collection_id},
            {"$set": update_data}
        )
    updated = await db.collections.find_one({"collection_id": collection_id}, {"_id": 0})
    return updated

# --- Get User Collections with Items Grouped ---
@api_router.get("/collections/grouped")
async def get_user_collections_grouped(request: Request):
    """Get user's items grouped by collection_name with stats"""
    user = await get_current_user(request)
    
    print(f"🔍 [Collections] User requesting: {user.get('user_id')} ({user.get('name')})")
    
    # Fetch all user's collection items
    items = await db.items.find(
        {"owner_id": user["user_id"]},
        {"_id": 0}
    ).to_list(1000)
    
    print(f"📦 [Collections] Found {len(items)} items for user {user.get('user_id')}")
    
    if len(items) > 0:
        print(f"📦 [Collections] Sample item: {items[0].get('name')} - collection_name: '{items[0].get('collection_name')}'")
    
    # Group by collection_name
    collections_dict = {}
    for item in items:
        coll_name = item.get("collection_name") or "Senza Collezione"
        if coll_name not in collections_dict:
            collections_dict[coll_name] = {
                "collection_name": coll_name,
                "items": [],
                "total_value": 0,
                "sealed_count": 0,
                "percentage": item.get("collection_percentage", 0)
            }
        collections_dict[coll_name]["items"].append(item)
        if item.get("estimated_value"):
            collections_dict[coll_name]["total_value"] += item.get("estimated_value", 0)
        if item.get("sealed"):
            collections_dict[coll_name]["sealed_count"] += 1
    
    # Convert to list and add item count
    collections = []
    for coll_name, coll_data in collections_dict.items():
        coll_data["item_count"] = len(coll_data["items"])
        collections.append(coll_data)
    
    # Sort by item count desc
    collections.sort(key=lambda x: x["item_count"], reverse=True)
    
    print(f"✅ [Collections] Returning {len(collections)} collections")
    
    return collections

# --- Match/Seekers Count Endpoint ---
@api_router.get("/items/{item_id}/seekers")
async def get_seekers_count(item_id: str):
    item = await db.items.find_one({"item_id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Oggetto non trovato")
    item_name_lower = item["name"].lower()
    item_tags = [t.lower() for t in item.get("tags", [])]
    search_terms = set([item_name_lower] + item_tags)
    
    # OPTIMIZED: Batch fetch wishlist items
    all_wishlists = await db.wishlist.find({}, {"_id": 0}).to_list(500)
    wishlist_item_ids = list(set(wl["item_id"] for wl in all_wishlists if wl.get("item_id")))
    
    # Fetch all items in ONE query
    wishlist_items_cursor = db.items.find(
        {"item_id": {"$in": wishlist_item_ids}},
        {"_id": 0, "item_id": 1, "name": 1, "tags": 1}
    )
    wishlist_items_list = await wishlist_items_cursor.to_list(len(wishlist_item_ids))
    wishlist_items_map = {item["item_id"]: item for item in wishlist_items_list}
    
    count = 0
    for wl in all_wishlists:
        wl_item = wishlist_items_map.get(wl["item_id"])
        if not wl_item:
            continue
        wl_tags = set([t.lower() for t in wl_item.get("tags", [])] + [wl_item.get("name", "").lower()])
        if search_terms & wl_tags:
            count += 1
    return {"seekers_count": count}

# --- User Profile ---
@api_router.get("/users/{user_id}")
async def get_user_profile(user_id: str):
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Utente non trovato")
    items = await db.items.find({"owner_id": user_id}, {"_id": 0}).to_list(200)
    collections = await db.collections.find({"owner_id": user_id}, {"_id": 0}).to_list(100)
    # Get average rating
    ratings = await db.ratings.find({"rated_user_id": user_id}, {"_id": 0}).to_list(100)
    avg_rating = round(sum(r.get("score", 0) for r in ratings) / len(ratings), 1) if ratings else 0
    return {**user, "items": items, "collections": collections, "avg_rating": avg_rating, "rating_count": len(ratings), "ratings": ratings[:10]}

# --- Item Visibility Toggle ---
@api_router.put("/items/{item_id}/visibility")
async def toggle_item_visibility(request: Request, item_id: str):
    user = await get_current_user(request)
    body = await request.json()
    item = await db.items.find_one({"item_id": item_id, "owner_id": user["user_id"]})
    if not item:
        raise HTTPException(status_code=404, detail="Oggetto non trovato")
    await db.items.update_one({"item_id": item_id}, {"$set": {"visibility": body.get("visibility", "public")}})
    return {"message": "Visibilita aggiornata"}

# --- Item Section Update ---
@api_router.put("/items/{item_id}/section")
async def update_item_section(request: Request, item_id: str):
    user = await get_current_user(request)
    body = await request.json()
    item = await db.items.find_one({"item_id": item_id, "owner_id": user["user_id"]})
    if not item:
        raise HTTPException(status_code=404, detail="Oggetto non trovato")
    section = body.get("profile_section", "scambio_vendita")
    tx = body.get("transaction_type")
    update = {"profile_section": section}
    if tx:
        update["transaction_type"] = tx
    await db.items.update_one({"item_id": item_id}, {"$set": update})
    return {"message": "Sezione aggiornata"}

# --- Rating/Review System ---
@api_router.post("/ratings")
async def create_rating(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    rated_user_id = body.get("rated_user_id")
    score = body.get("score", 5)
    comment = body.get("comment", "")
    trade_id = body.get("trade_id", "")
    if not rated_user_id:
        raise HTTPException(status_code=400, detail="rated_user_id richiesto")
    if score < 1 or score > 5:
        raise HTTPException(status_code=400, detail="Punteggio da 1 a 5")
    if rated_user_id == user["user_id"]:
        raise HTTPException(status_code=400, detail="Non puoi valutare te stesso")
    rating_id = f"rating_{uuid.uuid4().hex[:12]}"
    await db.ratings.insert_one({
        "rating_id": rating_id,
        "rater_id": user["user_id"],
        "rater_name": user.get("name", ""),
        "rater_avatar": user.get("picture", ""),
        "rated_user_id": rated_user_id,
        "score": score,
        "comment": comment,
        "trade_id": trade_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    # Update user level based on rating count
    all_ratings = await db.ratings.count_documents({"rated_user_id": rated_user_id})
    avg = await db.ratings.aggregate([
        {"$match": {"rated_user_id": rated_user_id}},
        {"$group": {"_id": None, "avg": {"$avg": "$score"}}}
    ]).to_list(1)
    avg_score = avg[0]["avg"] if avg else 0
    level = "Principiante"
    if all_ratings >= 10 and avg_score >= 4:
        level = "Collezionista Esperto"
    elif all_ratings >= 5:
        level = "Collezionista Intermedio"
    await db.users.update_one({"user_id": rated_user_id}, {"$set": {"level": level}})
    return {"rating_id": rating_id, "message": "Valutazione inviata"}

@api_router.get("/ratings/{user_id}")
async def get_user_ratings(user_id: str):
    ratings = await db.ratings.find({"rated_user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    avg = await db.ratings.aggregate([
        {"$match": {"rated_user_id": user_id}},
        {"$group": {"_id": None, "avg": {"$avg": "$score"}}}
    ]).to_list(1)
    return {"ratings": ratings, "average": round(avg[0]["avg"], 1) if avg else 0, "count": len(ratings)}

# --- Pending Trades ---
@api_router.get("/trades/pending")
async def get_pending_trades(request: Request):
    user = await get_current_user(request)
    uid = user["user_id"]
    pending = await db.trades.find(
        {"$or": [
            {"proposer_id": uid, "status": "pending"},
            {"receiver_id": uid, "status": "pending"}
        ]}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return pending

# --- Collection Suggestions (AI-powered) ---
@api_router.get("/collections/{user_id}/suggestions")
async def get_collection_suggestions(user_id: str):
    collections = await db.collections.find({"owner_id": user_id}, {"_id": 0}).to_list(50)
    user_items = await db.items.find({"owner_id": user_id}, {"_id": 0}).to_list(200)
    user_item_names = set(i.get("name", "").lower() for i in user_items)
    user_tags = set()
    for i in user_items:
        user_tags.update(t.lower() for t in i.get("tags", []))
    suggestions = []
    for coll in collections:
        if coll.get("percentage", 0) >= 100:
            continue
        coll_cat = coll.get("category", "")
        coll_sub = coll.get("subcategory", "")
        # Find items from other users in the same category/subcategory
        query = {"owner_id": {"$ne": user_id}}
        if coll_cat:
            query["category"] = coll_cat
        if coll_sub:
            query["subcategory"] = coll_sub
        potential = await db.items.find(query, {"_id": 0}).to_list(20)
        for p in potential:
            if p.get("name", "").lower() not in user_item_names:
                suggestions.append({
                    "collection_name": coll.get("name", ""),
                    "suggested_item": {
                        "item_id": p["item_id"], "name": p["name"],
                        "images": p.get("images", [])[:1],
                        "owner_name": p.get("owner_name", ""),
                        "owner_id": p.get("owner_id", ""),
                        "estimated_value": p.get("estimated_value")
                    }
                })
                if len(suggestions) >= 10:
                    break
        if len(suggestions) >= 10:
            break
    return suggestions

# --- Seed Mock Data ---
@api_router.post("/seed")
async def seed_data():
    existing = await db.items.count_documents({})
    if existing > 0:
        return {"message": "Dati gia presenti", "count": existing}

    mock_users = [
        {"user_id": "user_mock_001", "email": "marco@example.com", "name": "Marco Rossi",
         "picture": "https://images.unsplash.com/photo-1639149888905-fb39731f2e6c?w=200&h=200&fit=crop",
         "level": "Collezionista Esperto", "badges": ["Prima collezione", "10 scambi", "Super Trader"],
         "created_at": datetime.now(timezone.utc).isoformat()},
        {"user_id": "user_mock_002", "email": "giulia@example.com", "name": "Giulia Bianchi",
         "picture": "https://images.unsplash.com/photo-1520283818086-3f6dffb019c0?w=200&h=200&fit=crop",
         "level": "Collezionista Intermedio", "badges": ["Prima collezione", "5 scambi"],
         "created_at": datetime.now(timezone.utc).isoformat()},
        {"user_id": "user_mock_003", "email": "luca@example.com", "name": "Luca Verdi",
         "picture": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
         "level": "Principiante", "badges": ["Prima collezione"],
         "created_at": datetime.now(timezone.utc).isoformat()},
    ]

    mock_items = [
        {"item_id": "item_mock_001", "name": "Charizard Holo 1a Edizione", "category": "Carte",
         "subcategory": "Pokemon", "tags": ["raro", "holo", "1a edizione", "base set"],
         "condition": "Eccellente", "estimated_value": 450.0, "transaction_type": "scambio",
         "description": "Charizard holografico dalla prima edizione del set base. Condizioni eccellenti, bordi perfetti.",
         "images": ["https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=600&h=600&fit=crop"],
         "owner_id": "user_mock_001", "owner_name": "Marco Rossi",
         "owner_avatar": "https://images.unsplash.com/photo-1639149888905-fb39731f2e6c?w=200&h=200&fit=crop",
         "created_at": "2025-12-01T10:00:00+00:00"},
        {"item_id": "item_mock_002", "name": "Pikachu VMAX Rainbow", "category": "Carte",
         "subcategory": "Pokemon", "tags": ["vmax", "rainbow", "raro"],
         "condition": "Nuovo", "estimated_value": 120.0, "transaction_type": "scambio",
         "description": "Pikachu VMAX versione Rainbow Secret Rare. Appena aperta dalla busta.",
         "images": ["https://images.unsplash.com/photo-1640271204756-6bf55641d9fe?w=600&h=600&fit=crop"],
         "owner_id": "user_mock_002", "owner_name": "Giulia Bianchi",
         "owner_avatar": "https://images.unsplash.com/photo-1520283818086-3f6dffb019c0?w=200&h=200&fit=crop",
         "created_at": "2025-12-02T14:30:00+00:00"},
        {"item_id": "item_mock_003", "name": "LEGO Star Wars Millennium Falcon", "category": "LEGO",
         "subcategory": "Star Wars", "tags": ["star wars", "millennium falcon", "set completo"],
         "condition": "Buono", "estimated_value": 350.0, "transaction_type": "scambio",
         "description": "Set LEGO #75257 Millennium Falcon completo con minifigure. Scatola inclusa.",
         "images": ["https://images.unsplash.com/photo-1644955133198-903b3ffb3f77?w=600&h=600&fit=crop"],
         "owner_id": "user_mock_001", "owner_name": "Marco Rossi",
         "owner_avatar": "https://images.unsplash.com/photo-1639149888905-fb39731f2e6c?w=200&h=200&fit=crop",
         "created_at": "2025-12-03T09:15:00+00:00"},
        {"item_id": "item_mock_004", "name": "Funko Pop Darth Vader #01", "category": "Funko Pop",
         "subcategory": "Star Wars", "tags": ["star wars", "darth vader", "classico"],
         "condition": "Nuovo", "estimated_value": 85.0, "transaction_type": "vendita",
         "description": "Funko Pop #01 Darth Vader originale. Scatola in condizioni perfette.",
         "images": ["https://images.unsplash.com/photo-1643507646512-4de8e7aadf41?w=600&h=600&fit=crop"],
         "owner_id": "user_mock_003", "owner_name": "Luca Verdi",
         "owner_avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
         "created_at": "2025-12-04T16:45:00+00:00"},
        {"item_id": "item_mock_005", "name": "Magic The Gathering Black Lotus", "category": "Carte",
         "subcategory": "Magic", "tags": ["mtg", "black lotus", "alpha", "leggendario"],
         "condition": "Buono", "estimated_value": 5000.0, "transaction_type": "scambio",
         "description": "Black Lotus Alpha edition. Pezzo da collezione unico.",
         "images": ["https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=600&h=600&fit=crop"],
         "owner_id": "user_mock_002", "owner_name": "Giulia Bianchi",
         "owner_avatar": "https://images.unsplash.com/photo-1520283818086-3f6dffb019c0?w=200&h=200&fit=crop",
         "created_at": "2025-12-05T11:20:00+00:00"},
        {"item_id": "item_mock_006", "name": "LEGO Technic Lamborghini", "category": "LEGO",
         "subcategory": "Technic", "tags": ["technic", "lamborghini", "supercar"],
         "condition": "Nuovo", "estimated_value": 280.0, "transaction_type": "vendita",
         "description": "LEGO Technic Lamborghini Sian FKP 37 completo. Mai aperto.",
         "images": ["https://images.unsplash.com/photo-1644955133198-903b3ffb3f77?w=600&h=600&fit=crop"],
         "owner_id": "user_mock_003", "owner_name": "Luca Verdi",
         "owner_avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
         "created_at": "2025-12-06T08:00:00+00:00"},
        {"item_id": "item_mock_007", "name": "Funko Pop Spider-Man #03", "category": "Funko Pop",
         "subcategory": "Marvel", "tags": ["marvel", "spider-man", "limited edition"],
         "condition": "Eccellente", "estimated_value": 65.0, "transaction_type": "scambio",
         "description": "Funko Pop Spider-Man edizione limitata. Pezzo ricercato.",
         "images": ["https://images.unsplash.com/photo-1643507646512-4de8e7aadf41?w=600&h=600&fit=crop"],
         "owner_id": "user_mock_001", "owner_name": "Marco Rossi",
         "owner_avatar": "https://images.unsplash.com/photo-1639149888905-fb39731f2e6c?w=200&h=200&fit=crop",
         "created_at": "2025-12-07T13:30:00+00:00"},
        {"item_id": "item_mock_008", "name": "Yu-Gi-Oh Blue Eyes White Dragon", "category": "Carte",
         "subcategory": "Yu-Gi-Oh", "tags": ["yu-gi-oh", "drago bianco", "ultra raro"],
         "condition": "Buono", "estimated_value": 200.0, "transaction_type": "scambio",
         "description": "Blue Eyes White Dragon Ultra Rara. Carta iconica in buone condizioni.",
         "images": ["https://images.unsplash.com/photo-1640271204756-6bf55641d9fe?w=600&h=600&fit=crop"],
         "owner_id": "user_mock_002", "owner_name": "Giulia Bianchi",
         "owner_avatar": "https://images.unsplash.com/photo-1520283818086-3f6dffb019c0?w=200&h=200&fit=crop",
         "created_at": "2025-12-08T10:00:00+00:00"},
        {"item_id": "item_mock_009", "name": "LEGO Harry Potter Hogwarts", "category": "LEGO",
         "subcategory": "Harry Potter", "tags": ["harry potter", "hogwarts", "castello"],
         "condition": "Eccellente", "estimated_value": 420.0, "transaction_type": "scambio",
         "description": "Set LEGO Castello di Hogwarts completo. Un capolavoro per collezionisti.",
         "images": ["https://images.unsplash.com/photo-1644955133198-903b3ffb3f77?w=600&h=600&fit=crop"],
         "owner_id": "user_mock_001", "owner_name": "Marco Rossi",
         "owner_avatar": "https://images.unsplash.com/photo-1639149888905-fb39731f2e6c?w=200&h=200&fit=crop",
         "created_at": "2025-12-09T15:00:00+00:00"},
        {"item_id": "item_mock_010", "name": "Funko Pop Batman #01 Blue Box", "category": "Funko Pop",
         "subcategory": "DC Comics", "tags": ["dc", "batman", "blue box", "raro"],
         "condition": "Buono", "estimated_value": 150.0, "transaction_type": "vendita",
         "description": "Funko Pop Batman Blue Box originale. Pezzo raro per collezionisti.",
         "images": ["https://images.unsplash.com/photo-1643507646512-4de8e7aadf41?w=600&h=600&fit=crop"],
         "owner_id": "user_mock_003", "owner_name": "Luca Verdi",
         "owner_avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
         "created_at": "2025-12-10T12:00:00+00:00"},
        {"item_id": "item_mock_011", "name": "Set Completo Base Pokemon 1999", "category": "Carte",
         "subcategory": "Pokemon", "tags": ["pokemon", "set completo", "base set", "1999"],
         "condition": "Buono", "estimated_value": 2500.0, "transaction_type": "scambio",
         "description": "Set base completo di 102 carte Pokemon originali del 1999.",
         "images": ["https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=600&h=600&fit=crop"],
         "owner_id": "user_mock_002", "owner_name": "Giulia Bianchi",
         "owner_avatar": "https://images.unsplash.com/photo-1520283818086-3f6dffb019c0?w=200&h=200&fit=crop",
         "created_at": "2025-12-11T09:00:00+00:00"},
        {"item_id": "item_mock_012", "name": "LEGO Creator Expert Fiat 500", "category": "LEGO",
         "subcategory": "Creator Expert", "tags": ["fiat 500", "creator expert", "vintage"],
         "condition": "Nuovo", "estimated_value": 90.0, "transaction_type": "vendita",
         "description": "LEGO Creator Expert Fiat 500 in giallo. Set nuovo sigillato.",
         "images": ["https://images.unsplash.com/photo-1644955133198-903b3ffb3f77?w=600&h=600&fit=crop"],
         "owner_id": "user_mock_001", "owner_name": "Marco Rossi",
         "owner_avatar": "https://images.unsplash.com/photo-1639149888905-fb39731f2e6c?w=200&h=200&fit=crop",
         "created_at": "2025-12-12T14:00:00+00:00"},
    ]

    for u in mock_users:
        existing_u = await db.users.find_one({"user_id": u["user_id"]})
        if not existing_u:
            await db.users.insert_one(u)

    for item in mock_items:
        await db.items.insert_one(item)

    return {"message": "Dati mock caricati", "items": len(mock_items), "users": len(mock_users)}

# --- Tribunale Anti-Fake della Community ---
TRIBUNAL_QUORUM = 3  # Votes needed to decide
TRIBUNAL_ELIGIBLE_LEVELS = ["Collezionista Esperto", "Collezionista Intermedio"]
HIGH_VALUE_THRESHOLD = 200  # Auto-submit items above this value

@api_router.get("/tribunal/check-eligibility")
async def check_tribunal_eligibility(request: Request):
    """Check if current user can vote in tribunal"""
    user = await get_current_user(request)
    user_level = user.get("level", "Principiante")
    rating_count = await db.ratings.count_documents({"rated_user_id": user["user_id"]})
    is_eligible = user_level in TRIBUNAL_ELIGIBLE_LEVELS or rating_count >= 3
    
    return {
        "eligible": is_eligible,
        "user_level": user_level,
        "rating_count": rating_count,
        "required_level": "Intermedio o Esperto",
        "required_ratings": 3,
        "reason": "Hai il livello richiesto" if user_level in TRIBUNAL_ELIGIBLE_LEVELS else 
                  f"Hai {rating_count}/3 recensioni" if rating_count > 0 else
                  "Devi essere almeno Intermedio o avere 3 recensioni"
    }

@api_router.post("/tribunal/report")
async def report_item_for_tribunal(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    item_id = body.get("item_id")
    reason = body.get("reason", "Sospetto falso")
    if not item_id:
        raise HTTPException(status_code=400, detail="item_id richiesto")
    item = await db.items.find_one({"item_id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Oggetto non trovato")
    existing = await db.tribunal.find_one({"item_id": item_id, "status": {"$in": ["pending", "voting"]}})
    if existing:
        return {"message": "Questo oggetto e' gia sotto esame", "tribunal_id": existing.get("tribunal_id", "")}
    tribunal_id = f"trib_{uuid.uuid4().hex[:12]}"
    tribunal = {
        "tribunal_id": tribunal_id,
        "item_id": item_id,
        "item_name": item.get("name", ""),
        "item_images": item.get("images", [])[:3],
        "item_category": item.get("category", ""),
        "item_subcategory": item.get("subcategory", ""),
        "item_value": item.get("estimated_value", 0),
        "item_owner_id": item.get("owner_id", ""),
        "item_owner_name": item.get("owner_name", ""),
        "reported_by": user["user_id"],
        "reporter_name": user.get("name", ""),
        "reason": reason,
        "status": "voting",  # pending -> voting -> verified / fake
        "votes": [],
        "votes_authentic": 0,
        "votes_fake": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.tribunal.insert_one(tribunal)
    # Notify item owner
    await db.notifications.insert_one({
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
        "user_id": item.get("owner_id", ""),
        "type": "tribunal_report",
        "title": "Il tuo oggetto e' sotto verifica",
        "message": f'"{item["name"]}" e\' stato segnalato per verifica dalla community. I Saggi esamineranno le foto.',
        "link": f"/oggetto/{item_id}",
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    created = await db.tribunal.find_one({"tribunal_id": tribunal_id}, {"_id": 0})
    return created

@api_router.get("/tribunal/item/{item_id}")
async def get_tribunal_status(item_id: str):
    tribunal = await db.tribunal.find_one(
        {"item_id": item_id},
        {"_id": 0}
    )
    if not tribunal:
        return {"status": "none", "item_id": item_id}
    return tribunal

@api_router.post("/tribunal/vote/{item_id}")
async def vote_on_tribunal(request: Request, item_id: str):
    user = await get_current_user(request)
    # Check eligibility: must be at least Intermedio level
    user_level = user.get("level", "Principiante")
    # Count their ratings to check if they qualify
    rating_count = await db.ratings.count_documents({"rated_user_id": user["user_id"]})
    is_eligible = user_level in TRIBUNAL_ELIGIBLE_LEVELS or rating_count >= 3
    if not is_eligible:
        raise HTTPException(
            status_code=403, 
            detail=f"Per votare nel Tribunale devi essere almeno 'Intermedio' o avere 3+ recensioni. Il tuo livello: {user_level}, Recensioni: {rating_count}/3"
        )
    body = await request.json()
    vote = body.get("vote")  # "authentic" or "fake"
    comment = body.get("comment", "")
    if vote not in ("authentic", "fake"):
        raise HTTPException(status_code=400, detail="Vote deve essere 'authentic' o 'fake'")
    tribunal = await db.tribunal.find_one({"item_id": item_id, "status": "voting"})
    if not tribunal:
        raise HTTPException(status_code=404, detail="Nessun caso aperto per questo oggetto")
    # Check if user already voted
    existing_votes = tribunal.get("votes", [])
    if any(v["user_id"] == user["user_id"] for v in existing_votes):
        raise HTTPException(status_code=400, detail="Hai gia votato per questo oggetto")
    # Cannot vote on own item
    if tribunal.get("item_owner_id") == user["user_id"]:
        raise HTTPException(status_code=400, detail="Non puoi votare sul tuo stesso oggetto")
    new_vote = {
        "user_id": user["user_id"],
        "user_name": user.get("name", ""),
        "user_avatar": user.get("picture", ""),
        "user_level": user_level,
        "vote": vote,
        "comment": comment,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    inc_field = "votes_authentic" if vote == "authentic" else "votes_fake"
    await db.tribunal.update_one(
        {"item_id": item_id, "status": "voting"},
        {"$push": {"votes": new_vote}, "$inc": {inc_field: 1}}
    )
    # Check quorum
    updated = await db.tribunal.find_one({"item_id": item_id, "status": "voting"}, {"_id": 0})
    total_votes = updated.get("votes_authentic", 0) + updated.get("votes_fake", 0)
    if total_votes >= TRIBUNAL_QUORUM:
        if updated["votes_authentic"] > updated["votes_fake"]:
            # Verified! Add community badge to item
            await db.tribunal.update_one(
                {"item_id": item_id, "status": "voting"},
                {"$set": {"status": "verified"}}
            )
            await db.items.update_one(
                {"item_id": item_id},
                {"$set": {"community_verified": True, "community_verified_at": datetime.now(timezone.utc).isoformat()}}
            )
            # Notify owner
            await db.notifications.insert_one({
                "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
                "user_id": updated.get("item_owner_id", ""),
                "type": "tribunal_verified",
                "title": "Oggetto Verificato dalla Community!",
                "message": f'"{updated["item_name"]}" ha ricevuto il bollino blu di autenticita!',
                "link": f"/oggetto/{item_id}",
                "read": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        else:
            # Flagged as fake
            await db.tribunal.update_one(
                {"item_id": item_id, "status": "voting"},
                {"$set": {"status": "fake"}}
            )
            await db.items.update_one(
                {"item_id": item_id},
                {"$set": {"community_verified": False, "flagged_fake": True}}
            )
            await db.notifications.insert_one({
                "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
                "user_id": updated.get("item_owner_id", ""),
                "type": "tribunal_fake",
                "title": "Oggetto non superato la verifica",
                "message": f'"{updated["item_name"]}" non ha superato la verifica della community.',
                "link": f"/oggetto/{item_id}",
                "read": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
    result = await db.tribunal.find_one({"item_id": item_id}, {"_id": 0})
    return result

@api_router.get("/tribunal/pending")
async def get_pending_tribunal_cases(request: Request):
    user = await get_current_user(request)
    cases = await db.tribunal.find(
        {"status": "voting"},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    # Mark which ones user already voted on
    uid = user["user_id"]
    for case in cases:
        case["user_has_voted"] = any(v["user_id"] == uid for v in case.get("votes", []))
        case["is_own_item"] = case.get("item_owner_id") == uid
    return cases

@api_router.get("/tribunal/stats")
async def get_tribunal_stats():
    total = await db.tribunal.count_documents({})
    verified = await db.tribunal.count_documents({"status": "verified"})
    fake = await db.tribunal.count_documents({"status": "fake"})
    voting = await db.tribunal.count_documents({"status": "voting"})
    return {"total": total, "verified": verified, "fake": fake, "voting": voting}

@api_router.get("/")
async def root():
    return {"message": "Yellow Pecora API"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    try:
        init_storage()
        logger.info("Storage inizializzato")
    except Exception as e:
        logger.error(f"Storage init fallito: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
