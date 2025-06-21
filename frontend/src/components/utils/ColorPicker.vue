<template>
    <div class="color-picker">
        <label for="color-picker">{{ label }}</label>
        <input
            type="color"
            :value="modelValue"
            @input="$emit('update:modelValue', $event.target.value)"
            id="color-picker"
        />

        <div class="default-colors">
            <div
                v-for="color in defaultColors"
                :key="color"
                class="default-color"
                :style="{ backgroundColor: color }"
                @click="$emit('update:modelValue', color)"
                :class="{ active: modelValue === color }"
                :title="color"
            ></div>
        </div>
    </div>
</template>

<script setup>
import { defineProps, defineEmits } from "vue";

const props = defineProps({
    modelValue: {
        type: String,
        required: true,
    },
    defaultColors: {
        type: Array,
        default: () => ["#ff0000", "#00ff00", "#0000ff"], // Red, Green, Blue
    },
    label: {
        type: String,
        default: "",
    },
});

const emit = defineEmits(["update:modelValue"]);
</script>

<style scoped>
input[type="color"] {
    width: 100%;
    height: 40px;
    margin-bottom: 15px;
    cursor: pointer;
}

.default-colors {
    display: flex;
    justify-content: space-between;
    margin-bottom: 15px;
}

.default-color {
    width: 50px;
    height: 50px;
    border-radius: 5px;
    cursor: pointer;
    border: 2px solid transparent;
    transition: transform 0.2s, border-color 0.2s;
}

.default-color:hover {
    transform: scale(1.05);
}

.default-color.active {
    border-color: #333;
}
</style>
