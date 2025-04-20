import os
import pathlib
from typing import List, Optional

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel

from app.graph import (
    calc_vertex_positions,
    find_faces_in_graph,
    build_faces_matrix,
    calc_tait_0_in_detail,
    calc_tait_0_aggregated,
    calc_tait_0_dual_chromatic,
    faces_matrix_to_adjacency_matrix,
)


class PositionsRequest(BaseModel):
    adjacency_matrix: List[List[int]]


class FacesRequest(BaseModel):
    adjacency_matrix: List[List[int]]
    positions: List[List[float]]


class FacesMatrixRequest(BaseModel):
    faces: List[List[int]]


class CalcTait0Request(BaseModel):
    faces_matrix: List[List[List[int]]]
    detail: bool = True


class CalcTait0DualChromatic(BaseModel):
    faces_matrix: Optional[List[List[List[int]]]] = None
    dual_adjacency_matrix: Optional[List[List[List[int]]]] = None


BASE_DIR = pathlib.Path(os.path.abspath(__file__)).parent.parent

app = FastAPI()

app.mount("/static", StaticFiles(directory=BASE_DIR / "build/static"), name="static")

templates = Jinja2Templates(directory=BASE_DIR / "build/pages")


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


@app.post("/api/v1/find_faces_matrix")
async def find_faces_matrix(request: FacesMatrixRequest):
    faces_matrix = build_faces_matrix(request.faces)
    return {"status": "ok", "data": {"faces_matrix": faces_matrix}}


@app.post("/api/v1/calc_tait_0")
async def calc_tait_0(request: CalcTait0Request):
    faces_matrix = request.faces_matrix
    detail = request.detail
    if detail:
        tait_0, det_list, rank_list = calc_tait_0_in_detail(faces_matrix)
        return {
            "status": "ok",
            "data": {"tait_0": tait_0, "det_list": det_list, "rank_list": rank_list},
        }
    else:
        tait_0, rank_and_det_counts, n_even_ranks, n_odd_ranks, n_zero_ranks = (
            calc_tait_0_aggregated(faces_matrix)
        )
        return {
            "status": "ok",
            "data": {
                "tait_0": tait_0,
                "rank_and_det_counts": rank_and_det_counts,
                "n_even_ranks": n_even_ranks,
                "n_odd_ranks": n_odd_ranks,
                "n_zero_ranks": n_zero_ranks,
            },
        }


@app.post("/api/v1/calc_tait_0_dual_chromatic")
async def calc_tait_0_using_dual_chromatic(request: CalcTait0DualChromatic):
    faces_matrix = request.faces_matrix
    dual_adjacency_matrix = request.dual_adjacency_matrix
    if (faces_matrix is None) == (dual_adjacency_matrix is None):
        return {
            "status": "error",
            "data": {
                "message": "Exactly one of `faces_matrix` and `dual_adjacency_matrix` parameters must be non-empty"
            },
        }
    if dual_adjacency_matrix is None:
        dual_adjacency_matrix = faces_matrix_to_adjacency_matrix(faces_matrix)
        print(dual_adjacency_matrix)

    tait_0 = calc_tait_0_dual_chromatic(dual_adjacency_matrix)
    return {
        "status": "ok",
        "data": {"tait_0": tait_0},
    }
