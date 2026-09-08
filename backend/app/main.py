"""
GeoInsight Backend — FastAPI Application
Geospatial Intelligence for Kamrup, Assam
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import environment, layers

app = FastAPI(
    title="GeoInsight API",
    description="Geospatial Intelligence API for environmental analysis of Kamrup, Assam",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(environment.router, prefix="/api/v1", tags=["Environment"])
app.include_router(layers.router, prefix="/api/v1", tags=["Layers"])


@app.get("/", tags=["Health"])
async def root():
    return {
        "service": "GeoInsight API",
        "version": "1.0.0",
        "status": "operational",
        "description": "Geospatial Intelligence for Kamrup, Assam",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}
