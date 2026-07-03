import os
import sys

# Ensure the project root is importable so `backend` package resolves
# when this file runs as a Vercel Python serverless function.
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from fastapi import FastAPI

from backend.app import app as backend_app

# Vercel routes every request under /api/* to this function. We mount the
# existing FastAPI application at /api so its routes (/health, /generate-report,
# /generate-report/stream) are served at /api/health, /api/generate-report, etc.
app = FastAPI()
app.mount("/api", backend_app)
