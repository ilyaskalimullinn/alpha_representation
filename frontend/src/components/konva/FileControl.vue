<template>
    <div class="graph-import-export">
        <h3>Импорт и экспорт графов</h3>

        <div class="actions">
            <button class="button" @click="downloadGraphData()">
                Экспортировать граф как JSON
            </button>

            <form
                class="import-form"
                action="#"
                method="post"
                @submit.prevent="loadGraph"
            >
                <div class="file-input-container">
                    <label class="file-label" for="graph-input-file">
                        <span class="file-label-text">Выберите JSON файл</span>
                        <input
                            type="file"
                            name="graph-input-file"
                            id="graph-input-file"
                            class="file-input"
                            required
                            accept=".json"
                            @change="handleFileChange"
                        />
                        <span class="file-custom">{{
                            selectedFile || "Выберите файл"
                        }}</span>
                    </label>
                </div>
                <button class="button" type="submit">Импортировать граф</button>
            </form>
        </div>
    </div>
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
    };
};

const loadGraph = (event) => {
    const file = event.target[0].files[0];

    const reader = new FileReader();
    reader.onload = async function (e) {
        let contents = e.target.result;
        let graphData = JSON.parse(contents);
        await graphStore.buildGraph(graphData);
        selectedFile.value = null;
    };
    reader.readAsText(file);
};

const downloadGraphData = () => {
    downloadjs(JSON.stringify(getGraphJSON()), "graph.json", "text/plain");
};

const handleFileChange = (e) => {
    const file = e.target.files[0];
    selectedFile.value = file ? file.name : "";
};
</script>

<style scoped>
.graph-import-export {
    max-width: 500px;
    border-radius: 12px;
}

.actions {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.import-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.file-input-container {
    position: relative;
}

.file-label {
    display: block;
    cursor: pointer;
}

.file-input {
    position: absolute;
    opacity: 0;
    width: 0.1px;
    height: 0.1px;
    overflow: hidden;
}

.file-custom {
    display: block;
    padding: 1rem;
    border: 2px dashed #ced4da;
    border-radius: 8px;
    text-align: center;
    transition: all 0.3s ease;
    background-color: white;
}

.file-label-text {
    display: block;
    margin-bottom: 0.5rem;
    color: #495057;
    font-weight: 500;
}

.file-input:focus + .file-custom,
.file-input:hover + .file-custom {
    border-color: #4a6bff;
    box-shadow: 0 0 0 3px rgba(74, 107, 255, 0.2);
}

.file-input:active + .file-custom {
    transform: scale(0.98);
}
</style>
