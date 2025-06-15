<template>
    <div class="container">
        <div class="adjacency-matrix-container">
            <h3>Матрица смежности</h3>
            <table
                v-if="graphStore.adjacencyMatrix !== null"
                id="adjacency-matrix"
                class="matrix"
            >
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
        </div>
        <div>
            <h3>Названия вершин</h3>
            <ul>
                <li
                    v-for="vertex in graphStore.vertices"
                    @mouseover="vertex.active = true"
                    @mouseleave="vertex.active = false"
                >
                    <input type="text" v-model="vertex.label" />

                    <input
                        type="number"
                        placeholder="Фикс. спин"
                        min="-1"
                        max="1"
                        step="2"
                        v-model="vertex.fixedSpin"
                    />
                </li>
            </ul>
        </div>
    </div>
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

const validateFixedSpin = (e) => {
    // const val = e.target.value;
    // if (val !== "" && val !== "1" && val !== "-" && val !== "-1") {
    //     e.target.value = "";
    // }
};
</script>

<style scoped>
.container {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
}
</style>
