<script setup>
import { useSValuesStore } from "@/stores/sValuesStore.js";

const sValuesStore = useSValuesStore();

const deleteVertex = (vertex) => {
    sValuesStore.vertices.pop(vertex);
};
</script>

<template>
    <div class="vertices">
        <p>Вершины</p>

        <ul>
            <li v-for="vertex in sValuesStore.vertices" :key="vertex.id">
                <input
                    type="text"
                    v-model="vertex.label"
                    :name="`vertex-label-${vertex.id}`"
                    :id="`vertex-label-${vertex.id}`"
                />

                <div>
                    Тип вершины:
                    <div>
                        <label :for="`vertex-type-in-${vertex.id}`"
                            >Внутренняя</label
                        >
                        <input
                            type="radio"
                            :name="`vertex-type-in-${vertex.id}`"
                            value="in"
                            :id="`vertex-type-in-${vertex.id}`"
                            v-model="vertex.type"
                        />
                    </div>
                    <div>
                        <label :for="`vertex-type-mid-${vertex.id}`"
                            >Средняя</label
                        >
                        <input
                            type="radio"
                            :name="`vertex-type-mid-${vertex.id}`"
                            value="mid"
                            :id="`vertex-type-mid-${vertex.id}`"
                            v-model="vertex.type"
                        />
                    </div>
                </div>

                <button @click="sValuesStore.deleteVertex(vertex)">
                    Удалить вершину
                </button>
            </li>
        </ul>

        <button @click="sValuesStore.addVertex({})">Добавить вершину</button>
    </div>
</template>
