<script setup>
import GraphContainerKonva from "@/components/konva/GraphContainerKonva.vue";
import AdjacencyMatrix from "@/components/konva/AdjacencyMatrix.vue";
import FacesControl from "@/components/konva/FacesControl.vue";
</script>

<template>
    <div class="container">
        <h1>Раскраски Тейта</h1>
    </div>
    <main class="main">
        <section class="section">
            <GraphContainerKonva />
        </section>
        <section class="section">
            <AdjacencyMatrix />
        </section>
        <section class="section">
            <FacesControl />
        </section>
    </main>
</template>
