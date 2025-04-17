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


class PositionsRequest(BaseModel):
    adjacency_matrix: List[List[int]]


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
    adjacency_matrix = request.adjacency_matrix
    print(adjacency_matrix)
    graph = nx.from_numpy_array(np.array(adjacency_matrix))
    try:
        pos = nx.planar_layout(graph)
        pos_list = [None for _ in range(len(adjacency_matrix))]
        for ind, (x, y) in pos.items():
            pos_list[ind] = [x, y]
        return {"status": "ok", "data": {"positions": pos_list}}
    except:
        return {"status": "error", "data": {"message": "Graph is not planar"}}


# You can run this with: uvicorn main:app --reload
