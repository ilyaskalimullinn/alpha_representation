<template>
    <h3>Подсчет раскрасок Тейта</h3>

    <div class="chromatic block">
        <button @click="graphStore.calcTaitChromaticPolynomial()">
            Подсчет через хроматический многочлен
        </button>
        <p>
            Количество: <span>{{ graphStore.coloring.taitChromatic }}</span>
        </p>
    </div>

    <div class="heawood block">
        <button @click="graphStore.calcTaitHeawood()">
            Подсчет через подход Хивуда
        </button>
        <p>
            Количество:
            <span>{{ graphStore.coloring.heawood.configurations.length }}</span>
        </p>

        <div v-if="graphStore.coloring.heawood.configurations.length > 0">
            <button
                @click="downloadCSV(heawoodRows, heawoodColumns, 'heawood.csv')"
            >
                Скачать CSV
            </button>

            <DataTable :data="heawoodRows" class="matrix">
                <thead>
                    <tr>
                        <th v-for="columnName in heawoodColumns">
                            {{ columnName }}
                        </th>
                    </tr>
                </thead>
            </DataTable>
        </div>
    </div>

    <div class="alpha block">
        <form
            action="#"
            method="post"
            @submit.prevent="calcTaitAlphaRepresentation()"
        >
            <p>Подсчет через альфа представление</p>

            <p>
                <label for="alpha-representation-detail-checkbox"
                    >Подробно</label
                >
                <input
                    type="checkbox"
                    name="detail"
                    v-model="doFindDetails"
                    id="alpha-representation-detail-checkbox"
                />
            </p>

            <p>
                <label for="alpha-representation-fixed-checkbox"
                    >С фиксированными спинами</label
                >
                <input
                    type="checkbox"
                    name="fixed"
                    v-model="useFixedSpins"
                    id="alpha-representation-fixed-checkbox"
                />
            </p>

            <button type="submit">Посчитать</button>
        </form>

        <div
            class="detail block"
            v-if="
                graphStore.coloring.taitAlphaDetail.determinantList.length > 0
            "
        >
            <p>Подробные статистики</p>

            <p>
                Количество: <span>{{ graphStore.coloring.taitAlpha }}</span>
            </p>

            <button
                @click="
                    downloadCSV(
                        detailedTableRows,
                        detailedTableColumns,
                        'alpha_details.csv'
                    )
                "
            >
                Скачать CSV
            </button>

            <DataTable :data="detailedTableRows" class="matrix">
                <thead>
                    <tr>
                        <th v-for="columnName in detailedTableColumns">
                            {{ columnName }}
                        </th>
                    </tr>
                </thead>
            </DataTable>
        </div>

        <div
            class="no-detail block"
            v-if="
                Object.keys(graphStore.coloring.taitAlphaNoDetail.rankList)
                    .length > 0
            "
        >
            <p>Не подробные статистики</p>

            <p>
                Количество: <span>{{ graphStore.coloring.taitAlpha }}</span>
            </p>

            <p>
                Количество нулевых конфигураций (rank = 0, Gau = 1):
                <span>{{
                    graphStore.coloring.taitAlphaNoDetail.numZeroRanks
                }}</span>
            </p>

            <button
                @click="
                    downloadCSV(
                        noDetailsTableRows,
                        noDetailsTableColumns,
                        'alpha_no_details.csv'
                    )
                "
            >
                Скачать CSV
            </button>

            <DataTable :data="noDetailsTableRows" class="matrix data-table">
                <thead>
                    <tr>
                        <th v-for="columnName in noDetailsTableColumns">
                            {{ columnName }}
                        </th>
                    </tr>
                </thead>
            </DataTable>
        </div>

        <div
            class="fixed-block block"
            v-if="graphStore.coloringFixed.determinantList.length > 0"
        >
            <p>Статистики по фиксированным спинам</p>

            <p>
                Количество:
                <span>{{ graphStore.coloringFixed.taitAlpha }}</span>
            </p>

            <button
                @click="
                    downloadCSV(
                        fixedTableRows,
                        fixedTableColumns,
                        'alpha_fixed.csv'
                    )
                "
            >
                Скачать CSV
            </button>

            <DataTable :data="fixedTableRows" class="matrix">
                <thead>
                    <tr>
                        <th v-for="columnName in fixedTableColumns">
                            {{ columnName }}
                        </th>
                    </tr>
                </thead>
            </DataTable>
        </div>

        <div
            class="fixed-error-block block"
            v-if="graphStore.coloringFixed.error.augmentedMatrix.length > 0"
        >
            <p>Система не совместна</p>

            <p>
                Ранг основной матрицы:
                {{ graphStore.coloringFixed.error.baseRank }}
            </p>
            <p>
                Ранг расширенной матрицы:
                {{ graphStore.coloringFixed.error.augmentedMatrixRank }}
            </p>

            <p>Спины:</p>
            <ul>
                <li v-for="(vertex, i) in graphStore.freeVertices">
                    Вершина {{ vertex.label }}:
                    {{ graphStore.coloringFixed.error.sigmaFree[i] }}
                </li>
            </ul>

            <p>Расширенная матрица:</p>

            <DataTable
                :data="graphStore.coloringFixed.error.augmentedMatrix"
                class="matrix"
            >
                <thead>
                    <tr>
                        <th
                            v-for="columnName in fixedErrorTableColumns"
                            :key="columnName"
                        >
                            {{ columnName }}
                        </th>
                    </tr>
                </thead>
            </DataTable>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useGraphStore } from "@/stores/graphStore";
import DataTable from "datatables.net-vue3";
import DataTablesCore from "datatables.net-dt";
import { generateAllSigma, downloadCSV } from "@/services/utils";

DataTable.use(DataTablesCore);

const graphStore = useGraphStore();

const doFindDetails = ref(false);
const useFixedSpins = ref(false);

const detailedTableColumns = computed(() => {
    return [
        "Ранг",
        "Минор",
        "Гауссова сумма",
        ...graphStore.vertices.map((v) => v.label),
    ];
});
const detailedTableRows = computed(() => {
    const allSigma = generateAllSigma(graphStore.vertices.length);

    const table = [];
    for (let i = 0; i < allSigma.length; i++) {
        let row = [
            graphStore.coloring.taitAlphaDetail.rankList[i],
            graphStore.coloring.taitAlphaDetail.determinantList[i],
            graphStore.coloring.taitAlphaDetail.gaussSumList[i],
            ...allSigma[i],
        ];
        table.push(row);
    }
    return table;
});

const noDetailsTableColumns = [
    "Ранг матрицы",
    "Значение минора",
    "Количество примеров",
    "Гауссова сумма в этом случае",
    "Сумма гауссовых сумм",
];

const noDetailsTableRows = computed(() => {
    const rows = [];
    for (
        let i = 0;
        i < graphStore.coloring.taitAlphaNoDetail.rankList.length;
        i++
    ) {
        rows.push([
            graphStore.coloring.taitAlphaNoDetail.rankList[i],
            graphStore.coloring.taitAlphaNoDetail.determinantList[i],
            graphStore.coloring.taitAlphaNoDetail.numOfOccurances[i],
            graphStore.coloring.taitAlphaNoDetail.gaussSumList[i],
            graphStore.coloring.taitAlphaNoDetail.totalGaussSumList[i],
        ]);
    }
    return rows;
});

const fixedTableColumns = computed(() => {
    const vertexLabels = graphStore.freeVertices.map((v) => v.label);
    return [
        "Ранг",
        "Минор",
        "Гауссова сумма",
        "det M[l]",
        "\\chi",
        "Полное слагаемое",
        ...vertexLabels,
    ];
});
const fixedTableRows = computed(() => {
    const n = Math.round(Math.log2(graphStore.coloringFixed.rankList.length));
    const allSigma = generateAllSigma(n);

    const table = [];
    for (let i = 0; i < allSigma.length; i++) {
        let row = [
            graphStore.coloringFixed.rankList[i],
            graphStore.coloringFixed.determinantList[i],
            graphStore.coloringFixed.gaussSumList[i],
            graphStore.coloringFixed.borderedDeterminantList[i],
            graphStore.coloringFixed.chiList[i],
            graphStore.coloringFixed.termList[i],
            ...allSigma[i],
        ];
        table.push(row);
    }
    return table;
});

const fixedErrorTableColumns = computed(() => {
    const cols = [];
    for (let i = 1; i <= graphStore.faces.length; i++) {
        cols.push(`Грань ${i}`);
    }
    cols.push("l_fix");
    return cols;
});

const calcTaitAlphaRepresentation = () => {
    if (useFixedSpins.value && !doFindDetails.value) {
        alert(
            "Для фиксированных спинов можно считать лишь подробные статистики"
        );
        return;
    }

    if (useFixedSpins.value) {
        if (graphStore.fixedVertices.length === 0) {
            alert("Укажите хотя бы один зафиксированный спин");
            return;
        }
        graphStore.calcTaitAlphaRepresentationFixed();
    } else {
        graphStore.calcTaitAlphaRepresentation(doFindDetails.value);
    }
};

const heawoodRows = computed(() => {
    return graphStore.coloring.heawood.configurations;
});

const heawoodColumns = computed(() => {
    return graphStore.vertices.map((v) => v.label);
});
</script>

<style scoped>
span {
    font-weight: bold;
}
</style>
