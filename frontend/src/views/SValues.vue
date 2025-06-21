<script setup>
import SValuesControl from "@/components/konva/SValuesControl.vue";
</script>

<template>
    <div class="container">
        <h1>Величины S</h1>
        <h3>
            <a href="/">Редактор графов</a>
        </h3>
        <main class="main">
            <section class="section">
                <SValuesControl />
            </section>
        </main>
    </div>
</template>

<style scoped>
.top {
    display: flex;
}
</style>
