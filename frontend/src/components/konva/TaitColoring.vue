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

    <div class="alpha block">
        <form
            action="#"
            method="post"
            @submit.prevent="
                graphStore.calcTaitAlphaRepresentation(alphaDetail)
            "
        >
            <p>Подсчет через альфа представление</p>
            <label for="alpha-representation-detail-checkbox">Подробно</label>
            <input
                type="checkbox"
                name="detail"
                v-model="alphaDetail"
                id="alpha-representation-detail-checkbox"
            />
            <button type="submit">Подсчитать</button>
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
    </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useGraphStore } from "@/stores/graphStore";
import DataTable from "datatables.net-vue3";
import DataTablesCore from "datatables.net-dt";
import { unparse } from "papaparse";

DataTable.use(DataTablesCore);

const graphStore = useGraphStore();

const alphaDetail = ref(false);

const generateAllSigma = (n) => {
    const total = Math.pow(2, n);
    const result = [];

    for (let i = 0; i < total; i++) {
        const combination = [];
        for (let j = n - 1; j >= 0; j--) {
            // Changed to decrement
            // Check each bit position (right to left)
            combination.push(i & (1 << j) ? 1 : -1);
        }
        result.push(combination);
    }

    return result;
};
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

const downloadCSV = (data, columns, filename) => {
    // Convert data to CSV format

    let csv =
        unparse({ fields: columns, data: [] }) +
        unparse(data, { header: false });

    // Create a download link
    const link = document.createElement("a");
    link.setAttribute(
        "href",
        "data:text/csv;charset=utf-8," + encodeURIComponent(csv)
    );
    link.setAttribute("download", filename); // Set the filename

    // Programmatically trigger the download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link); // Clean up
};
</script>

<style scoped>
span {
    font-weight: bold;
}
</style>
