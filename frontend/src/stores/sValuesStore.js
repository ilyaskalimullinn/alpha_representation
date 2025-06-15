import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
    fetchFaces,
    fetchFacesMatrix,
    fetchTaitAlphaRepresentation,
    fetchTaitAlphaRepresentationFixed,
    fetchTaitChromaticPolynomial,
    fetchVertexPositions,
} from "@/services/api";

export const useSValuesStore = defineStore("sValues", () => {
    const vertices = ref([]); // {id: 1, label: "A", type: "mid"/"in"}

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

    return { vertices, deleteVertex, addVertex };
});
