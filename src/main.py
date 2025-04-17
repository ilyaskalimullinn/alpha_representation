import os
import pathlib
from typing import List

import numpy as np
import networkx as nx
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel

from src.graph import calc_vertex_positions, find_faces_in_graph


class PositionsRequest(BaseModel):
    adjacency_matrix: List[List[int]]


class FacesRequest(BaseModel):
    adjacency_matrix: List[List[int]]
    positions: List[List[float]]


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


@app.post("/api/v1/positions")
async def calc_positions(request: PositionsRequest):
    """
    Find positions of vertices of a planar graph. If not planar,
    returns status: "error"
    """
    try:
        pos_list = calc_vertex_positions(request.adjacency_matrix)
        return {"status": "ok", "data": {"positions": pos_list}}
    except ValueError:
        return {"status": "error", "data": {"message": "Graph is not planar"}}


@app.post("/api/v1/find_faces")
async def find_faces(request: FacesRequest):
    adjacency_matrix = request.adjacency_matrix
    positions = request.positions
    faces = find_faces_in_graph(adjacency_matrix, positions)
    return {"status": "ok", "data": {"faces": faces}}
    # faces = find_faces
