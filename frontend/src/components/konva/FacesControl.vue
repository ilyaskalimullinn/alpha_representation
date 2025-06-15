<template>
    <button @click="graphStore.findFacesMatrix()">
        Найти матрицу граней для графа
    </button>
    <button @click="graphStore.findFaces()">Найти грани в графе</button>

    <h3>Матрица граней</h3>
    <button
        @click="
            copyToClipboard(JSON.stringify(graphStore.facesMatrixWithFreeSpins))
        "
        v-if="graphStore.facesMatrixWithFreeSpins.length > 0"
    >
        Копировать
    </button>
    <table v-if="graphStore.facesMatrixWithFreeSpins.length > 0" class="matrix">
        <tr>
            <th>Грань</th>

            <th
                v-for="(face, i) in graphStore.faces"
                :key="`face_${face.id}`"
                @mouseover="setFaceActive(face, true)"
                @mouseleave="setFaceActive(face, false)"
            >
                {{ i + 1 }}
            </th>
        </tr>

        <tr
            v-for="(row, i) in graphStore.facesMatrixWithFreeSpins"
            :key="`faces_matrix_i_${i}`"
        >
            <th
                @mouseover="setFaceActive(graphStore.faces[i], true)"
                @mouseleave="setFaceActive(graphStore.faces[i], false)"
            >
                {{ i + 1 }}
            </th>

            <td
                v-for="(elem, j) in row"
                @mouseover="
                    setFaceActive(graphStore.faces[i], true);
                    setFaceActive(graphStore.faces[j], true);
                "
                @mouseleave="
                    setFaceActive(graphStore.faces[i], false);
                    setFaceActive(graphStore.faces[j], false);
                "
            >
                {{ getSigma(elem) }}
            </td>
        </tr>
    </table>

    <h3>Список граней</h3>
    <draggable
        v-model="graphStore.faces"
        item-key="id"
        tag="ul"
        v-if="graphStore.faces.length > 0"
        @end="graphStore.findFacesMatrix()"
    >
        <template #item="{ element, index }">
            <li
                @mouseover="setFaceActive(element, true)"
                @mouseleave="setFaceActive(element, false)"
                class="graph-face"
            >
                {{ index + 1 }})
                {{ element.vertices.map((v) => v.label).join(", ") }}
            </li>
        </template>
    </draggable>
</template>

<script setup>
import { useGraphStore } from "@/stores/graphStore";
import { copyToClipboard } from "@/services/utils";
import draggable from "vuedraggable";

const graphStore = useGraphStore();

const setFaceActive = (face, active) => {
    face.active = active;
    for (let vertice of face.vertices) {
        vertice.active = active;
    }
    for (let edge of face.edges) {
        edge.active = active;
    }
};

const getSigma = (vertexIds) => {
    let vertices = vertexIds.map((i) => `σ(${graphStore.vertices[i].label})`);
    if (vertices.length === 0) {
        return "0";
    }
    return vertices.join("+");
};
</script>

<style scoped>
.graph-face:hover {
    cursor: pointer;
    background-color: lightgrey;
    transition: 0.2s;
}
</style>
