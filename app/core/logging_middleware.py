import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.logging_config import logger

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = None
        try:
            response = await call_next(request)
            return response
        finally:
            process_time = (time.time() - start_time) * 1000
            logger.info({"method": request.method,
                         "path": request.url.path,
                         "status_code": response.status_code if response else "N/A",
                         "latency_ms": round(process_time, 2),
                         "client_ip": request.client.host if request.client else None})
