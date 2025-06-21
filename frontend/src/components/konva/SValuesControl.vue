<script setup>
import { computed, ref } from "vue";
import { useSValuesStore } from "@/stores/sValuesStore.js";
import { copyToClipboard } from "@/services/utils";
import DataTable from "datatables.net-vue3";
import DataTablesCore from "datatables.net-dt";
import { generateAllSigma, downloadCSV, generateAllX } from "@/services/utils";
import Spinner from "@/components/utils/Spinner.vue";
import downloadjs from "downloadjs";

DataTable.use(DataTablesCore);

const sValuesStore = useSValuesStore();
const selectedFile = ref(null);

function updateMatrix(i, j) {
    const raw = sValuesStore.facesMatrixInput[i][j];
    const parsed = raw
        .split(",")
        .map((s) => s.trim())
        .map((vertexId) =>
            sValuesStore.vertices.find((v) => v.label === vertexId)
        )
        .filter((vertex) => vertex !== undefined);

    // Update both [i][j] and [j][i] to maintain symmetry
    sValuesStore.facesMatrix[i][j] = parsed;

    if (i !== j) {
        sValuesStore.facesMatrix[j][i] = [...parsed];
        sValuesStore.facesMatrixInput[j][i] = parsed
            .map((v) => v.label)
            .join(", ");
    }
}

const tableRows = computed(() => {
    const numMid = sValuesStore.verticesMid.length;
    const numFaces = sValuesStore.facesMatrix.length;

    const allSigma = generateAllSigma(numMid);
    const allX = generateAllX(numFaces);

    const rows = [];
    for (let i = 0; i < allSigma.length; i++) {
        for (let j = 0; j < allX.length; j++) {
            rows.push([
                ...allSigma[i],
                ...allX[j],
                sValuesStore.s[i * numFaces + j],
            ]);
        }
    }
    return rows;
});

const tableColumns = computed(() => {
    const vertexCols = sValuesStore.verticesMid.map(
        (v) => `Вершина ${v.label}`
    );
    const faceCols = [
        ...Array(sValuesStore.facesMatrix.length)
            .keys()
            .map((face) => `Грань ${face + 1}`),
    ];
    const cols = [...vertexCols, ...faceCols, "S"];
    return cols;
});

const getFacesMatrixData = () => {
    const n = sValuesStore.facesMatrix.length;

    // (n, n) matrix of empty arrays
    const facesMatrixWithIndices = Array.from({ length: n }, () =>
        Array.from({ length: n }, () => [])
    );

    for (let i = 0; i < n; i++) {
        for (let j = i; j < n; j++) {
            let vertices = sValuesStore.facesMatrix[i][j].map((vertex) =>
                sValuesStore.vertices.findIndex((v) => v === vertex)
            );
            facesMatrixWithIndices[i][j] = vertices;
            facesMatrixWithIndices[j][i] = vertices;
        }
    }

    return {
        faces_matrix: facesMatrixWithIndices,
        vertices: sValuesStore.vertices,
    };
};

const downloadFacesMatrix = () => {
    downloadjs(
        JSON.stringify(getFacesMatrixData()),
        "faces_matrix.json",
        "text/plain"
    );
};

const loadFacesMatrix = (event) => {
    const file = event.target[0].files[0];

    const reader = new FileReader();
    reader.onload = async function (e) {
        let contents = e.target.result;
        let data = JSON.parse(contents);
        await sValuesStore.buildFacesMatrix(data);
        selectedFile.value = null;
    };
    reader.readAsText(file);
};

const handleFileChange = (e) => {
    const file = e.target.files[0];
    selectedFile.value = file ? file.name : "";
};
</script>

<template>
    <div class="flex">
        <div class="faces-matrix subsection block">
            <h3>Матрица граней</h3>

            <button
                class="button"
                @click="copyToClipboard(JSON.stringify(getFacesMatrixData()))"
            >
                Копировать
            </button>

            <button class="button" @click="sValuesStore.extendFacesMatrix">
                Добавить грань
            </button>

            <div>
                <table class="matrix">
                    <tr v-for="(row, i) in sValuesStore.facesMatrix">
                        <td v-for="(cell, j) in row">
                            <input
                                class="face-input"
                                type="text"
                                v-model="sValuesStore.facesMatrixInput[i][j]"
                                @input="updateMatrix(i, j)"
                            />
                        </td>
                        <td>
                            <button
                                class="delete-face-button button"
                                @click="sValuesStore.deleteFace(i)"
                            >
                                Удалить грань
                            </button>
                        </td>
                    </tr>
                </table>
            </div>
        </div>

        <div class="vertices subsection block">
            <button class="button" @click="sValuesStore.addVertex({})">
                Добавить вершину
            </button>
            <ul class="vertices-list">
                <li
                    v-for="vertex in sValuesStore.vertices"
                    :key="vertex.id"
                    class="vertex block"
                >
                    <input
                        type="text"
                        v-model="vertex.label"
                        :name="`vertex-label-${vertex.id}`"
                        :id="`vertex-label-${vertex.id}`"
                    />

                    <div>
                        Тип вершины:
                        <div>
                            <label :for="`vertex-type-in-${vertex.id}`"
                                >Внутренняя</label
                            >
                            <input
                                type="radio"
                                :name="`vertex-type-in-${vertex.id}`"
                                value="in"
                                :id="`vertex-type-in-${vertex.id}`"
                                v-model="vertex.type"
                            />
                        </div>
                        <div>
                            <label :for="`vertex-type-mid-${vertex.id}`"
                                >Средняя</label
                            >
                            <input
                                type="radio"
                                :name="`vertex-type-mid-${vertex.id}`"
                                value="mid"
                                :id="`vertex-type-mid-${vertex.id}`"
                                v-model="vertex.type"
                            />
                        </div>
                    </div>

                    <button
                        class="button"
                        @click="sValuesStore.deleteVertex(vertex)"
                    >
                        Удалить вершину
                    </button>
                </li>
            </ul>
        </div>

        <div class="subsection block">
            <button class="button" @click="sValuesStore.findSValue()">
                Посчитать величины S
            </button>

            <Spinner v-if="sValuesStore.isLoading" />

            <div
                class="s-values-block block"
                v-else-if="sValuesStore.s.length > 0"
            >
                <p>Величины S</p>

                <button
                    @click="
                        downloadCSV(tableRows, tableColumns, 's_values.csv')
                    "
                    class="button"
                >
                    Скачать CSV
                </button>

                <DataTable :data="tableRows" class="matrix data-table">
                    <thead>
                        <tr>
                            <th v-for="columnName in tableColumns">
                                {{ columnName }}
                            </th>
                        </tr>
                    </thead>
                </DataTable>
            </div>
        </div>

        <div class="matrix-import-export subsection block">
            <h3>Импорт и экспорт матрицы граней</h3>

            <div class="actions">
                <button class="button" @click="downloadFacesMatrix()">
                    Экспортировать матрицу граней
                </button>

                <form
                    class="import-form"
                    action="#"
                    method="post"
                    @submit.prevent="loadFacesMatrix"
                >
                    <div class="file-input-container">
                        <label class="file-label" for="graph-input-file">
                            <span class="file-label-text">
                                Выберите JSON файл
                            </span>
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
                    <button class="button" type="submit">
                        Импортировать матрицу граней
                    </button>
                </form>
            </div>
        </div>
    </div>
</template>

<style scoped>
.flex {
    /* display: flex; */
    margin-bottom: 20px;
}
.subsection {
    width: 100%;
}
.vertices {
    margin-right: 20px;
}
.vertices-list {
    display: flex;
    flex-wrap: wrap;
}
.vertex {
    list-style-type: none;
}

.face-input {
    max-width: 180px;
}

.matrix-import-export {
    max-width: 500px;
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
