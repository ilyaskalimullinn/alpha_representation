<template>
    <h3>Подсчет раскрасок Тейта</h3>

    <div class="chromatic">
        <button @click="graphStore.calcTaitChromaticPolynomial()">
            Подсчет через хроматический многочлен
        </button>
        <p>
            Количество: <span>{{ graphStore.coloring.taitChromatic }}</span>
        </p>
    </div>
</template>

<script setup>
import { ref } from "vue";
import { useGraphStore } from "@/stores/graphStore";

const graphStore = useGraphStore();
</script>
