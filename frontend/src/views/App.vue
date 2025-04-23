<script setup>
import GraphContainerKonva from "@/components/konva/GraphContainerKonva.vue";
import AdjacencyMatrix from "@/components/konva/AdjacencyMatrix.vue";
import FacesControl from "@/components/konva/FacesControl.vue";
import FileControl from "@/components/konva/FileControl.vue";
import TaitColoring from "@/components/konva/TaitColoring.vue";
</script>

<template>
    <div class="container">
        <h1>Раскраски Тейта</h1>
    </div>
    <main class="main">
        <section class="section top">
            <GraphContainerKonva />
            <div>
                <FacesControl />
            </div>
        </section>
        <section class="section">
            <AdjacencyMatrix />
        </section>
        <section class="section">
            <FileControl />
        </section>
        <section class="section">
            <TaitColoring />
        </section>
    </main>
</template>

<style scoped>
.top {
    display: flex;
}
</style>
