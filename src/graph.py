from typing import List
import math

import numpy as np
import networkx as nx


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
