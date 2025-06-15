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
                        detailRankDeterminantTable,
                        detailRankDeterminantTableColumns.map(
                            (item) => item.title
                        ),
                        'alpha_details.csv'
                    )
                "
            >
                Скачать CSV
            </button>

            <!-- <DataTable
                :columns="detailRankDeterminantTableColumns"
                :data="detailRankDeterminantTable"
                class="matrix"
            /> -->

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
                Object.keys(
                    graphStore.coloring.taitAlphaNoDetail
                        .rankAndDeterminantCounts
                ).length > 0
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
                        noDetailRankDeterminantTable,
                        noDetailRankDeterminantTableColumns.map(
                            (item) => item.title
                        ),
                        'alpha_no_details.csv'
                    )
                "
            >
                Скачать CSV
            </button>

            <DataTable
                :columns="noDetailRankDeterminantTableColumns"
                :data="noDetailRankDeterminantTable"
                class="matrix data-table"
            />
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

const noDetailRankDeterminantTableColumns = [
    { data: "rank", title: "Ранг матрицы" },
    { data: "det", title: "Значение минора" },
    { data: "numExamples", title: "Количество примеров" },
    { data: "gaussSum", title: "Гауссова сумма в этом случае" },
    { data: "gaussSumTotal", title: "Сумма гауссовых сумм" },
];

const noDetailRankDeterminantTable = computed(() => {
    const arrayOfRanks = Object.keys(
        graphStore.coloring.taitAlphaNoDetail.rankAndDeterminantCounts
    );
    arrayOfRanks.sort((rank1, rank2) => {
        const isEven1 = rank1 % 2 === 0;
        const isEven2 = rank2 % 2 === 0;

        // if both are even or both are odd, just compare
        if (isEven1 === isEven2) {
            return rank1 - rank2;
        }

        // if first is even, second is odd
        if (isEven1) {
            return -1;
        }

        // if first is odd, second is even
        return 1;
    });

    const table = [];
    for (let rank of arrayOfRanks) {
        for (let det of [-1, 1]) {
            let ind = det === 1 ? 1 : 0;
            let numExamples =
                graphStore.coloring.taitAlphaNoDetail.rankAndDeterminantCounts[
                    rank
                ][ind];
            let val = {
                rank: rank,
                det: det,
                numExamples: numExamples,
                gaussSum: gaussSumString(rank, det, 1),
                gaussSumTotal: gaussSumString(rank, det, numExamples),
            };
            table.push(val);
        }
    }

    return table;
});

const gaussSumString = (rank, det, numOfSums) => {
    if (rank == 0) {
        return "1";
    }

    // we need to get (-1/3)^(r/2)
    let rank_half = Math.floor(rank / 2);

    let plusOrMinusOne = rank_half % 2 == 0 ? 1 : -1;
    plusOrMinusOne = plusOrMinusOne * det;

    let powerThree = Math.pow(3, rank_half);

    let gcd = calcGcd(numOfSums, powerThree);

    numOfSums = (numOfSums / gcd) * plusOrMinusOne;
    powerThree = powerThree / gcd;

    // if rank is even
    if (rank % 2 == 0) {
        if (powerThree == 1) {
            return `${numOfSums}`;
        }
        return `${numOfSums} / ${powerThree}`;
    }
    // if rank is odd
    if (numOfSums === 1) {
        numOfSums = "";
    } else if (numOfSums === -1) {
        numOfSums = "-";
    }

    if (powerThree == 1) {
        return `${numOfSums}i sqrt(3)`;
    }
    return `${numOfSums}i / ${powerThree} sqrt(3)`;
};

const sumTwoGaussianSums = (a, b) => {
    if (a.includes("i")) {
        return "0";
    }
    if (!a.includes("/")) {
        a = a + "/ 1";
        return sumTwoGaussianSums(a, b);
    }
    if (!b.includes("/")) {
        b = b + "'' 1";
        return sumTwoGaussianSums(a, b);
    }
    let frac1 = a.split("/");
    let frac2 = b.split("/");

    frac1[0] = parseInt(frac1[0]);
    frac1[1] = parseInt(frac1[1]);
    frac2[0] = parseInt(frac2[0]);
    frac2[1] = parseInt(frac2[1]);

    let newDenominator = frac1[1] * frac2[1];
    let newNominator = frac1[0] * frac2[1] + frac2[0] * frac1[1];

    let gcd = calcGcd(newNominator, newDenominator);
    newNominator /= gcd;
    newDenominator /= gcd;

    if (newDenominator === 1) {
        return `${newNominator}`;
    }

    return `${newNominator} / ${newDenominator}`;
};

const calcGcd = function (a, b) {
    if (!b) {
        return a;
    }

    return calcGcd(b, a % b);
};

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
