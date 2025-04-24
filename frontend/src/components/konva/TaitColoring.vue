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
                    <td>{{ rank }}</td>
                    <td>
                        {{
                            graphStore.coloring.taitAlphaDetail.determinantList[
                                i
                            ]
                        }}
                    </td>
                    <td>?</td>

                    <td v-for="(vertex, vertex_ind) in graphStore.vertices">
                        {{ sigmaList[i][vertex_ind] }}
                    </td>
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
</script>
