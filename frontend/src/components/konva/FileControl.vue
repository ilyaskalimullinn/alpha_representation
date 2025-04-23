<template>
    <h3>Импорт и экспорт графов</h3>

    <button @click="downloadGraphData()">Экспортировать граф как JSON</button>

    <form action="#" method="post" @submit.prevent="loadGraph">
        <label for="graph-input-file">JSON файл</label>
        <input
            type="file"
            name="graph-input-file"
            id="graph-input-file"
            required
            @change="selectedFile"
            accept=".json"
        />
        <button type="submit">Импортировать граф через JSON</button>
    </form>
</template>

<script setup>
import downloadjs from "downloadjs";
import { useGraphStore } from "@/stores/graphStore";
import { ref } from "vue";

const selectedFile = ref(null);

const graphStore = useGraphStore();

const getGraphJSON = () => {
    return {
        adjacency_matrix: graphStore.adjacencyMatrix,
        vertices: graphStore.vertices,
        edges: graphStore.edges,
        faces: graphStore.faces,
        faces_matrix: graphStore.facesMatrix,
    };
};

const loadGraph = (event) => {
    const file = event.target[0].files[0];

    const reader = new FileReader();
    reader.onload = async function (e) {
        let contents = e.target.result;
        let graphData = JSON.parse(contents);
        await graphStore.buildGraph(graphData);
    };
    reader.readAsText(file);
};

const downloadGraphData = () => {
    downloadjs(JSON.stringify(getGraphJSON()), "graph.json", "text/plain");
};
</script>
