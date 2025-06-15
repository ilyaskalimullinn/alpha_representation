from typing import List, Tuple, Dict, Any
import math
import itertools

import numpy as np
import networkx as nx
import sympy


i_div_sqrt_3 = sympy.I / sympy.sqrt(3)
two_pi_i_3 = 2 * sympy.pi * sympy.I / 3
F3 = sympy.GF(3)


def calc_chi(x: int | Any) -> Any:
    """
    Calculate function $\\chi(x) \\equiv \\exp(2\\pi i x/3)$, i.e. a non-trivial
    homomorphism from $\\mathbb{F}_3$ into the unit circle.

    Args:
        x (int | Any): value from $\\mathbb{F}_3$, i.e. either -1, 0 or 1.

    Returns:
        Any: sympy exponent value
    """
    return sympy.exp(two_pi_i_3 * x)


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
    """
    Build FacesMatrix from list of faces of a planar cubic graph.

    Example:
    ```
    faces = [
        [0, 1, 2],
        [0, 1, 3],
        [1, 2, 3],
        [0, 2, 3]
    ]
    ```
    These are all faces of graph $K_4$ with vertices 0,1,2,3
    ```
    faces_matrix = [
        [[0,1,2], [0,1], [1,2], [0,2]],
        [[0,1], [0,1,3], [1,3], [0,3]],
        [[1,2], [1,3], [1,2,3], [2,3]],
        [[0,2], [0,3], [2,3], [0,2,3]]
    ]
    ```

    Args:
        faces (List[List[int]]): a list of faces, each face is a list of
            vertices in that face

    Returns:
        List[List[List[int]]]: Faces Matrix `fm`, where `fm[i][j]` is
            a list of all vertices that are present both in face `i` and face `j`
    """
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


def largest_nonzero_principal_minor(matrix: np.ndarray) -> Tuple[int, int, List[int]]:
    """
    Find largest non-zero principal minor of a matrix $n \times n$
    over the field $\\mathbb{F}_3$.

    Example:
    ```
    matrix = np.array([
        [-1, 1, 0, 0],
        [1, -1, 0, 0],
        [0, 0, 1, -1],
        [0, 0, -1, 1]
    ])
    ```
    There are two largest non-zero principal minors (submatrices with indices [0, 3] or [1, 2]),
    both have value -1 (for Faces Matrix all largest non-zero principal minors have the same value).

    **Warning**: if a matrix has rank 0, the value of a minor is considered 1.

    Args:
        matrix (np.ndarray): matrix of values over $\\mathbb{F}_3$, i.e. -1, 0 or 1

    Returns:
        Tuple[int, int, List[int]]: value of the minor, rank of the submatrix (minor) and
            list of indices that form this submatrix (minor)
    """
    n = matrix.shape[0]

    # If matrix is non-singular, return whole matrix
    det_minor = int(round(np.linalg.det(matrix))) % 3
    if det_minor != 0:
        if det_minor == 2:
            det_minor = -1
        return det_minor, n, list(range(n))

    # If matrix is singular, find the set of rows that form non-zero minor
    for rank in range(n - 1, 0, -1):
        # Generate combination of indices of a size `rank``
        for rows in itertools.combinations(range(n), rank):

            minor = matrix[np.ix_(rows, rows)]

            det_minor = int(round(np.linalg.det(minor))) % 3
            if det_minor != 0:
                if det_minor == 2:
                    det_minor = -1
                return det_minor, rank, list(rows)
    # If matrix only has values '0', we consider its minor = 1, but rank is still 0
    return 1, 0, []


def gaussian_sum(matrix: np.ndarray) -> Tuple[sympy.Basic, int, int, List[int]]:
    """
    Calc normalized gaussian sum of a matrix $n \\times n$ over the field $\\mathbb{F}_3$:
    $$
    \\Gau'(M) = \\frac{1}{3^n} \\sum_{k \\in \\mathbb{F}_3^n} \\chi\\left( k^T M k \\right)
    $$
    It can also be calculated by the following formula:
    $$
    \\Gau'(M) = {\\det}'M \\left[ \\frac{i}{\\sqrt 3} \\right]^{\\rank M},
    $$
    where ${\\det}'M$ is the largest nonzero principal minor of a matrix M
    (if it only has values 0, this value is considered = 1), $\\rank M$ is the rank of matrix M

    Args:
        matrix (np.ndarray): $n \\times n$ over the field $\\mathbb{F}_3$

    Returns:
        Tuple[sympy.Basic, int, int, List[int]]:
            1) Gaussian sum value
            2) Largest nonzero principal minor
            3) Rank of M
            4) List of indices that form largest nonzero principal minor
    """
    det_minor, rank, rows = largest_nonzero_principal_minor(matrix)
    if rank == 0:
        return 1, det_minor, rank
    return det_minor * (i_div_sqrt_3**rank), det_minor, rank, rows


def calc_rank_f3(matrix: np.ndarray) -> int:
    m = [[F3(elem) for elem in row] for row in matrix]
    m = sympy.polys.matrices.DomainMatrix(m, matrix.shape, F3)
    return m.rank()


def calc_tait_0_in_detail(
    faces_matrix: List[List[List[int]]],
) -> Tuple[int, List[int], List[int], List[int]]:
    """
    Given Faces Matrix of a planar cubic graph $G$, calculate number of Tait colorings
    using $\\alpha$-representation.

    Args:
        faces_matrix (List[List[List[int]]]): Faces Matrix `fm`, where `fm[i][j]` is
            a list of all vertices that are present both in face `i` and face `j`.
            Note that vertex indices should be from 0 to 2n-1, where Faces Matrix
            has size $(n+2) \times (n+2)$.

    Returns:
        Tuple[int, List[int], List[int], List[int]]:
            1) Number of Tait colorings
            2) List of largest nonzero principal minors of Faces Matrix
                for every vector of spins
            3) List of ranks of Faces Matrix for every vector of spins
            4) List of gaussian sums
    """
    n_faces = len(faces_matrix)  # n + 2
    n_vertices = 2 * (n_faces - 2)  # 2n

    masks_tensor = np.zeros((n_vertices, n_faces, n_faces))
    for v in range(n_vertices):
        for f1 in range(n_faces):
            for f2 in range(f1, n_faces):
                if v in faces_matrix[f1][f2]:
                    masks_tensor[v][f1][f2] = 1
                    masks_tensor[v][f2][f1] = 1
    all_sigma = itertools.product([-1, 1], repeat=n_vertices)

    det_minor_list = []
    rank_list = []
    gauss_list = []

    for sigma in all_sigma:
        sigma = np.array(sigma).reshape(-1, 1, 1)
        faces_matrix_filled = np.sum(masks_tensor * sigma, axis=0)
        gauss, det_minor, rank, _ = gaussian_sum(faces_matrix_filled)
        gauss_list.append(gauss)
        det_minor_list.append(det_minor)
        rank_list.append(rank)

    n_tait_0 = sympy.nsimplify(sum(gauss_list))

    assert isinstance(
        n_tait_0, sympy.core.numbers.Integer
    ), "Calculated sum of Tait colorings is not integer"

    return int(n_tait_0), gauss_list, det_minor_list, rank_list


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

    data = {}  # dict keys are tuples: (det_minor, rank, gauss_sum)

    for sigma in all_sigma:
        sigma = np.array(sigma).reshape(-1, 1, 1)
        faces_matrix_filled = np.sum(masks * sigma, axis=0)
        gauss_sum, det_minor, rank, _ = gaussian_sum(faces_matrix_filled)

        ind = (det_minor, rank, gauss_sum)
        if ind not in data:
            # add this entry if it is not yet present
            data[ind] = 0

        # add this count
        data[ind] += 1

        n_tait_0 += gauss_sum

        if rank == 0:
            n_zero_ranks += 1
        elif rank % 2 == 1:
            n_odd_ranks += 1
        else:
            # rank is even, non-zero
            n_even_ranks += 1

    n_tait_0 = sympy.nsimplify(n_tait_0)
    assert isinstance(
        n_tait_0, sympy.core.numbers.Integer
    ), "Calculated sum of Tait colorings is not integer"

    data_rows = [
        [det_minor, rank, gauss_sum, num, gauss_sum * num]
        for (det_minor, rank, gauss_sum), num in data.items()
    ]

    det_minors, ranks, gauss_sums, nums, total_gauss_sums = zip(*data_rows)

    n_tait_0 = int(n_tait_0)

    return (
        n_tait_0,
        n_even_ranks,
        n_odd_ranks,
        n_zero_ranks,
        det_minors,
        ranks,
        gauss_sums,
        nums,
        total_gauss_sums,
    )


def calc_tait_0_dual_chromatic(faces_adjacency_matrix: List[List[int]]) -> int:
    dual_graph = nx.from_numpy_array(np.array(faces_adjacency_matrix))
    chromatic_polynomial = nx.chromatic_polynomial(dual_graph)
    val = int(chromatic_polynomial.subs({"x": 4}))
    return val // 12


def calc_tait_0_fixed_in_detail(
    faces_matrix: List[List[List[int]]],
    fixed_values: Dict[int, int],
) -> Tuple[bool, Tuple[int, List[int], List[int]] | List[int]]:
    n_faces = len(faces_matrix)  # n + 2
    n_vertices = 2 * (n_faces - 2)  # 2n

    l = [
        sum(fixed_values.get(v, 0) for v in faces_matrix[i][i]) % 3
        for i in range(n_faces)
    ]
    l = np.array(l)

    fixed_vertices = np.array(list(fixed_values.keys()))
    free_vertices = np.array([v for v in range(n_vertices) if v not in fixed_vertices])

    fixed_vertices.sort()
    free_vertices.sort()

    masks_tensor = np.zeros((len(free_vertices), n_faces, n_faces), dtype=int)
    for v in free_vertices:
        for f1 in range(n_faces):
            for f2 in range(f1, n_faces):
                if v in faces_matrix[f1][f2]:
                    vertex_index = np.nonzero(free_vertices == v)[0][0]
                    masks_tensor[vertex_index][f1][f2] = 1
                    masks_tensor[vertex_index][f2][f1] = 1

    det_minor_list = []
    rank_list = []
    bordered_det_list = []
    gauss_sum_list = []
    chi_list = []
    term_list = []

    all_free_sigma = itertools.product([-1, 1], repeat=len(free_vertices))
    for sigma_free in all_free_sigma:
        sigma_free = np.array(sigma_free).reshape(-1, 1, 1)
        faces_matrix_filled = np.sum(masks_tensor * sigma_free, axis=0) % 3

        gauss, det_minor, rank, rows = gaussian_sum(faces_matrix_filled)

        # check that system of linear equations is consistent
        # for this check that rank of an augmented matrix (faces_matrix_filled|l)
        # is the same as `rank` variable (rank of just `faces_matrix_filled`)
        augmented_matrix = np.concatenate(
            [faces_matrix_filled, l.reshape(-1, 1)], axis=1, dtype=int
        )
        augmented_matrix_rank = calc_rank_f3(augmented_matrix)

        if rank != augmented_matrix_rank:
            # System is inconsistent, return False and details
            return False, (
                sigma_free.reshape(-1).tolist(),
                augmented_matrix.tolist(),
                rank,
                augmented_matrix_rank,
            )

        M_ = faces_matrix_filled[np.ix_(rows, rows)]

        l_ = l[rows]

        M_l_ = np.pad(M_, ((0, 1), (0, 1)))
        M_l_[-1, :-1] = l_
        M_l_[:-1, -1] = l_

        bordered_det = int(round(np.linalg.det(M_l_))) % 3
        if bordered_det == 2:
            bordered_det = -1
        chi_val = calc_chi(bordered_det * det_minor)

        gauss_sum_list.append(gauss)
        det_minor_list.append(det_minor)
        rank_list.append(rank)
        bordered_det_list.append(bordered_det)
        chi_list.append(chi_val)
        term_list.append(chi_val * gauss)

    n_tait_0 = sum(term_list)
    n_tait_0 = sympy.nsimplify(n_tait_0)

    assert isinstance(
        n_tait_0, sympy.core.numbers.Integer
    ), f"Calculated sum of Tait colorings is not integer, got {n_tait_0}"

    return True, (
        int(n_tait_0),
        det_minor_list,
        rank_list,
        gauss_sum_list,
        bordered_det_list,
        chi_list,
        term_list,
    )


def calc_heawood(faces: List[List[int]]) -> List[int]:
    n_faces = len(faces)  # n + 2
    n_vertices = 2 * (n_faces - 2)  # 2n
    good_sigma_list = []

    for i in range(n_faces):
        faces[i] = list(set(faces[i]))

    for sigma in itertools.product([-1, 1], repeat=n_vertices):
        bad_sigma = False
        for face in faces:
            s = sum(sigma[v] for v in face) % 3
            if s != 0:
                bad_sigma = True
                break
        if bad_sigma:
            continue
        good_sigma_list.append(sigma)
    return good_sigma_list


def faces_matrix_to_dual_adjacency_matrix(
    faces_matrix: List[List[List[int]]],
) -> List[List[int]]:
    n = len(faces_matrix)
    adjacency_matrix = [
        [1 if len(faces_matrix[i][j]) > 0 else 0 for j in range(n)] for i in range(n)
    ]
    for i in range(n):
        adjacency_matrix[i][i] = 0
    return adjacency_matrix


def calc_s_values(
    faces_matrix: List[List[List[int]]], vertices_in: List[int], vertices_mid: List[int]
) -> List[Any]:
    n_faces = len(faces_matrix)
    vertices_in.sort()
    vertices_mid.sort()

    vertices_in = np.array(vertices_in)
    vertices_mid = np.array(vertices_mid)

    masks_tensor_mid = np.zeros((len(vertices_mid), n_faces, n_faces), dtype=int)
    for v in vertices_mid:
        for f1 in range(n_faces):
            for f2 in range(f1, n_faces):
                if v in faces_matrix[f1][f2]:
                    vertex_index = np.nonzero(vertices_mid == v)[0][0]
                    masks_tensor_mid[vertex_index][f1][f2] = 1
                    masks_tensor_mid[vertex_index][f2][f1] = 1

    masks_tensor_in = np.zeros((len(vertices_in), n_faces, n_faces), dtype=int)
    for v in vertices_in:
        for f1 in range(n_faces):
            for f2 in range(f1, n_faces):
                if v in faces_matrix[f1][f2]:
                    vertex_index = np.nonzero(vertices_in == v)[0][0]
                    masks_tensor_in[vertex_index][f1][f2] = 1
                    masks_tensor_in[vertex_index][f2][f1] = 1

    all_sigma_mid = itertools.product([-1, 1], repeat=len(vertices_mid))

    results = []

    for sigma_mid in all_sigma_mid:

        sigma_mid = np.array(sigma_mid).reshape(-1, 1, 1)
        faces_matrix_filled_mid = np.sum(masks_tensor_mid * sigma_mid, axis=0) % 3

        all_x = itertools.product([-1, 0, 1], repeat=n_faces)
        for x in all_x:
            x = np.array(x).reshape(-1, 1)

            s = 0
            all_sigma_in = itertools.product([-1, 1], repeat=len(vertices_in))
            for sigma_in in all_sigma_in:
                sigma_in = np.array(sigma_in).reshape(-1, 1, 1)
                faces_matrix_filled_in = np.sum(masks_tensor_in * sigma_in, axis=0)

                faces_matrix_filled = (
                    faces_matrix_filled_in + faces_matrix_filled_mid
                ) % 3

                s += calc_chi((x.T @ faces_matrix_filled @ x)[0][0])

            s = sympy.nsimplify(s)

            results.append(s)

    return results
