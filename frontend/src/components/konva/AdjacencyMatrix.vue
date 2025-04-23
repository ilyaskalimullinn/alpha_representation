<template>
    <h3>Матрица смежности</h3>
    <table v-if="graphStore.adjacencyMatrix !== null" id="adjacency-matrix">
        <tr>
            <th>Вершина</th>
            <th
                v-for="vertex in graphStore.vertices"
                @mouseover="vertex.active = true"
                @mouseleave="vertex.active = false"
            >
                {{ vertex.label }}
            </th>
        </tr>
        <tr v-for="(row, i) in graphStore.adjacencyMatrix">
            <th
                @mouseover="graphStore.vertices[i].active = true"
                @mouseleave="graphStore.vertices[i].active = false"
            >
                {{ graphStore.vertices[i].label }}
            </th>

            <td
                v-for="(elem, j) in row"
                @mouseover="setEdgeActive(i, j, true)"
                @mouseleave="setEdgeActive(i, j, false)"
            >
                {{ elem }}
            </td>
        </tr>
    </table>
</template>

<script setup>
import { useGraphStore } from "@/stores/graphStore";

const graphStore = useGraphStore();

const setEdgeActive = (i, j, active) => {
    const edgeIndex = graphStore.getEdgeIndex(
        graphStore.vertices[i].id,
        graphStore.vertices[j].id
    );
    if (edgeIndex === -1) {
        return;
    }
    graphStore.edges[edgeIndex].active = active;
};
</script>

<style scoped>
#adjacency-matrix,
#adjacency-matrix th,
#adjacency-matrix td {
    border: 1px solid black;
}

#adjacency-matrix th:hover,
#adjacency-matrix td:hover {
    cursor: pointer;
    background-color: lightgrey;
    transition: 0.2s;
}
</style>
