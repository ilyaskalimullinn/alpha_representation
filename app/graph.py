from typing import List, Tuple
import math
import itertools
import fractions

import numpy as np
import networkx as nx
import sympy


i_div_sqrt_3 = sympy.I / sympy.sqrt(3)


def calc_vertex_positions(adjacency_matrix: List[List[int]]) -> List[List[float]]:
    """
    Calculate positions of vertices in a planar layout

    Args:
        adjacency_matrix (List[List[int]]): adjacency matrix of a graph

    Raises:
        ValueError: if graph is not planar

    Returns:
        List[List[float]]: list of pairs of [x, y] - positions of vertices
    """
    graph = nx.from_numpy_array(np.array(adjacency_matrix))
    pos = nx.planar_layout(graph)
    pos_list = [None for _ in range(len(adjacency_matrix))]
    try:
        pos = nx.planar_layout(graph)
        pos_list = [None for _ in range(len(adjacency_matrix))]
        for ind, (x, y) in pos.items():
            pos_list[ind] = [x, y]
        return pos_list
    except nx.NetworkXException:
        raise ValueError("Graph is not planar")


def find_faces_in_graph(
    adjacency_matrix: List[List[int]], vertex_positions: List[List[float]]
) -> List[List[int]]:
    """
    Find all faces in a planar graph

    Args:
        adjacency_matrix (List[List[int]]): adjacency matrix
        vertex_positions (List[List[float]]): positions of vertices

    Returns:
        List[List[int]]: list of faces, each face is a list of vertices,
            first and last vertex are the same
    """
    faces = []
    n = len(adjacency_matrix)
    for i in range(n):
        for j in range(n):
            if adjacency_matrix[i][j] == 0:
                continue
            face = [i, j]
            while face[-1] != face[0]:
                adjacency_matrix[face[-2]][face[-1]] = 0
                neighbors_counterclockwise = find_neighbors(
                    adjacency_matrix, vertex_positions, face[-2], face[-1]
                )
                next_neighbor_index = neighbors_counterclockwise[0]
                face.append(next_neighbor_index)
            adjacency_matrix[face[-2]][face[-1]] = 0
            faces.append(face)
    return faces


def find_neighbors(
    adjacency_matrix: List[List[int]],
    vertex_positions: List[List[float]],
    i: int,
    j: int,
) -> List[int]:
    """
    Find all neighbors of a vertex j (except for vertex i) when you come to it
        from vertex i, sorted counter-clockwise

    Args:
        adjacency_matrix (List[List[int]]): adjacency matrix
        vertex_positions (List[List[int]]): list of positions of every vertex
        i (int): starting vertex index
        j (int): current vertex index

    Returns:
        List[int]: list of neighbors of vertex j, except for vertex i, that
            will be sorted counter-clockwise
    """
    all_neighbors = np.nonzero(adjacency_matrix[j])[0]
    all_neighbors = all_neighbors[all_neighbors != i]
    rotations = [
        calc_rotation(vertex_positions[i], vertex_positions[j], vertex_positions[v])
        for v in all_neighbors
    ]
    argsorted = np.argsort(rotations)
    all_neighbors = all_neighbors[argsorted].tolist()
    return all_neighbors


def calc_angle(vec1: List[float], vec2: List[float]) -> float:
    """
    Calculate angle between vec1 and vec2 counter-clockwise starting from vec1

    Args:
        vec1 (List[float]): main vector
        vec2 (List[float]): other vector

    Returns:
        float: angle from 0 to 2 pi
    """
    vec1 = vec1 / np.linalg.norm(vec1)
    vec2 = vec2 / np.linalg.norm(vec2)
    sin = vec1[0] * vec2[1] - vec1[1] * vec2[0]
    cos = vec1[0] * vec2[0] + vec1[1] * vec2[1]
    angle = math.atan2(sin, cos)
    if angle < 0:
        angle += 2 * math.pi
    return angle


def calc_rotation(pos0: List[float], pos1: List[float], pos2: List[float]) -> float:
    """
    Calc rotation (angle between pos0-pos1 vector and pos2-pos1 vector)

    Args:
        pos0 (List[float]): starting point
        pos1 (List[float]): middle point
        pos2 (List[float]): next point

    Returns:
        float: angle from 0 to 2 pi
    """
    main_vector = [pos0[0] - pos1[0], pos0[1] - pos1[1]]
    new_vector = [pos2[0] - pos1[0], pos2[1] - pos1[1]]
    return calc_angle(main_vector, new_vector)


def build_faces_matrix(faces: List[List[int]]) -> List[List[List[int]]]:
    n_faces = len(faces)
    matrix = [[None for _ in range(n_faces)] for _ in range(n_faces)]
    for i, face in enumerate(faces):
        matrix[i][i] = sorted(list(set(face)))
    for i in range(n_faces):
        for j in range(i + 1, n_faces):
            v = set(faces[i]).intersection(faces[j])
            v = sorted(list(v))
            matrix[i][j] = v
            matrix[j][i] = v
    return matrix


def largest_nonzero_principal_minor(matrix: np.ndarray) -> Tuple[int, int]:
    n = matrix.shape[0]

    # Определитель матрицы граней всегда равен нулю, уменьшаем размер матрицы
    for rank in range(n - 1, 0, -1):
        # Генерируем все возможные комбинации строк и столбцов для минора размера rank
        for rows in itertools.combinations(range(n), rank):
            # Создаем минор
            minor = matrix[np.ix_(rows, rows)]
            # minor = matrix[rows, rows]
            # Проверяем определитель минора
            det_minor = int(round(np.linalg.det(minor))) % 3
            if det_minor != 0:
                if det_minor == 2:
                    det_minor = -1
                return det_minor, rank
    return 0, 0


def gaussian_sum(matrix: np.ndarray) -> Tuple[sympy.Basic, int, int]:
    det_minor, rank = largest_nonzero_principal_minor(matrix)
    if rank == 0:
        return 1, det_minor, rank
    return det_minor * (i_div_sqrt_3**rank), det_minor, rank


def calc_tait_0_in_detail(
    faces_matrix: List[List[List[int]]],
) -> Tuple[int, List[int], List[int]]:
    n_faces = len(faces_matrix)  # n + 2
    n_vertices = 2 * (n_faces - 2)  # 2n
    # masks = [ for v in range(n_vertices)]
    masks = np.zeros((n_vertices, n_faces, n_faces))
    for v in range(n_vertices):
        for f1 in range(n_faces):
            for f2 in range(f1, n_faces):
                if v in faces_matrix[f1][f2]:
                    masks[v][f1][f2] = 1
                    masks[v][f2][f1] = 1
    all_sigma = itertools.product([-1, 1], repeat=n_vertices)

    n_tait_0 = 0
    det_minor_list = []
    rank_list = []

    for sigma in all_sigma:
        sigma = np.array(sigma).reshape(-1, 1, 1)
        faces_matrix_filled = np.sum(masks * sigma, axis=0)
        gauss, det_minor, rank = gaussian_sum(faces_matrix_filled)
        n_tait_0 += gauss
        det_minor_list.append(det_minor)
        rank_list.append(rank)

    n_tait_0 = sympy.nsimplify(n_tait_0)

    assert isinstance(
        n_tait_0, sympy.core.numbers.Integer
    ), "Calculated sum of Tait colorings is not integer"

    return int(n_tait_0), det_minor_list, rank_list


def calc_tait_0_aggregated(
    faces_matrix: List[List[List[int]]],
) -> Tuple[int, List[int], List[int]]:
    n_faces = len(faces_matrix)  # n + 2
    n_vertices = 2 * (n_faces - 2)  # 2n
    # masks = [ for v in range(n_vertices)]
    masks = np.zeros((n_vertices, n_faces, n_faces))
    for v in range(n_vertices):
        for f1 in range(n_faces):
            for f2 in range(f1, n_faces):
                if v in faces_matrix[f1][f2]:
                    masks[v][f1][f2] = 1
                    masks[v][f2][f1] = 1
    all_sigma = itertools.product([-1, 1], repeat=n_vertices)

    n_tait_0 = 0

    n_zero_ranks = 0
    n_even_ranks = 0
    n_odd_ranks = 0

    rank_and_det_counts = {}

    for sigma in all_sigma:
        sigma = np.array(sigma).reshape(-1, 1, 1)
        faces_matrix_filled = np.sum(masks * sigma, axis=0)
        det_minor, rank = largest_nonzero_principal_minor(faces_matrix_filled)

        if rank == 0:
            n_tait_0 += 1
            n_zero_ranks += 1
            continue

        if rank % 2 == 1:
            n_odd_ranks += 1
        else:
            # rank is even, non-zero
            n_even_ranks += 1
            n_tait_0 += det_minor * (fractions.Fraction(-1, 3) ** (rank // 2))

        rank_det_str = f"{rank},{det_minor}"
        if rank_det_str in rank_and_det_counts:
            rank_and_det_counts[rank_det_str] += 1
        else:
            rank_and_det_counts[rank_det_str] = 1

    assert (
        n_tait_0.numerator % n_tait_0.denominator == 0
    ), "Calculated sum of Tait colorings is not integer"
    n_tait_0 = int(n_tait_0)

    return n_tait_0, rank_and_det_counts, n_even_ranks, n_odd_ranks, n_zero_ranks


def calc_tait_0_dual_chromatic(faces_adjacency_matrix: List[List[int]]) -> int:
    dual_graph = nx.from_numpy_array(np.array(faces_adjacency_matrix))
    chromatic_polynomial = nx.chromatic_polynomial(dual_graph)
    print(chromatic_polynomial)
    val = int(chromatic_polynomial.subs({"x": 4}))
    return val // 12


def faces_matrix_to_adjacency_matrix(
    faces_matrix: List[List[List[int]]],
) -> List[List[int]]:
    n = len(faces_matrix)
    adjacency_matrix = [
        [1 if len(faces_matrix[i][j]) > 0 else 0 for j in range(n)] for i in range(n)
    ]
    for i in range(n):
        adjacency_matrix[i][i] = 0
    return adjacency_matrix
