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

            <table class="matrix">
                <tr>
                    <th>Строка</th>
                    <th>Ранг минора</th>
                    <th>Значение минора</th>
                    <th>Гауссова сумма</th>

                    <!-- all sigmas (for every vertex) -->
                    <th
                        v-for="vertex in graphStore.vertices"
                        :key="`vertex_th_${vertex.id}`"
                    >
                        {{ vertex.label }}
                    </th>
                </tr>

                <tr
                    v-for="(rank, i) in graphStore.coloring.taitAlphaDetail
                        .rankList"
                >
                    <td>{{ i }}</td>
                    <td>{{ rank }}</td>
                    <td>
                        {{
                            graphStore.coloring.taitAlphaDetail.determinantList[
                                i
                            ]
                        }}
                    </td>
                    <td
                        v-html="
                            gaussSumString(
                                rank,
                                graphStore.coloring.taitAlphaDetail
                                    .determinantList[i],
                                1
                            )
                        "
                    ></td>

                    <td v-for="(vertex, vertex_ind) in graphStore.vertices">
                        {{ sigmaList[i][vertex_ind] }}
                    </td>
                </tr>
            </table>
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
            <table class="matrix">
                <tr>
                    <th>Ранг</th>
                    <th>det = -1</th>
                    <th>det = +1</th>
                    <th>Gau(rank, det=-1)</th>
                    <th>Gau(rank, det=+1)</th>
                    <th>Total Gau(rank, det=-1)</th>
                    <th>Total Gau(rank, det=+1)</th>
                    <th>Total row sum</th>
                </tr>

                <tr v-for="value in noDetailRankDeterminantTable">
                    <td>{{ value.rank }}</td>
                    <td>{{ value.numDetNegative }}</td>
                    <td>{{ value.numDetPositive }}</td>
                    <td v-html="value.gaussSumNegative"></td>
                    <td v-html="value.gaussSumPositive"></td>
                    <td v-html="value.gaussSumNegativeTotal"></td>
                    <td v-html="value.gaussSumPositiveTotal"></td>
                    <td v-html="value.rowSum"></td>
                </tr>
            </table>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useGraphStore } from "@/stores/graphStore";

const graphStore = useGraphStore();

const alphaDetail = ref(false);

const sigmaList = computed(() => {
    return generateAllSigma(graphStore.vertices.length);
});

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
        let val = {
            rank: rank,
            numDetNegative:
                graphStore.coloring.taitAlphaNoDetail.rankAndDeterminantCounts[
                    rank
                ][0],
            numDetPositive:
                graphStore.coloring.taitAlphaNoDetail.rankAndDeterminantCounts[
                    rank
                ][1],
            gaussSumNegative: gaussSumString(rank, -1, 1),
            gaussSumPositive: gaussSumString(rank, 1, 1),
        };
        val.gaussSumNegativeTotal = gaussSumString(
            rank,
            -1,
            val.numDetNegative
        );
        val.gaussSumPositiveTotal = gaussSumString(rank, 1, val.numDetPositive);
        val.rowSum = sumTwoGaussianSums(
            val.gaussSumNegativeTotal,
            val.gaussSumPositiveTotal
        );
        table.push(val);
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
    if (powerThree == 1) {
        return `${numOfSums}i`;
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

    return `${newNominator}&frasl;${newDenominator}`;
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
