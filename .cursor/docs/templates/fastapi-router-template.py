from typing import List

# Import database dependency
from app.core.database import get_db  # Or get_async_db

# Import CRUD operations
from app.crud import my_resource as crud_my_resource

# Import schemas (Pydantic models)
from app.models import schemas
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session  # Or async session

# Import services if business logic is complex
# from app.services import my_resource_service

# Create router instance
router = APIRouter(
    prefix="/my-resource",  # URL prefix for this router
    tags=["My Resource"],  # Tag for OpenAPI documentation
    # dependencies=[Depends(get_token_header)], # Example: Add dependencies for auth
    responses={404: {"description": "Not found"}},  # Default responses
)


@router.post(
    "/",
    response_model=schemas.MyResourceResponse,  # Pydantic model for response
    status_code=status.HTTP_201_CREATED,
    summary="Create a new resource",
    description="Endpoint to create a new instance of MyResource.",
)
async def create_my_resource(
    resource_in: schemas.MyResourceCreate,  # Pydantic model for request body
    db: Session = Depends(get_db),  # Inject database session
):
    """
    Create a new MyResource item.
    - **resource_in**: Data for the new resource.
    """
    # Optional: Check for existing resource if needed
    # existing = crud_my_resource.get_my_resource_by_name(db, name=resource_in.name)
    # if existing:
    #     raise HTTPException(
    #         status_code=status.HTTP_400_BAD_REQUEST,
    #         detail="Resource with this name already exists",
    #     )

    # Call CRUD function to create the resource in the database
    created_resource = crud_my_resource.create_my_resource(
        db=db, resource_in=resource_in
    )
    if not created_resource:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create resource",
        )
    return created_resource


@router.get(
    "/",
    response_model=List[schemas.MyResourceResponse],  # List of response models
    summary="List resources",
    description="Retrieve a list of MyResource items with pagination.",
)
async def list_my_resources(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """
    Retrieve MyResource items.
    - **skip**: Number of items to skip.
    - **limit**: Maximum number of items to return.
    """
    resources = crud_my_resource.get_my_resources(db, skip=skip, limit=limit)
    return resources


@router.get(
    "/{resource_id}",
    response_model=schemas.MyResourceResponse,
    summary="Get a specific resource",
)
async def get_my_resource(
    resource_id: int,  # Or str if using UUIDs
    db: Session = Depends(get_db),
):
    """
    Get details of a specific MyResource by its ID.
    """
    db_resource = crud_my_resource.get_my_resource(db, resource_id=resource_id)
    if db_resource is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )
    return db_resource


# Add PUT, DELETE endpoints as needed...
