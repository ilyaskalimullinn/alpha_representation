import os
import pathlib

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates


BASE_DIR = pathlib.Path(os.path.abspath(__file__)).parent.parent

app = FastAPI()

app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")

templates = Jinja2Templates(directory="templates")


# Static HTML page endpoint
@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


# REST API endpoint
@app.post("/api/v1/health")
async def health_check():
    return {"status": "ok"}


# You can run this with: uvicorn main:app --reload
