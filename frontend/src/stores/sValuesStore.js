import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { fetchSValues } from "@/services/api";

export const useSValuesStore = defineStore("sValues", () => {
    const vertices = ref([
        { id: 1, label: "X", type: "in" },
        { id: 2, label: "Y", type: "in" },
        { id: 3, label: "Z", type: "in" },
        { id: 4, label: "A1", type: "mid" },
        { id: 5, label: "B1", type: "mid" },
        { id: 6, label: "C1", type: "mid" },
        { id: 7, label: "D1", type: "mid" },
        { id: 8, label: "E1", type: "mid" },
    ]);

    const defaultFacesMatrix = [
        [[1, 4, 5], [1, 5], [], [], [1, 4]],
        [[1, 5], [1, 2, 5, 6], [2, 6], [], [1, 2]],
        [[], [2, 6], [2, 3, 6, 7], [3, 7], [2, 3]],
        [[], [], [3, 7], [3, 7, 8], [3, 8]],
        [
            [1, 4],
            [1, 2],
            [2, 3],
            [3, 8],
            [1, 2, 3, 4, 8],
        ],
    ];

    const facesMatrix = ref(
        defaultFacesMatrix.map((row) =>
            row.map((cell) =>
                cell.map((vertexId) =>
                    vertices.value.find((v) => v.id === vertexId)
                )
            )
        )
    );

    const facesMatrixInput = ref(
        defaultFacesMatrix.map((row) =>
            row.map((cell) =>
                cell
                    .map(
                        (vertexId) =>
                            vertices.value.find((v) => v.id === vertexId).label
                    )
                    .join(", ")
            )
        )
    );

    const verticesIn = computed(() => {
        return vertices.value.filter((v) => v.type === "in");
    });

    const verticesMid = computed(() => {
        return vertices.value.filter((v) => v.type === "mid");
    });

    const s = ref([]);

    const isLoading = ref(false);

    const deleteVertex = (vertex) => {
        vertices.value = vertices.value.filter((v) => v.id !== vertex.id);
    };

    const addVertex = (vertex) => {
        if (vertex.id === null || vertex.id === undefined) {
            if (vertices.value.length === 0) {
                vertex.id = 1;
            } else {
                vertex.id = vertices.value[vertices.value.length - 1].id + 1;
            }
        }
        if (vertex.label === null || vertex.label === undefined) {
            vertex.label = `${vertex.id}`;
        }
        if (vertex.active === null || vertex.active === undefined) {
            vertex.active = false;
        }
        if (vertex.type === undefined || vertex.type === null) {
            vertex.type = "in";
        }
        vertices.value.push(vertex);
    };

    const extendFacesMatrix = () => {
        let n = facesMatrix.value.length;

        for (let i = 0; i < n; i++) {
            facesMatrix.value[i].push([]);
            facesMatrixInput.value[i].push("");
        }

        // Create a new row of (n + 1) empty arrays
        const newRow = Array(n + 1)
            .fill()
            .map(() => []);
        const newInputRow = Array.from({ length: n + 1 }, () => "");
        facesMatrix.value.push(newRow);
        facesMatrixInput.value.push(newInputRow);
    };

    const findSValue = async () => {
        isLoading.value = true;
        const matrix = [];
        const n = facesMatrix.value.length;

        for (let i = 0; i < n; i++) {
            let row = [];
            for (let j = 0; j < n; j++) {
                row.push(
                    facesMatrix.value[i][j].map((vertex) =>
                        vertices.value.findIndex((v) => v === vertex)
                    )
                );
            }
            matrix.push(row);
        }

        const verticesInIndices = [];
        const verticesMidIndices = [];

        for (let i = 0; i < vertices.value.length; i++) {
            if (vertices.value[i].type === "in") {
                verticesInIndices.push(i);
            } else if (vertices.value[i].type === "mid") {
                verticesMidIndices.push(i);
            }
        }

        const resp = await fetchSValues(
            matrix,
            verticesInIndices,
            verticesMidIndices
        );

        const data = resp.data;

        s.value = data.s;

        isLoading.value = false;
    };

    const deleteFace = (faceIndex) => {
        removeRowAndColumn(facesMatrix.value, faceIndex);
        removeRowAndColumn(facesMatrixInput.value, faceIndex);
    };

    const removeRowAndColumn = (matrix, i) => {
        // Remove row at index i
        matrix.splice(i, 1);

        // Remove column at index i from each remaining row
        for (let row of matrix) {
            row.splice(i, 1);
        }

        return matrix;
    };

    const buildFacesMatrix = (data) => {
        if (data.faces_matrix === undefined) {
            console.error("Нет матрицы граней, ошибка");
            return;
        }

        const facesMatrixIndices = data.faces_matrix;
        const numFaces = data.faces_matrix.length;

        vertices.value = [];
        facesMatrix.value = Array.from({ length: numFaces }, () =>
            Array.from({ length: numFaces }, () => [])
        );
        facesMatrixInput.value = Array.from({ length: numFaces }, () =>
            Array.from({ length: numFaces }, () => "")
        );

        if (data.vertices !== undefined) {
            // if vertices are present

            for (let v of data.vertices) {
                addVertex(v);
            }
        } else {
            // need to create vertices based on the max vertice index

            let maxIndex = 0;

            for (let i = 0; i < numFaces; i++) {
                for (let j = i; j < numFaces; j++) {
                    if (facesMatrixIndices[i][j] > maxIndex) {
                        maxIndex = facesMatrixIndices[i][j];
                    }
                }
            }

            // now create all vertices
            for (let vertexIndex = 0; vertexIndex <= maxIndex; vertexIndex++) {
                addVertex({});
            }
        }

        // now build faces matrix
        for (let i = 0; i < numFaces; i++) {
            for (let j = i; j < numFaces; j++) {
                let verticesList = facesMatrixIndices[i][j].map(
                    (index) => vertices.value[index]
                );
                let verticesString = verticesList
                    .map((v) => v.label)
                    .join(", ");

                facesMatrix.value[i][j] = verticesList;
                facesMatrix.value[j][i] = verticesList;

                facesMatrixInput.value[i][j] = verticesString;
                facesMatrixInput.value[j][i] = verticesString;
            }
        }
    };

    return {
        vertices,
        verticesIn,
        verticesMid,
        facesMatrix,
        facesMatrixInput,
        s,
        isLoading,
        deleteFace,
        deleteVertex,
        addVertex,
        extendFacesMatrix,
        findSValue,
        buildFacesMatrix,
    };
});
