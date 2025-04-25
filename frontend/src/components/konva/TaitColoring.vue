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

            <DataTable
                :columns="detailRankDeterminantTableColumns"
                :data="detailRankDeterminantTable"
                class="matrix"
            />
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
const detailRankDeterminantTableColumns = computed(() => {
    const cols = [
        { data: "rank", title: "Ранг" },
        { data: "det", title: "Минор" },
        { data: "gaussSum", title: "Гауссова сумма" },
    ];
    for (let vertex of graphStore.vertices) {
        cols.push({ data: `vertex_${vertex.id}`, title: vertex.label });
    }

    return cols;
});
const detailRankDeterminantTable = computed(() => {
    const allSigma = generateAllSigma(graphStore.vertices.length);

    const table = [];
    for (let i = 0; i < allSigma.length; i++) {
        let rank = graphStore.coloring.taitAlphaDetail.rankList[i];
        let det = graphStore.coloring.taitAlphaDetail.determinantList[i];
        let val = {
            rank: rank,
            det: det,
            gaussSum: gaussSumString(rank, det, 1),
        };
        for (
            let vertexIndex = 0;
            vertexIndex < allSigma[i].length;
            vertexIndex++
        ) {
            let vertexId = graphStore.vertices[vertexIndex].id;
            val[`vertex_${vertexId}`] = allSigma[i][vertexIndex];
        }
        table.push(val);
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
        return `${numOfSums} &frasl; ${powerThree}`;
    }
    // if rank is odd
    if (numOfSums === 1) {
        numOfSums = "";
    } else if (numOfSums === -1) {
        numOfSums = "-";
    }

    if (powerThree == 1) {
        return `${numOfSums}i &radic; 3`;
    }
    return `${numOfSums}i &frasl; ${powerThree} &radic; 3`;
};

const sumTwoGaussianSums = (a, b) => {
    if (a.includes("i")) {
        return "0";
    }
    if (!a.includes("&frasl;")) {
        a = a + "&frasl; 1";
        return sumTwoGaussianSums(a, b);
    }
    if (!b.includes("&frasl;")) {
        b = b + "&frasl; 1";
        return sumTwoGaussianSums(a, b);
    }
    let frac1 = a.split("&frasl;");
    let frac2 = b.split("&frasl;");

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

    return `${newNominator} &frasl; ${newDenominator}`;
};

const calcGcd = function (a, b) {
    if (!b) {
        return a;
    }

    return calcGcd(b, a % b);
};
</script>

<style scoped>
span {
    font-weight: bold;
}
</style>
