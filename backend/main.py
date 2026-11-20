"""
FastAPI application for the ReUseLoop reuse marketplace.
"""

import uuid
from pathlib import Path
from typing import Generator

from fastapi import (
    Depends,
    FastAPI,
    File,
    HTTPException,
    UploadFile,
    Body
)

from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.database import SessionLocal
from backend.recommendations import recommend_similar_items
from backend.schemas import ItemCreate, ItemResponse


# ==========================================
# PROJECT PATHS
# ==========================================

BASE_DIR = Path(__file__).resolve().parent.parent

FRONTEND_DIR = BASE_DIR / "frontend"
UPLOAD_DIR = BASE_DIR / "uploads"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# ==========================================
# IMAGE SETTINGS
# ==========================================

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp"
}

MAX_IMAGE_SIZE = 5 * 1024 * 1024


# ==========================================
# FASTAPI APPLICATION
# ==========================================

app = FastAPI(
    title="ReUseLoop API",
    description="A platform for sustainable reuse, repair, donation, and exchange.",
    version="1.2.0"
)


# ==========================================
# CORS SETTINGS
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:5501",
        "http://localhost:5501",
        "http://127.0.0.1:8000",
        "http://localhost:8000"
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)


# ==========================================
# DATABASE CONNECTION
# ==========================================

def get_db() -> Generator[Session, None, None]:

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# ==========================================
# DATABASE HEALTH CHECK
# ==========================================

@app.get("/health/database")
def check_database(db: Session = Depends(get_db)):

    try:

        db.execute(text("SELECT 1"))

        return {
            "database": "connected",
            "status": "healthy"
        }

    except Exception as exc:

        raise HTTPException(
            status_code=503,
            detail="Database connection failed. Check your MySQL settings."
        ) from exc


# ==========================================
# SEARCH ITEMS
# ==========================================

@app.get("/items/search", response_model=list[ItemResponse])
def search_items(
    q: str,
    db: Session = Depends(get_db)
):

    query = text("""
        SELECT
            item_id,
            owner_id,
            category_id,
            title,
            description,
            item_condition,
            listing_type,
            price,
            city,
            status,
            image_url,
            contact_email
        FROM items
        WHERE status = 'Available'
          AND (
              title LIKE :search
              OR description LIKE :search
              OR city LIKE :search
          )
        ORDER BY created_at DESC
    """)

    rows = db.execute(
        query,
        {"search": f"%{q.strip()}%"}
    ).mappings().all()

    return [dict(row) for row in rows]


# ==========================================
# GET ALL AVAILABLE ITEMS
# ==========================================

@app.get("/items", response_model=list[ItemResponse])
def get_items(db: Session = Depends(get_db)):

    query = text("""
        SELECT
            item_id,
            owner_id,
            category_id,
            title,
            description,
            item_condition,
            listing_type,
            price,
            city,
            status,
            image_url,
            contact_email
        FROM items
        WHERE status = 'Available'
        ORDER BY created_at DESC
    """)

    try:

        rows = db.execute(query).mappings().all()

        return [dict(row) for row in rows]

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail="Could not retrieve items. Check your database tables."
        ) from exc


# ==========================================
# CREATE NEW ITEM
# ==========================================

@app.post(
    "/items",
    response_model=ItemResponse,
    status_code=201
)
def create_item(
    item: ItemCreate,
    db: Session = Depends(get_db)
):

    # Validate sale price

    if item.listing_type == "Sale" and item.price is None:

        raise HTTPException(
            status_code=400,
            detail="A price is required for sale listings."
        )

    # Exchange and donation should not have a price

    if item.listing_type != "Sale" and item.price is not None:

        raise HTTPException(
            status_code=400,
            detail="Exchange and donation listings must not have a price."
        )

    try:

        # Insert item into MySQL

        insert_result = db.execute(
            text("""
                INSERT INTO items (
                    owner_id,
                    category_id,
                    title,
                    description,
                    item_condition,
                    listing_type,
                    price,
                    city,
                    contact_email
                )
                VALUES (
                    :owner_id,
                    :category_id,
                    :title,
                    :description,
                    :item_condition,
                    :listing_type,
                    :price,
                    :city,
                    :contact_email
                )
            """),
            {
                "owner_id": item.owner_id,
                "category_id": item.category_id,
                "title": item.title,
                "description": item.description,
                "item_condition": item.item_condition,
                "listing_type": item.listing_type,
                "price": item.price,
                "city": item.city,
                "contact_email": str(item.contact_email)
            }
        )

        new_item_id = insert_result.lastrowid

        db.commit()

        # Retrieve the newly created item

        saved = db.execute(
            text("""
                SELECT
                    item_id,
                    owner_id,
                    category_id,
                    title,
                    description,
                    item_condition,
                    listing_type,
                    price,
                    city,
                    status,
                    image_url,
                    contact_email
                FROM items
                WHERE item_id = :item_id
            """),
            {"item_id": new_item_id}
        ).mappings().one()

        return dict(saved)

    except Exception as exc:

        db.rollback()

        raise HTTPException(
            status_code=400,
            detail=f"Could not create item: {str(exc)}"
        ) from exc


# ==========================================
# ITEM RECOMMENDATIONS
# ==========================================

@app.get("/items/{item_id}/recommendations")
def get_item_recommendations(
    item_id: int,
    db: Session = Depends(get_db)
):

    target_row = db.execute(
        text("""
            SELECT
                item_id,
                owner_id,
                category_id,
                title,
                description,
                item_condition,
                listing_type,
                price,
                city,
                status
            FROM items
            WHERE item_id = :item_id
        """),
        {"item_id": item_id}
    ).mappings().first()

    if target_row is None:

        raise HTTPException(
            status_code=404,
            detail="Item not found."
        )

    other_rows = db.execute(
        text("""
            SELECT
                item_id,
                owner_id,
                category_id,
                title,
                description,
                item_condition,
                listing_type,
                price,
                city,
                status
            FROM items
            WHERE status = 'Available'
              AND item_id != :item_id
        """),
        {"item_id": item_id}
    ).mappings().all()

    target = dict(target_row)

    candidates = [target] + [
        dict(row) for row in other_rows
    ]

    try:

        recommendations = recommend_similar_items(
            target,
            candidates,
            limit=4
        )

    except ValueError:

        recommendations = []

    return {
        "item_id": item_id,
        "recommendations": recommendations
    }


# ==========================================
# GET INDIVIDUAL ITEM DETAILS
# ==========================================

@app.get("/items/{item_id}")
def get_item(
    item_id: int,
    db: Session = Depends(get_db)
):

    query = text("""
        SELECT
            items.item_id,
            items.owner_id,
            items.category_id,
            items.title,
            items.description,
            items.item_condition,
            items.listing_type,
            items.price,
            items.city,
            items.status,
            items.image_url,

            items.contact_email,

            users.full_name AS owner_name,
            users.email AS owner_email

        FROM items

        LEFT JOIN users
            ON items.owner_id = users.user_id

        WHERE items.item_id = :item_id
    """)

    row = db.execute(
        query,
        {"item_id": item_id}
    ).mappings().first()

    if row is None:

        raise HTTPException(
            status_code=404,
            detail="Item not found."
        )

    return dict(row)


# ==========================================
# DATABASE MESSAGING SYSTEM
# ==========================================


# ==========================================
# SEND MESSAGE
# ==========================================

@app.post("/messages")
def send_message(
    data: dict = Body(...),
    db: Session = Depends(get_db)
):

    item_id = data.get("item_id")
    buyer_id = data.get("buyer_id")
    sender_id = data.get("sender_id")

    message_text = str(
        data.get("message_text", "")
    ).strip()

    if not all([
        item_id,
        buyer_id,
        sender_id,
        message_text
    ]):

        raise HTTPException(
            status_code=400,
            detail="All fields are required."
        )

    if len(message_text) > 5000:

        raise HTTPException(
            status_code=400,
            detail="Message is too long."
        )

    # Find the seller

    item = db.execute(
        text("""
            SELECT owner_id
            FROM items
            WHERE item_id = :item_id
        """),
        {"item_id": item_id}
    ).mappings().first()

    if not item:

        raise HTTPException(
            status_code=404,
            detail="Item not found."
        )

    seller_id = item["owner_id"]

    if buyer_id == seller_id:

        raise HTTPException(
            status_code=400,
            detail="Cannot message yourself."
        )

    # Check whether buyer exists

    buyer = db.execute(
        text("""
            SELECT user_id
            FROM users
            WHERE user_id = :buyer_id
        """),
        {"buyer_id": buyer_id}
    ).first()

    if not buyer:

        raise HTTPException(
            status_code=404,
            detail="Buyer not found."
        )

    # Only buyer and seller can participate

    if sender_id not in (buyer_id, seller_id):

        raise HTTPException(
            status_code=403,
            detail="Invalid sender."
        )

    try:

        db.execute(
            text("""
                INSERT INTO messages (
                    item_id,
                    buyer_id,
                    seller_id,
                    sender_id,
                    message_text
                )
                VALUES (
                    :item_id,
                    :buyer_id,
                    :seller_id,
                    :sender_id,
                    :message_text
                )
            """),
            {
                "item_id": item_id,
                "buyer_id": buyer_id,
                "seller_id": seller_id,
                "sender_id": sender_id,
                "message_text": message_text
            }
        )

        db.commit()

        return {
            "success": True,
            "message": "Message sent successfully."
        }

    except Exception as exc:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to save message."
        ) from exc


# ==========================================
# GET MESSAGES FOR A CONVERSATION
# ==========================================

@app.get("/messages/{item_id}")
def get_messages(
    item_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):

    rows = db.execute(
        text("""
            SELECT
                message_id,
                item_id,
                buyer_id,
                seller_id,
                sender_id,
                message_text,
                created_at
            FROM messages
            WHERE item_id = :item_id
              AND (
                  buyer_id = :user_id
                  OR seller_id = :user_id
              )
            ORDER BY created_at ASC, message_id ASC
        """),
        {
            "item_id": item_id,
            "user_id": user_id
        }
    ).mappings().all()

    return {
        "item_id": item_id,
        "messages": [
            dict(row) for row in rows
        ]
    }


# ==========================================
# GET USER CONVERSATIONS
# ==========================================

@app.get("/messages/conversations/{user_id}")
def get_user_conversations(
    user_id: int,
    db: Session = Depends(get_db)
):

    query = text("""
        SELECT
            i.item_id,
            i.title,
            i.image_url,
            i.city,

            m.buyer_id,
            m.seller_id,

            CASE
                WHEN m.buyer_id = :user_id
                THEN s.full_name
                ELSE b.full_name
            END AS other_user_name,

            CASE
                WHEN m.buyer_id = :user_id
                THEN s.email
                ELSE b.email
            END AS other_user_email,

            MAX(m.created_at) AS last_message_time

        FROM messages m

        JOIN items i
            ON i.item_id = m.item_id

        JOIN users b
            ON b.user_id = m.buyer_id

        JOIN users s
            ON s.user_id = m.seller_id

        WHERE
            m.buyer_id = :user_id
            OR m.seller_id = :user_id

        GROUP BY
            i.item_id,
            i.title,
            i.image_url,
            i.city,
            m.buyer_id,
            m.seller_id,
            b.full_name,
            b.email,
            s.full_name,
            s.email

        ORDER BY last_message_time DESC
    """)

    rows = db.execute(
        query,
        {"user_id": user_id}
    ).mappings().all()

    return [
        dict(row) for row in rows
    ]


# ==========================================
# UPLOAD ITEM PHOTO
# ==========================================

@app.post("/items/{item_id}/photo")
async def upload_item_photo(
    item_id: int,
    photo: UploadFile = File(...)
):

    if photo.content_type not in ALLOWED_IMAGE_TYPES:

        await photo.close()

        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, and WebP images are allowed."
        )

    image_data = await photo.read(
        MAX_IMAGE_SIZE + 1
    )

    await photo.close()

    if not image_data:

        raise HTTPException(
            status_code=400,
            detail="The uploaded image is empty."
        )

    if len(image_data) > MAX_IMAGE_SIZE:

        raise HTTPException(
            status_code=413,
            detail="Image size must not exceed 5 MB."
        )

    db = SessionLocal()

    saved_path = None

    try:

        exists = db.execute(
            text("""
                SELECT item_id
                FROM items
                WHERE item_id = :item_id
            """),
            {"item_id": item_id}
        ).first()

        if exists is None:

            raise HTTPException(
                status_code=404,
                detail="Item not found."
            )

        extension = ALLOWED_IMAGE_TYPES[
            photo.content_type
        ]

        filename = f"{uuid.uuid4().hex}{extension}"

        saved_path = UPLOAD_DIR / filename

        saved_path.write_bytes(image_data)

        image_url = f"/uploads/{filename}"

        db.execute(
            text("""
                UPDATE items
                SET image_url = :image_url
                WHERE item_id = :item_id
            """),
            {
                "image_url": image_url,
                "item_id": item_id
            }
        )

        db.commit()

        return {
            "message": "Photo uploaded successfully.",
            "item_id": item_id,
            "image_url": image_url
        }

    except HTTPException:

        db.rollback()

        if saved_path and saved_path.exists():
            saved_path.unlink()

        raise

    except Exception as exc:

        db.rollback()

        if saved_path and saved_path.exists():
            saved_path.unlink()

        raise HTTPException(
            status_code=500,
            detail="Could not save the item photo."
        ) from exc

    finally:

        db.close()


# ==========================================
# DELETE ITEM
# ==========================================

@app.delete("/items/{item_id}")
def delete_item(
    item_id: int,
    db: Session = Depends(get_db)
):

    try:

        result = db.execute(
            text("""
                DELETE FROM items
                WHERE item_id = :item_id
            """),
            {"item_id": item_id}
        )

        db.commit()

        if result.rowcount == 0:

            raise HTTPException(
                status_code=404,
                detail="Item not found."
            )

        return {
            "message": "Item deleted successfully.",
            "item_id": item_id
        }

    except HTTPException:

        raise

    except Exception as exc:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to delete item. Check related database records."
        ) from exc


# ==========================================
# SERVE FRONTEND AND UPLOADED IMAGES
# KEEP THESE MOUNTS LAST
# ==========================================

app.mount(
    "/css",
    StaticFiles(directory=str(FRONTEND_DIR / "css")),
    name="css"
)

app.mount(
    "/js",
    StaticFiles(directory=str(FRONTEND_DIR / "js")),
    name="js"
)

app.mount(
    "/pages",
    StaticFiles(directory=str(FRONTEND_DIR / "pages")),
    name="pages"
)

app.mount(
    "/uploads",
    StaticFiles(directory=str(UPLOAD_DIR)),
    name="uploads"
)

app.mount(
    "/",
    StaticFiles(
        directory=str(FRONTEND_DIR),
        html=True
    ),
    name="frontend"
)