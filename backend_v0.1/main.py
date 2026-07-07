
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import logging
import time
import os
import asyncio
import httpx
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from pages.register import router
from core.create_savings_group import group_router
from pages.home import home_router
from pages.my_group_saving import group_router as my_group_router
from api.webhook import router as webhook_router
from core.join_via_link import link_router
from core.group_endpoint import group_payment_router
from integrations.withdraw import router as withdrawals_router
from core.fallback_savings import router as fallback_router
from core.cron import register_background_tasks, start_background_tasks, stop_background_tasks
from pages.view_group import view_router



#  Initialize Python's built-in logging tool formatting style
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - [%(levelname)s] - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("KamaraLogger")


app = FastAPI(title="Monicare")
register_background_tasks(app)

KEEP_ALIVE_URL = os.environ.get("KEEP_ALIVE_URL", "https://monicare.onrender.com/health")
KEEP_ALIVE_INTERVAL_SECONDS = int(os.environ.get("KEEP_ALIVE_INTERVAL_SECONDS", 600))
ENABLE_KEEP_ALIVE = os.environ.get("ENABLE_KEEP_ALIVE", "true").lower() in ("1", "true", "yes")
AUTO_ACTIVATE_INTERVAL_SECONDS = int(os.environ.get("AUTO_ACTIVATE_INTERVAL_SECONDS", 300))
ENABLE_AUTO_ACTIVATION = os.environ.get("ENABLE_AUTO_ACTIVATION", "true").lower() in ("1", "true", "yes")
app.state.keepalive_task = None
app.state.auto_activate_task = None

app.include_router(router)
app.include_router(group_router)
app.include_router(home_router)
app.include_router(my_group_router)
app.include_router(webhook_router)
app.include_router(link_router)
app.include_router(group_payment_router)
app.include_router(withdrawals_router)
app.include_router(fallback_router)
app.include_router(view_router)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.on_event("startup")
async def on_startup() -> None:
    await start_background_tasks(app)


@app.on_event("shutdown")
async def on_shutdown() -> None:
    await stop_background_tasks(app)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    readable_errors = []

    for error in errors:
        location = error.get("loc", [])
        field = location[-1] if location else "field"
        error_type = error.get("type", "")
        message = error.get("msg", "Invalid value.")
        ctx = error.get("ctx") or {}

        if error_type == "string_too_long" and ctx.get("max_length"):
            message = f"{field} must be at most {ctx['max_length']} characters long."
        elif error_type == "string_too_short" and ctx.get("min_length"):
            message = f"{field} must be at least {ctx['min_length']} characters long."
        elif error_type == "value_error":
            message = message.replace("Value error, ", "")

        safe_ctx = {}
        for key, value in ctx.items():
            safe_ctx[key] = str(value) if isinstance(value, Exception) else value

        readable_errors.append({
            "field": field,
            "message": message,
            "type": error_type,
            "ctx": safe_ctx or None,
        })

    friendly_message = "Please fix the highlighted form fields and try again."
    if readable_errors:
        friendly_message = " ".join(item["message"] for item in readable_errors)

    logger.warning(
        "Request validation failed for %s %s: %s",
        request.method,
        request.url.path,
        errors,
    )
    return JSONResponse(
        status_code=422,
        content={
            "message": friendly_message,
            "errors": readable_errors,
            "detail": [
                {
                    "loc": list(error.get("loc", [])),
                    "msg": error.get("msg", "Invalid value."),
                    "type": error.get("type", "value_error"),
                    "ctx": {key: (str(value) if isinstance(value, Exception) else value) for key, value in (error.get("ctx") or {}).items()} or None,
                }
                for error in errors
            ],
        },
    )

# ping to keep my server alive

@app.middleware("http")
async def log_incoming_requests(request: Request, call_next):
    # This block executes the moment React flings a packet over the network
    start_time = time.time()
    
    logger.info(f"🚀 INCOMING REQUEST: {request.method} -> {request.url.path}")
    
    # Process the request and proceed to your routes
    response = await call_next(request)
    
    # This block executes right before sending data back to React
    process_time = (time.time() - start_time) * 1000
    logger.info(f"✅ COMPLETED REQUEST: {request.method} -> {request.url.path} | Status: {response.status_code} | Time: {process_time:.2f}ms\n")
    
    return response

@app.get("/")
@app.get("/health")
@app.get("/health-check")
@app.get("/api/v1/health-check")
async def health_check():
    """ A completely open public GET endpoint that returns a test dictionary """
    return {
        "status": "online",
        "message": "FastAPI is working perfectly!",
        "server_status": "healthy"
    }




if __name__ == "__main__":


    # 1. Fall back to 8001 locally, but let Cloud Run or Render inject the proper port
    port = int(os.environ.get("PORT", 8001))
    
    # 2. Check for Google Cloud Run (K_SERVICE) or Render (RENDER) production tokens
    is_cloud_run = os.environ.get("K_SERVICE") is not None
    is_render = os.environ.get("RENDER") is not None
    
    # 3. Disable reload if the app detects either production environment
    if is_cloud_run or is_render:
        reload_setting = False
    else:
        reload_setting = True

    print(f"Booting server on port {port} | Production Mode: {is_cloud_run or is_render}")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=reload_setting)
