<template>
    <button @click="graphStore.findFaces()">Найти грани в графе</button>

    <h3>Матрица граней</h3>
    <table></table>

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
</script>

<style scoped>
.graph-face:hover {
    cursor: pointer;
    background-color: lightgrey;
    transition: 0.2s;
}
</style>
