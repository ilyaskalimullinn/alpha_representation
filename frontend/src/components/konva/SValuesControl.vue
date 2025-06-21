<script setup>
import { computed } from "vue";
import { useSValuesStore } from "@/stores/sValuesStore.js";
import { copyToClipboard } from "@/services/utils";
import DataTable from "datatables.net-vue3";
import DataTablesCore from "datatables.net-dt";
import { generateAllSigma, downloadCSV, generateAllX } from "@/services/utils";

DataTable.use(DataTablesCore);

const sValuesStore = useSValuesStore();

function updateMatrix(i, j) {
    const raw = sValuesStore.facesMatrixInput[i][j];
    const parsed = raw
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

    // Update both [i][j] and [j][i] to maintain symmetry
    sValuesStore.facesMatrix[i][j] = parsed;

    if (i !== j) {
        sValuesStore.facesMatrix[j][i] = [...parsed];
        sValuesStore.facesMatrixInput[j][i] = parsed.join(", ");
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
</script>

<template>
    <div class="flex">
        <div class="faces-matrix block">
            <h3>Матрица граней</h3>

            <button
                class="button"
                @click="
                    copyToClipboard(
                        JSON.stringify({
                            faces_matrix: sValuesStore.facesMatrix,
                            vertices: sValuesStore.vertices,
                        })
                    )
                "
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

        <div class="vertices block">
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

        <div class="block">
            <button class="button" @click="sValuesStore.findSValue()">
                Посчитать величины S
            </button>

            <div class="s-values-block block" v-if="sValuesStore.s.length > 0">
                <p>Величины S</p>

                <button
                    @click="
                        downloadCSV(tableRows, tableColumns, 's_values.csv')
                    "
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
    </div>
</template>

<style scoped>
.flex {
    /* display: flex; */
    margin-bottom: 20px;
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
</style>
