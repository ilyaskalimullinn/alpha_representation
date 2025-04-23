import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { fetchFaces } from "@/services/api";

export const useGraphStore = defineStore("graph", () => {
    const vertices = ref([
        { id: 1, x: 100, y: -100, label: "1", active: false },
        { id: 2, x: 200, y: -200, label: "2", active: false },
        { id: 3, x: 300, y: -100, label: "3", active: false },
        { id: 4, x: 200, y: -300, label: "4", active: false },
    ]);

    const edges = ref([
        { id: 1, vertexId1: 1, vertexId2: 2, active: false },
        { id: 2, vertexId1: 2, vertexId2: 3, active: false },
        { id: 3, vertexId1: 1, vertexId2: 3, active: false },
        { id: 4, vertexId1: 1, vertexId2: 4, active: false },
        { id: 5, vertexId1: 2, vertexId2: 4, active: false },
        { id: 6, vertexId1: 3, vertexId2: 4, active: false },
    ]);

    const faces = ref([]);

    const activeVertexId = ref(null);
    const activeEdgeId = ref(null);

    const addVertex = (vertex) => {
        if (vertex.id === null || vertex.id === undefined) {
            vertex.id = vertices.value[vertices.value.length - 1].id + 1;
        }
        if (vertex.active === null || vertex.active === undefined) {
            vertex.active = false;
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
            edge.id = edges.value[edges.value.length - 1].id + 1;
        }
        if (edge.active === null || edge.active === undefined) {
            edge.active = false;
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
        // Remove the vertex
        vertices.value = vertices.value.filter((v) => v.id !== vertex.id);

        // Remove any edges connected to this vertex
        edges.value = edges.value.filter(
            (e) => e.vertexId1 !== vertex.id && e.vertexId2 !== vertex.id
        );
    };
    const deleteEdge = (edge) => {
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
        return matrix;
    });

    const findFaces = async () => {
        const data = await fetchFaces(adjacencyMatrix.value, vertices.value);
        const newFaces = [];
        for (let i in data.data.faces) {
            const vertexIds = data.data.faces[i].slice(1);
            let face = {
                vertices: [],
                edges: [],
                id: i,
            };
            face.id = i;
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
        console.log(faces.value);
    };

    return {
        vertices,
        edges,
        faces,
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
    };
});
