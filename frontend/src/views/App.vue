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

        <h3>
            <a href="/s_values">Подсчет значений S</a>
        </h3>
        <main class="main">
            <section class="flex-section section">
                <div class="block">
                    <GraphContainerKonva />
                </div>
                <div class="faces-control block">
                    <FacesControl />
                </div>
            </section>
            <section class="flex-section section">
                <div class="adjacency-matrix block">
                    <AdjacencyMatrix />
                </div>
                <div class="file-control block">
                    <FileControl />
                </div>
            </section>
            <section class="section">
                <div class="block">
                    <TaitColoring />
                </div>
            </section>
        </main>
    </div>
</template>

<style scoped>
.section {
    width: 100%;
}
.flex-section {
    display: flex;
}
.faces-control,
.adjacency-matrix {
    flex: 1 1 0%;
}

.file-control {
    flex: 0 0 auto;
    min-width: 200px;
}
</style>
