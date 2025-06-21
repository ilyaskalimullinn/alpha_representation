<template>
    <div class="container">
        <div class="adjacency-matrix-container">
            <h3>Матрица смежности</h3>
            <table
                v-if="graphStore.adjacencyMatrix !== null"
                id="adjacency-matrix"
                class="matrix"
            >
                <colgroup>
                    <col
                        :style="{
                            width: `${100 / (graphStore.vertices.length + 1)}%`,
                        }"
                    />
                    <col
                        v-for="v in graphStore.vertices"
                        :key="v.id"
                        :style="{
                            width: `${100 / (graphStore.vertices.length + 1)}%`,
                        }"
                    />
                </colgroup>
                <tr>
                    <th></th>
                    <th
                        v-for="vertex in graphStore.vertices"
                        @mouseover="vertex.active = true"
                        @mouseleave="vertex.active = false"
                    >
                        {{ vertex.label }}
                    </th>
                </tr>
                <tr v-for="(row, i) in graphStore.adjacencyMatrix">
                    <td
                        @mouseover="graphStore.vertices[i].active = true"
                        @mouseleave="graphStore.vertices[i].active = false"
                    >
                        {{ graphStore.vertices[i].label }}
                    </td>

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
        <div class="vertices-control">
            <h3>Вершины<br />(и фикс. спины)</h3>
            <ul class="vertices-list">
                <li
                    v-for="vertex in graphStore.vertices"
                    @mouseover="vertex.active = true"
                    @mouseleave="vertex.active = false"
                >
                    <input
                        type="text"
                        v-model="vertex.label"
                        class="vertex-label-input"
                    />

                    <input
                        type="number"
                        class="vertex-spin-input"
                        placeholder="Спин"
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
</script>

<style scoped>
.container {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    margin-bottom: 20px;
}

.adjacency-matrix-container {
    margin-right: 30px;
    flex: 1 1 0%;
    min-width: 0;
}

.vertices-control {
    flex: 0 0 auto;
    min-width: 100px;
}

#adjacency-matrix td {
    padding: 3px;
}

.vertex-label-input {
    max-width: 65px;
}

.vertex-spin-input {
    max-width: 65px;
}

.vertices-list {
    list-style-type: none;
    padding: 0;
}
</style>
