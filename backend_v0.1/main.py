
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import logging
import time
import os
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from pages.register import router




#  Initialize Python's built-in logging tool formatting style
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - [%(levelname)s] - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("KamaraLogger")


app = FastAPI(title="Monicare")

app.include_router(router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    readable_errors = []

    for error in errors:
        location = error.get("loc", [])
        field = location[-1] if location else "field"
        error_type = error.get("type", "")
        message = error.get("msg", "Invalid value.")

        if error_type == "string_too_long" and error.get("ctx", {}).get("max_length"):
            message = f"{field} must be at most {error['ctx']['max_length']} characters long."
        elif error_type == "string_too_short" and error.get("ctx", {}).get("min_length"):
            message = f"{field} must be at least {error['ctx']['min_length']} characters long."
        elif error_type == "value_error":
            message = message.replace("Value error, ", "")

        readable_errors.append({
            "field": field,
            "message": message,
            "type": error_type,
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
            "detail": errors,
        },
    )


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



