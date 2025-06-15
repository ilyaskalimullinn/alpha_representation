<script setup>
import { useSValuesStore } from "@/stores/sValuesStore.js";
import { reactive, watchEffect, computed } from "vue";
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
        <div class="vertices">
            <p>Вершины</p>

            <button @click="sValuesStore.addVertex({})">
                Добавить вершину
            </button>
            <ul>
                <li v-for="vertex in sValuesStore.vertices" :key="vertex.id">
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

                    <button @click="sValuesStore.deleteVertex(vertex)">
                        Удалить вершину
                    </button>
                </li>
            </ul>
        </div>

        <div class="faces-matrix">
            <p>Матрица граней</p>

            <button @click="sValuesStore.extendFacesMatrix">
                Добавить грань
            </button>

            <div class="matrix">
                <table>
                    <tr v-for="(row, i) in sValuesStore.facesMatrix">
                        <td v-for="(cell, j) in row">
                            <input
                                type="text"
                                v-model="sValuesStore.facesMatrixInput[i][j]"
                                @input="updateMatrix(i, j)"
                            />
                        </td>
                        <td @click="sValuesStore.deleteFace(i)">
                            Удалить грань
                        </td>
                    </tr>
                </table>
            </div>
        </div>
    </div>

    <div>
        <button @click="sValuesStore.findSValue()">Посчитать величины S</button>

        <div class="s-values-block block" v-if="sValuesStore.s.length > 0">
            <p>Величины S</p>

            <button
                @click="downloadCSV(tableRows, tableColumns, 's_values.csv')"
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
</template>

<style scoped>
.flex {
    display: flex;
    margin-bottom: 20px;
}
.vertices {
    margin-right: 20px;
}
</style>
