import logging
import sys

logging.basicConfig(level = logging.INFO,
                    format = "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
                    handlers = [logging.FileHandler("app_logs.log"), logging.StreamHandler(sys.stdout)])

logger = logging.getLogger("blog_api")
logger.setLevel(logging.INFO)
logging.getLogger("passlib.handlers.bcrypt").setLevel(logging.ERROR)