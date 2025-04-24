import axios from "axios";

const API_URL = import.meta.env.API_URL || "http://localhost:8000/api/v1";

const instance = axios.create({
    baseURL: API_URL,
});

instance.interceptors.request.use(
    function (config) {
        config.headers["Accept"] = `application/json`;
        config.headers["Content-Type"] = "application/json";
        return config;
    },
    function (error) {
        return Promise.reject(error);
    }
);

const defaultApiExceptionHandler = (error) => {
    if (error.response) {
        console.error(error.response);

        let err = new Error(
            error.response.data.message || "Неизвестная ошибка без сообщения"
        );
        err.statusCode = error.response.status;
        throw err;
    } else {
        console.error("Полная ошибка:", error.message);
        throw new Error("Неизвестная ошибка, попробуйте еще раз");
    }
};

export const fetchFaces = async (adjacencyMatrix, positions) => {
    const response = await instance
        .post("/find_faces", {
            adjacency_matrix: adjacencyMatrix,
            positions: positions,
        })
        .catch(defaultApiExceptionHandler);

    return response.data;
};

export const fetchFacesMatrix = async (faces) => {
    let resp = await instance
        .post("/find_faces_matrix", {
            faces: faces,
        })
        .catch(defaultApiExceptionHandler);
    return resp.data;
};

export const fetchVertexPositions = async (adjacencyMatrix) => {
    let resp = await instance
        .post("/positions", {
            adjacency_matrix: adjacencyMatrix,
        })
        .catch(defaultApiExceptionHandler);
    return resp.data;
};

export const fetchTaitChromaticPolynomial = async (facesMatrix) => {
    let resp = await instance
        .post("/calc_tait_0_dual_chromatic", { faces_matrix: facesMatrix })
        .catch(defaultApiExceptionHandler);
    return resp.data;
};

export const fetchTaitAlphaRepresentation = async (facesMatrix, detail) => {
    let resp = await instance
        .post("/calc_tait_0", { faces_matrix: facesMatrix, detail })
        .catch(defaultApiExceptionHandler);
    return resp.data;
};
