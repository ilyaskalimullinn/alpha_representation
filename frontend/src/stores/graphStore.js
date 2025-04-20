import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useGraphStore = defineStore("graph", () => {
    const vertices = ref([
        { id: 1, x: 100, y: -100, label: "1" },
        { id: 2, x: 200, y: -200, label: "2" },
        { id: 3, x: 300, y: -100, label: "3" },
    ]);

    const edges = ref([
        { id: 1, vertexId1: 1, vertexId2: 2 },
        { id: 2, vertexId1: 2, vertexId2: 3 },
        { id: 3, vertexId1: 1, vertexId2: 3 },
    ]);

    const addVertex = (vertex) => {
        vertices.value.push(vertex);
    };

    const addEdge = (edge) => {
        if (edge.vertexId1 < edge.vertexId2) {
            let v = edge.vertexId1;
            edge.vertexId1 = edge.vertexId2;
            edge.vertexId2 = v;
        }
        edges.value.push(edge);
    };

    const getEdgeIndex = (vertexId1, vertexId2) => {
        const index = edges.findIndex(
            (e) => e.vertexId1 === vertexId1 && e.vertexId2 === vertexId2
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
        const n = vertices.value.length;
        let matrix = new Array(n);
        for (let i = 0; i < n; i++) {
            matrix[i] = new Array(n);
        }
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
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

    return {
        vertices,
        edges,
        addVertex,
        addEdge,
        deleteVertex,
        deleteEdge,
        getEdgeIndex,
        getVertexById,
        getVertexIndexById,
        adjacencyMatrix,
    };
});
