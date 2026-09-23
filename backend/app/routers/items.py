from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.models.item import Item
from app.schemas.item import ItemCreate, ItemRead, ItemUpdate


router = APIRouter(prefix="/items", tags=["items"])


def find_item_or_404(db: Session, item_id: UUID, user_id: UUID) -> Item:
    item = db.scalar(
        select(Item).where(Item.id == item_id, Item.user_id == user_id)
    )
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.post("", response_model=ItemRead, status_code=status.HTTP_201_CREATED)
def create_item(payload: ItemCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> Item:
    item = Item(user_id=user.id, **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("", response_model=list[ItemRead])
def list_items(
    category: str | None = None,
    search: str | None = None,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Item]:
    query = select(Item).where(Item.user_id == user.id)

    if category:
        query = query.where(Item.category == category)
    if search:
        query = query.where(Item.name.ilike(f"%{search}%"))

    return list(
        db.scalars(query.order_by(Item.created_at.desc()).offset(offset).limit(limit))
    )


@router.get("/{item_id}", response_model=ItemRead)
def get_item(item_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> Item:
    return find_item_or_404(db, item_id, user.id)


@router.patch("/{item_id}", response_model=ItemRead)
def update_item(
    item_id: UUID, payload: ItemUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> Item:
    item = find_item_or_404(db, item_id, user.id)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> Response:
    item = find_item_or_404(db, item_id, user.id)
    db.delete(item)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
