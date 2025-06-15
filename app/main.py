import os
import pathlib
from typing import List, Optional, Dict

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi import status
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

from app.graph import (
    calc_vertex_positions,
    find_faces_in_graph,
    build_faces_matrix,
    calc_tait_0_in_detail,
    calc_tait_0_aggregated,
    calc_tait_0_dual_chromatic,
    calc_tait_0_fixed_in_detail,
    faces_matrix_to_dual_adjacency_matrix,
    calc_s_values,
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


class CalcTait0FixedRequest(BaseModel):
    faces_matrix: List[List[List[int]]]
    fixed_spins: Optional[Dict[int, int]]


class CalcTait0DualChromatic(BaseModel):
    faces_matrix: Optional[List[List[List[int]]]] = None
    dual_adjacency_matrix: Optional[List[List[List[int]]]] = None


class FindSValuesRequest(BaseModel):
    faces_matrix: List[List[List[int]]]
    vertices_in: List[int]
    vertices_mid: List[int]


BASE_DIR = pathlib.Path(os.path.abspath(__file__)).parent.parent

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=BASE_DIR / "build/static"), name="static")

templates = Jinja2Templates(directory=BASE_DIR / "build/pages")


# Static HTML page endpoint
@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


# Static HTML page endpoint
@app.get("/s_values", response_class=HTMLResponse)
async def s_values(request: Request):
    return templates.TemplateResponse("s_values.html", {"request": request})


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
        return JSONResponse(
            content={"status": "error", "data": {"message": "Graph is not planar"}},
            status_code=status.HTTP_400_BAD_REQUEST,
        )


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
        tait_0, gauss_sum_list, det_list, rank_list = calc_tait_0_in_detail(
            faces_matrix
        )
        gauss_sum_list = [str(val) for val in gauss_sum_list]
        return {
            "status": "ok",
            "data": {
                "tait_0": tait_0,
                "gauss_sum_list": gauss_sum_list,
                "det_list": det_list,
                "rank_list": rank_list,
            },
        }
    else:
        (
            n_tait_0,
            n_even_ranks,
            n_odd_ranks,
            n_zero_ranks,
            det_minors,
            rank_list,
            gauss_sums,
            nums,
            total_gauss_sums,
        ) = calc_tait_0_aggregated(faces_matrix)
        gauss_sums = [str(val) for val in gauss_sums]
        total_gauss_sums = [str(val) for val in total_gauss_sums]
        return {
            "status": "ok",
            "data": {
                "tait_0": n_tait_0,
                "n_even_ranks": n_even_ranks,
                "n_odd_ranks": n_odd_ranks,
                "n_zero_ranks": n_zero_ranks,
                "det_list": det_minors,
                "rank_list": rank_list,
                "gauss_sum_list": gauss_sums,
                "num_list": nums,
                "total_gauss_sum_list": total_gauss_sums,
            },
        }


@app.post("/api/v1/calc_tait_0_fixed")
async def calc_tait_0_fixed(request: CalcTait0FixedRequest):
    faces_matrix = request.faces_matrix
    fixed_spins = request.fixed_spins

    is_consistent, calculation_details = calc_tait_0_fixed_in_detail(
        faces_matrix, fixed_spins
    )
    if not is_consistent:
        sigma, augmented_matrix, base_rank, augmented_matrix_rank = calculation_details
        return JSONResponse(
            content={
                "status": "error",
                "data": {
                    "message": "System is inconsistent",
                    "sigma": sigma,
                    "augmented_matrix": augmented_matrix,
                    "base_rank": base_rank,
                    "augmented_matrix_rank": augmented_matrix_rank,
                },
            },
            status_code=status.HTTP_412_PRECONDITION_FAILED,
        )
    (
        tait_0,
        det_minor_list,
        rank_list,
        gauss_sum_list,
        bordered_det_list,
        chi_list,
        term_list,
    ) = calculation_details

    gauss_sum_list = [str(v) for v in gauss_sum_list]
    chi_list = [str(v) for v in chi_list]
    term_list = [str(v) for v in term_list]
    return {
        "status": "ok",
        "data": {
            "tait_0": tait_0,
            "det_list": det_minor_list,
            "rank_list": rank_list,
            "gauss_sum_list": gauss_sum_list,
            "bordered_det_list": bordered_det_list,
            "chi_list": chi_list,
            "term_list": term_list,
        },
    }


@app.post("/api/v1/calc_tait_0_dual_chromatic")
async def calc_tait_0_using_dual_chromatic(request: CalcTait0DualChromatic):
    faces_matrix = request.faces_matrix
    dual_adjacency_matrix = request.dual_adjacency_matrix
    if (faces_matrix is None) == (dual_adjacency_matrix is None):
        return JSONResponse(
            content={
                "status": "error",
                "data": {
                    "message": "Exactly one of `faces_matrix` and `dual_adjacency_matrix` parameters must be non-empty"
                },
            },
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    if dual_adjacency_matrix is None:
        dual_adjacency_matrix = faces_matrix_to_dual_adjacency_matrix(faces_matrix)
        print(dual_adjacency_matrix)

    tait_0 = calc_tait_0_dual_chromatic(dual_adjacency_matrix)
    return {
        "status": "ok",
        "data": {"tait_0": tait_0},
    }


@app.post("/api/v1/calc_s_values")
async def find_s_values(request: FindSValuesRequest):
    results = calc_s_values(
        request.faces_matrix,
        vertices_in=request.vertices_in,
        vertices_mid=request.vertices_mid,
    )
    results = [str(v) for v in results]
    return {
        "status": "ok",
        "data": {"s": results},
    }
