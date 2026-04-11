from sqlalchemy.orm import declarative_base

Base = declarative_base()

# Import model modules so SQLAlchemy metadata is populated before create_all.
from app.models import crisis, marketplace, user  # noqa: F401,E402
