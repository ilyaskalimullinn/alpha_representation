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
            <div class="block">
                <GraphContainerKonva />
            </div>
            <div class="block">
                <FacesControl />
            </div>
        </section>
        <section class="section">
            <div class="block">
                <AdjacencyMatrix />
            </div>
        </section>
        <section class="section">
            <div class="block">
                <FileControl />
            </div>
        </section>
        <section class="section">
            <div class="block">
                <TaitColoring />
            </div>
        </section>
    </main>
</template>

<style scoped>
.top {
    display: flex;
}
</style>
