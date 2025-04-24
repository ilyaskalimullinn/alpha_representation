<template>
    <button @click="graphStore.findFacesMatrix()">
        Найти матрицу граней для графа
    </button>
    <button @click="graphStore.findFaces()">Найти грани в графе</button>

    <h3>Матрица граней</h3>
    <table v-if="graphStore.facesMatrix.length > 0" class="matrix">
        <tr>
            <th>Грань</th>

            <th
                v-for="face in graphStore.faces"
                :key="`face_${face.id}`"
                @mouseover="setFaceActive(face, true)"
                @mouseleave="setFaceActive(face, false)"
            >
                {{ face.id }}
            </th>
        </tr>

        <tr
            v-for="(row, i) in graphStore.facesMatrix"
            :key="`faces_matrix_i_${i}`"
        >
            <th
                @mouseover="setFaceActive(graphStore.faces[i], true)"
                @mouseleave="setFaceActive(graphStore.faces[i], false)"
            >
                {{ graphStore.faces[i].id }}
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
    <ul v-if="graphStore.faces.length > 0">
        <li
            v-for="face in graphStore.faces"
            :key="`face_${face.id}`"
            class="graph-face"
            @mouseover="setFaceActive(face, true)"
            @mouseleave="setFaceActive(face, false)"
        >
            {{ face.vertices.map((v) => v.id) }}
        </li>
    </ul>
</template>

<script setup>
import { useGraphStore } from "@/stores/graphStore";

const graphStore = useGraphStore();

const setFaceActive = (face, active) => {
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
