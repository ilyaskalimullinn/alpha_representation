import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
    fetchFaces,
    fetchFacesMatrix,
    fetchTaitAlphaRepresentation,
    fetchTaitAlphaRepresentationFixed,
    fetchTaitChromaticPolynomial,
    fetchVertexPositions,
    fetchHeawood,
} from "@/services/api";

export const useGraphStore = defineStore("graph", () => {
    const defaultVertexColor = "#add8e6";
    const defaultEdgeColor = "#ff0000";

    const vertices = ref([
        {
            id: 1,
            x: 100,
            y: -100,
            label: "A",
            active: false,
            color: defaultVertexColor,
            fixedSpin: "",
        },
        {
            id: 2,
            x: 300,
            y: -200,
            label: "B",
            active: false,
            color: defaultVertexColor,
            fixedSpin: "",
        },
        {
            id: 3,
            x: 500,
            y: -100,
            label: "C",
            active: false,
            color: defaultVertexColor,
            fixedSpin: "",
        },
        {
            id: 4,
            x: 300,
            y: -400,
            label: "D",
            active: false,
            color: defaultVertexColor,
            fixedSpin: "",
        },
    ]);

    const edges = ref([
        {
            id: 1,
            vertexId1: 1,
            vertexId2: 2,
            active: false,
            color: defaultEdgeColor,
            isReal: true,
        },
        {
            id: 2,
            vertexId1: 2,
            vertexId2: 3,
            active: false,
            color: defaultEdgeColor,
            isReal: true,
        },
        {
            id: 3,
            vertexId1: 1,
            vertexId2: 3,
            active: false,
            color: defaultEdgeColor,
            isReal: true,
        },
        {
            id: 4,
            vertexId1: 1,
            vertexId2: 4,
            active: false,
            color: defaultEdgeColor,
            isReal: true,
        },
        {
            id: 5,
            vertexId1: 2,
            vertexId2: 4,
            active: false,
            color: defaultEdgeColor,
            isReal: true,
        },
        {
            id: 6,
            vertexId1: 3,
            vertexId2: 4,
            active: false,
            color: defaultEdgeColor,
            isReal: true,
        },
    ]);

    const faces = ref([]);

    const facesMatrix = ref([]);

    const fixedVertices = computed(() => {
        return vertices.value.filter((v) => v.fixedSpin !== "");
    });

    const freeVertices = computed(() => {
        return vertices.value.filter((v) => v.fixedSpin === "");
    });

    const defaultAlphaRepresentationStats = {
        taitChromatic: 0,
        taitAlpha: 0,
        taitAlphaDetail: {
            determinantList: [],
            rankList: [],
            gaussSumList: [],
        },
        taitAlphaNoDetail: {
            numEvenRanks: 0,
            numOddRanks: 0,
            numZeroRanks: 0,
            rankList: [],
            determinantList: [],
            gaussSumList: [],
            numOfOccurances: [],
            totalGaussSumList: [],
        },
        heawood: {
            configurations: [],
        },
    };

    const defaultAlphaRepresentationStatsFixed = {
        taitAlpha: 0,
        determinantList: [],
        rankList: [],
        gaussSumList: [],
        borderedDeterminantList: [],
        chiList: [],
        termList: [],
        error: {
            sigmaFree: [],
            augmentedMatrix: [],
            baseRank: 0,
            augmentedMatrixRank: 0,
        },
    };

    const coloring = ref(
        JSON.parse(JSON.stringify(defaultAlphaRepresentationStats))
    );

    const coloringFixed = ref(
        JSON.parse(JSON.stringify(defaultAlphaRepresentationStatsFixed))
    );

    const facesMatrixWithFreeSpins = computed(() => {
        const m = [];
        const n = facesMatrix.value.length;
        for (let i = 0; i < n; i++) {
            let row = [];
            for (let j = 0; j < n; j++) {
                row.push(
                    facesMatrix.value[i][j].filter(
                        (vertexIndex) =>
                            vertices.value[vertexIndex].fixedSpin === ""
                    )
                );
            }
            m.push(row);
        }
        return m;
    });

    const lFixed = computed(() => {
        if (
            fixedVertices.value.length === 0 ||
            faces.value.length === 0 ||
            facesMatrix.value.length === 0
        ) {
            return [];
        }

        const l = [];
        for (let face of faces.value) {
            let s = 0;
            for (let vertex of face.vertices) {
                let spin = vertex.fixedSpin;
                if (spin !== "") {
                    s += spin;
                }
            }
            s = s % 3;
            if (s === 2) {
                s = -1;
            }
            l.push(s);
        }

        return l;
    });

    const activeVertexId = ref(null);
    const activeEdgeId = ref(null);

    const stageConfig = ref({ width: 800, height: 500, scaleY: -1 });

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
        if (vertex.x <= 0 || vertex.x >= stageConfig.value.width) {
            vertex.x = stageConfig.value.width / 2;
        }
        if (
            vertex.y * stageConfig.value.scaleY <= 0 ||
            vertex.y * stageConfig.value.scaleY >= stageConfig.value.height
        ) {
            vertex.y =
                (stageConfig.value.scaleY * stageConfig.value.height) / 2;
        }
        if (vertex.color === null || vertex.color === undefined) {
            vertex.color = defaultVertexColor;
        }
        if (vertex.fixedSpin === undefined || vertex.fixedSpin === null) {
            vertex.fixedSpin = "";
        }
        vertices.value.push(vertex);
    };

    const addEdge = (edge) => {
        if (edge.vertexId1 > edge.vertexId2) {
            let v = edge.vertexId1;
            edge.vertexId1 = edge.vertexId2;
            edge.vertexId2 = v;
        }
        if (edge.id === null || edge.id === undefined) {
            if (edges.value.length === 0) {
                edge.id = 1;
            } else {
                edge.id = edges.value[edges.value.length - 1].id + 1;
            }
        }
        if (edge.active === null || edge.active === undefined) {
            edge.active = false;
        }
        if (edge.color === null || edge.color === undefined) {
            edge.color = defaultEdgeColor;
        }
        if (edge.isReal === null || edge.isReal === undefined) {
            edge.isReal = true;
        }
        edges.value.push(edge);
    };

    const getEdgeIndex = (vertexId1, vertexId2) => {
        const index = edges.value.findIndex(
            (e) =>
                (e.vertexId1 === vertexId1 && e.vertexId2 === vertexId2) ||
                (e.vertexId1 === vertexId2 && e.vertexId2 === vertexId1)
        );
        return index;
    };

    const getVertexById = (vertexId) => {
        const index = getVertexIndexById(vertexId);
        if (index === -1) {
            return null;
        }
        return vertices.value[index];
    };
    const getVertexIndexById = (vertexId) => {
        return vertices.value.findIndex((v) => v.id === vertexId);
    };

    const deleteVertex = (vertex) => {
        faces.value = [];
        facesMatrix.value = [];
        // Remove the vertex
        vertices.value = vertices.value.filter((v) => v.id !== vertex.id);

        // Remove any edges connected to this vertex
        edges.value = edges.value.filter(
            (e) => e.vertexId1 !== vertex.id && e.vertexId2 !== vertex.id
        );
    };
    const deleteEdge = (edge) => {
        faces.value = [];
        facesMatrix.value = [];
        edges.value = edges.value.filter((e) => e.id !== edge.id);
    };

    const adjacencyMatrix = computed(() => {
        if (vertices.value.length === 0) {
            return null;
        }
        let matrix = new Array(vertices.value.length);
        for (let i = 0; i < vertices.value.length; i++) {
            matrix[i] = new Array(vertices.value.length);
        }
        for (let i = 0; i < vertices.value.length; i++) {
            for (let j = i; j < vertices.value.length; j++) {
                let edgeIndex = getEdgeIndex(
                    vertices.value[i].id,
                    vertices.value[j].id
                );
                let val = edgeIndex === -1 ? 0 : 1;
                matrix[i][j] = val;
                matrix[j][i] = val;
            }
        }
        faces.value = [];
        facesMatrix.value = [];
        return matrix;
    });

    const findFaces = async () => {
        const positions = vertices.value.map((v) => [v.x, v.y]);
        const data = await fetchFaces(adjacencyMatrix.value, positions);
        buildFaces(data.data.faces);
    };

    const buildFaces = (facesList) => {
        const newFaces = [];
        for (let i in facesList) {
            let vertexIds = facesList[i];
            if (vertexIds[0] === vertexIds[vertexIds.length - 1]) {
                vertexIds = vertexIds.slice(1);
            }
            let face = { active: false };
            face.id = parseInt(i) + 1;
            face.vertices = vertexIds.map((v) => vertices.value[v]);
            face.edges = [];
            for (let j = 1; j < vertexIds.length; j++) {
                let edgeIndex = getEdgeIndex(
                    vertices.value[vertexIds[j - 1]].id,
                    vertices.value[vertexIds[j]].id
                );
                let edge = edges.value[edgeIndex];
                face.edges.push(edge);
            }
            let edgeIndex = getEdgeIndex(
                vertices.value[vertexIds[vertexIds.length - 1]].id,
                vertices.value[vertexIds[0]].id
            );
            let edge = edges.value[edgeIndex];
            face.edges.push(edge);
            newFaces.push(face);
        }
        faces.value = newFaces;
    };

    const findFacesMatrix = async () => {
        if (faces.value.length === 0) {
            await findFaces();
        }

        let facesData = [];
        for (let face of faces.value) {
            let verticesOfFace = face.vertices.map((v) =>
                vertices.value.indexOf(v)
            );
            facesData.push(verticesOfFace);
        }

        const data = await fetchFacesMatrix(facesData);

        facesMatrix.value = data.data.faces_matrix;
    };

    const buildVertices = async (adjMatrix) => {
        const data = await fetchVertexPositions(adjMatrix);

        const width = stageConfig.value.width;
        const height = stageConfig.value.height;

        let positions = data.data.positions;

        let min_x = positions[0][0];
        let max_x = min_x;
        let min_y = positions[0][1];
        let max_y = min_y;

        for (let i = 1; i < positions.length; i++) {
            if (positions[i][0] < min_x) {
                min_x = positions[i][0];
            }
            if (positions[i][1] < min_y) {
                min_y = positions[i][1];
            }
            if (positions[i][0] > max_x) {
                max_x = positions[i][0];
            }
            if (positions[i][1] > max_y) {
                max_y = positions[i][1];
            }
        }

        // now min coordinate goes to 10% of canvas, max - to 90%
        const width_80 = width * 0.8;
        const width_10 = width * 0.1;
        const height_80 = height * 0.8;
        const height_10 = height * 0.1;

        for (let i = 0; i < positions.length; i++) {
            let x =
                ((positions[i][0] - min_x) / (max_x - min_x)) * width_80 +
                width_10;
            let y =
                ((positions[i][1] - min_y) / (max_y - min_y)) * height_80 +
                height_10;
            y *= stageConfig.value.scaleY;
            addVertex({ x: x, y: y, id: i + 1 });
        }
    };

    const buildGraph = async (graphData) => {
        if (graphData.adjacency_matrix === undefined) {
            console.error("Нет матрицы смежности, ошибка");
            return;
        }
        let adjMatrix = graphData.adjacency_matrix;

        vertices.value = [];
        edges.value = [];
        faces.value = [];
        facesMatrix.value = [];
        clearAlphaStats();

        if (
            graphData.vertices === undefined ||
            graphData.vertices.length === 0
        ) {
            await buildVertices(adjMatrix);
        } else {
            for (let v of graphData.vertices) {
                addVertex(v);
            }
        }

        if (graphData.edges === undefined) {
            for (let i = 0; i < adjMatrix.length; i++) {
                for (let j = i + 1; j < adjMatrix.length; j++) {
                    addEdge({
                        vertexId1: vertices.value[i].id,
                        vertexId2: vertices.value[j].id,
                    });
                }
            }
        } else {
            for (let e of graphData.edges) {
                addEdge(e);
            }
        }

        await findFaces();

        if (graphData.faces !== undefined) {
            buildFaces(graphData.faces);
        }

        if (graphData.faces_matrix !== undefined) {
            facesMatrix.value = graphData.faces_matrix;
        } else {
            await findFacesMatrix();
        }
    };

    const calcTaitChromaticPolynomial = async () => {
        if (facesMatrix.value.length === 0) {
            await findFacesMatrix();
        }
        const data = await fetchTaitChromaticPolynomial(facesMatrix.value);

        coloring.value.taitChromatic = data.data.tait_0;
    };

    const calcTaitAlphaRepresentation = async (detail) => {
        if (facesMatrix.value.length === 0) {
            await findFacesMatrix();
        }
        const resp = await fetchTaitAlphaRepresentation(
            facesMatrix.value,
            detail
        );
        const data = resp.data;

        coloring.value.taitAlpha = data.tait_0;

        if (detail) {
            coloring.value.taitAlphaDetail.determinantList = data.det_list;
            coloring.value.taitAlphaDetail.rankList = data.rank_list;
            coloring.value.taitAlphaDetail.gaussSumList = data.gauss_sum_list;
        } else {
            coloring.value.taitAlphaNoDetail.numEvenRanks = data.n_even_ranks;
            coloring.value.taitAlphaNoDetail.numOddRanks = data.n_odd_ranks;
            coloring.value.taitAlphaNoDetail.numZeroRanks = data.n_zero_ranks;
            coloring.value.taitAlphaNoDetail.rankList = data.rank_list;
            coloring.value.taitAlphaNoDetail.determinantList = data.det_list;
            coloring.value.taitAlphaNoDetail.gaussSumList = data.gauss_sum_list;
            coloring.value.taitAlphaNoDetail.numOfOccurances = data.num_list;
            coloring.value.taitAlphaNoDetail.totalGaussSumList =
                data.total_gauss_sum_list;
        }
    };

    const calcTaitAlphaRepresentationFixed = async () => {
        if (facesMatrix.value.length === 0) {
            await findFacesMatrix();
        }

        if (fixedVertices.length === 0) {
            return;
        }

        const fixedSpins = {};
        for (let vertex of fixedVertices.value) {
            let ind = vertices.value.indexOf(vertex);
            fixedSpins[ind] = parseInt(vertex.fixedSpin);
        }

        const resp = await fetchTaitAlphaRepresentationFixed(
            facesMatrix.value,
            fixedSpins
        );
        const data = resp.data;
        if (resp.status === "error") {
            alert("Система не совместна");
            coloringFixed.value.error.baseRank = data.base_rank;
            coloringFixed.value.error.augmentedMatrixRank =
                data.augmented_matrix_rank;
            coloringFixed.value.error.augmentedMatrix = data.augmented_matrix;
            coloringFixed.value.error.sigmaFree = data.sigma;
            return;
        }

        coloringFixed.value.taitAlpha = data.tait_0;

        coloringFixed.value.determinantList = data.det_list;
        coloringFixed.value.rankList = data.rank_list;
        coloringFixed.value.gaussSumList = data.gauss_sum_list;
        coloringFixed.value.borderedDeterminantList = data.bordered_det_list;
        coloringFixed.value.chiList = data.chi_list;
        coloringFixed.value.termList = data.term_list;
    };

    const clearAlphaStats = () => {
        coloring.value = JSON.parse(
            JSON.stringify(defaultAlphaRepresentationStats)
        );
        coloringFixed.value = JSON.parse(
            JSON.stringify(defaultAlphaRepresentationStatsFixed)
        );
    };

    const calcTaitHeawood = async () => {
        if (faces.value.length === 0) {
            await findFaces();
        }

        const facesList = faces.value.map((f) =>
            f.vertices.map((v) => vertices.value.indexOf(v))
        );

        let fixedSpins = {};
        for (let vertex of fixedVertices.value) {
            let ind = vertices.value.indexOf(vertex);
            fixedSpins[ind] = parseInt(vertex.fixedSpin);
        }
        if (Object.keys(fixedSpins).length === 0) {
            fixedSpins = null;
        }

        const resp = await fetchHeawood(facesList, fixedSpins);

        const data = resp.data;

        coloring.value.heawood.configurations = data.configurations;
    };

    return {
        vertices,
        edges,
        faces,
        facesMatrix,
        facesMatrixWithFreeSpins,
        lFixed,
        fixedVertices,
        freeVertices,
        coloring,
        coloringFixed,
        stageConfig,
        activeVertexId,
        activeEdgeId,
        addVertex,
        addEdge,
        deleteVertex,
        deleteEdge,
        getEdgeIndex,
        getVertexById,
        getVertexIndexById,
        adjacencyMatrix,
        findFaces,
        findFacesMatrix,
        buildGraph,
        calcTaitChromaticPolynomial,
        calcTaitAlphaRepresentation,
        calcTaitAlphaRepresentationFixed,
        calcTaitHeawood,
    };
});
