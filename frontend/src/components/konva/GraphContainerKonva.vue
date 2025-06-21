<script setup>
import { useGraphStore } from "@/stores/graphStore";
import { storeToRefs } from "pinia";
import { defineProps, ref, watch, computed } from "vue";
import ColorPicker from "@/components/utils/ColorPicker.vue";

const props = defineProps({
    stageConfig: {
        type: Object,
        required: true,
        default: () => ({
            width: 800,
            height: 500,
            scaleY: -1,
        }),
        validator: (value) => {
            return (
                typeof value.width === "number" &&
                typeof value.height === "number" &&
                typeof value.scaleY === "number"
            );
        },
    },
});
const graphContainerWidth = `${props.stageConfig.width}px`;

const graphStore = useGraphStore();

graphStore.stageConfig.value = props.stageConfig.value;

const handleDrag = (vertex, event) => {
    vertex.x = event.target.x();
    vertex.y = event.target.y();
};

const contextMenu = ref({
    visible: false,
    x: 0,
    y: 0,
    vertex: null,
    edge: null,
});

const handleVertexRightClick = (vertex, event) => {
    event.evt.preventDefault();
    const pos = event.evt;

    contextMenu.value = {
        visible: true,
        x: pos.clientX,
        y: pos.clientY,
        vertex: vertex,
        edge: null,
    };
};

const handleEdgeRightClick = (edge, event) => {
    event.evt.preventDefault();
    const pos = event.evt;

    contextMenu.value = {
        visible: true,
        x: pos.clientX,
        y: pos.clientY,
        vertex: null,
        edge: edge,
    };
};

const handleStageRightClick = (event) => {
    event.evt.preventDefault();
    closeContextMenu();
    const pos = event.evt;
    contextMenu.value = {
        visible: true,
        x: pos.clientX,
        y: pos.clientY,
        vertex: null,
        edge: null,
    };
};

const deleteVertex = () => {
    if (contextMenu.value.vertex) {
        graphStore.deleteVertex(contextMenu.value.vertex);
    }
    closeContextMenu();
};

const deleteEdge = () => {
    if (contextMenu.value.edge) {
        graphStore.deleteEdge(contextMenu.value.edge);
    }
    closeContextMenu();
};

const closeContextMenu = () => {
    contextMenu.value.visible = false;
};

let newVertexLabel = ref(`${graphStore.vertices.length + 1}`);

const { vertices, faces } = storeToRefs(graphStore);
watch(
    vertices,
    (newValue) => {
        newVertexLabel.value = `${newValue.length + 1}`;
    },
    { deep: true }
);
const createVertex = () => {
    graphStore.addVertex({
        x: contextMenu.value.x,
        y: contextMenu.value.y * props.stageConfig.scaleY,
        label: newVertexLabel.value,
    });
    newVertexLabel.value = `${graphStore.vertices.length + 1}`;
};

let createEdgeVertex1 = ref(null);
let createEdgeVertex2 = ref(null);
const createEdge = () => {
    if (
        createEdgeVertex1.value === createEdgeVertex2.value ||
        createEdgeVertex1.value === null ||
        createEdgeVertex2.value === null
    ) {
        return;
    }

    let id1 = Math.min(createEdgeVertex1.value, createEdgeVertex2.value);
    let id2 = Math.max(createEdgeVertex1.value, createEdgeVertex2.value);

    if (graphStore.getEdgeIndex(id1, id2) !== -1) {
        return;
    }

    graphStore.addEdge({
        vertexId1: id1,
        vertexId2: id2,
    });
};

// Close menu when clicking outside
document.addEventListener("click", closeContextMenu);

// Make face labels visible
const faceLabelsVisible = ref(false);

// Make vertex labels visible
const vertexLabelsVisible = ref(true);

const faceLabelPositions = ref([]);
watch(faces, (newValue) => {
    faceLabelPositions.value = [];
    for (let face of newValue) {
        faceLabelPositions.value.push({
            x:
                face.vertices.map((v) => v.x).reduce((a, b) => a + b) /
                face.vertices.length,
            y:
                face.vertices.map((v) => v.y).reduce((a, b) => a + b) /
                face.vertices.length,
        });
    }
});

const setFaceActive = (face, active) => {
    face.active = active;
    for (let vertice of face.vertices) {
        vertice.active = active;
    }
    for (let edge of face.edges) {
        edge.active = active;
    }
};

const stageRef = ref(null);

const handleExport = () => {
    const dataURL = stageRef.value.getNode().toDataURL({
        pixelRatio: 2, // double resolution
    });

    const link = document.createElement("a");
    link.download = "graph.png";
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const selectedEdgeName = computed(() => {
    if (contextMenu.value.edge) {
        return (
            graphStore.getVertexById(contextMenu.value.edge.vertexId1).label +
            "—" +
            graphStore.getVertexById(contextMenu.value.edge.vertexId2).label
        );
    }
    return "";
});
</script>

<template>
    <div class="graph-container">
        <v-stage
            :config="stageConfig"
            @contextmenu.self="handleStageRightClick($event)"
            ref="stageRef"
        >
            <v-layer ref="layer">
                <v-line
                    v-for="edge in graphStore.edges"
                    :key="`edge_${edge.id}`"
                    :config="{
                        points: [
                            graphStore.getVertexById(edge.vertexId1).x,
                            graphStore.getVertexById(edge.vertexId1).y,
                            graphStore.getVertexById(edge.vertexId2).x,
                            graphStore.getVertexById(edge.vertexId2).y,
                        ],
                        stroke: edge.color,
                        strokeWidth: edge.active ? 10 : 5,
                        tension: 0.5,
                    }"
                    @mouseover="edge.active = true"
                    @mouseleave="edge.active = false"
                    @contextmenu="handleEdgeRightClick(edge, $event)"
                />
                <v-group
                    v-for="vertex in graphStore.vertices"
                    :key="`vertex_${vertex.id}`"
                    :config="{
                        x: vertex.x,
                        y: vertex.y,
                        draggable: true,
                    }"
                    @dragmove="handleDrag(vertex, $event)"
                    @mouseover="vertex.active = true"
                    @mouseleave="vertex.active = false"
                    @contextmenu="handleVertexRightClick(vertex, $event)"
                >
                    <v-circle
                        :config="{
                            radius: 20,
                            fill: vertex.color,
                            stroke: 'black',
                            strokeWidth: vertex.active ? 5 : 2,
                        }"
                    />
                    <v-text
                        v-if="vertexLabelsVisible"
                        :config="{
                            x: -10,
                            y: 5,
                            text: vertex.label,
                            fontSize: 15,
                            fill: 'black',
                            scaleY: stageConfig.scaleY,
                        }"
                    />
                </v-group>

                <v-group
                    v-for="(face, i) in graphStore.faces"
                    v-if="faceLabelsVisible"
                    :config="{
                        draggable: true,
                        ...faceLabelPositions[i],
                    }"
                    @mouseover="setFaceActive(face, true)"
                    @mouseleave="setFaceActive(face, false)"
                >
                    <v-rect
                        :config="{
                            width: 30,
                            height: 30,
                            fill: face.active ? 'orange' : 'lightgreen',
                            strokeWidth: face.active ? 2 : 1,
                        }"
                    />
                    <v-text
                        :config="{
                            x: 10,
                            y: 20,
                            text: `${i + 1}`,
                            scaleY: stageConfig.scaleY,
                            fontSize: 20,
                        }"
                    />
                </v-group>
            </v-layer>
        </v-stage>

        <!-- Context Menu -->
        <div
            v-if="contextMenu.visible"
            class="context-menu"
            :style="{
                left: `${contextMenu.x}px`,
                top: `${contextMenu.y}px`,
            }"
            @click.stop
        >
            <div class="context-menu-section" v-if="contextMenu.vertex">
                <ColorPicker
                    v-model="contextMenu.vertex.color"
                    :label="`Цвет вершины ${contextMenu.vertex.label}`"
                    :defaultColors="[
                        '#e6adad',
                        '#ade6b8',
                        '#add8e6',
                        '#dfe6ad',
                    ]"
                />

                <button class="button" @click="deleteVertex">
                    Удалить вершину {{ contextMenu.vertex.label }}
                </button>
            </div>

            <div class="context-menu-section" v-if="contextMenu.edge">
                <ColorPicker
                    v-model="contextMenu.edge.color"
                    :label="`Цвет ребра ${selectedEdgeName}`"
                />
                <button class="button" @click="deleteEdge">
                    Удалить ребро {{ selectedEdgeName }}
                </button>
            </div>

            <form
                action="#"
                class="create-vertex-form context-menu-section"
                @submit.prevent="createVertex()"
            >
                <label for="vertex-label-input">Добавить вершину</label>
                <input
                    type="text"
                    name="vertex-label"
                    id="vertex-label-input"
                    maxlength="3"
                    v-model="newVertexLabel"
                />
                <input type="submit" class="button" value="Добавить вершину" />
            </form>

            <form
                action="#"
                class="create-edge-form context-menu-section"
                @submit.prevent="createEdge()"
            >
                <div class="create-edge-vertex">
                    <label for="create-edge-vertex-1">Вершина 1</label>
                    <select
                        name="create-edge-vertex-1"
                        id="create-edge-vertex-1"
                        v-model="createEdgeVertex1"
                    >
                        <option
                            :value="vertex.id"
                            v-for="vertex in graphStore.vertices"
                            v-bind="vertex.id"
                        >
                            {{ vertex.label }}
                        </option>
                    </select>
                </div>

                <div class="create-edge-vertex">
                    <label for="create-edge-vertex-2">Вершина 2</label>
                    <select
                        name="create-edge-vertex-2"
                        id="create-edge-vertex-2"
                        v-model="createEdgeVertex2"
                    >
                        <option
                            :value="vertex.id"
                            v-for="vertex in graphStore.vertices"
                            v-bind="vertex.id"
                        >
                            {{ vertex.label }}
                        </option>
                    </select>
                </div>

                <input type="submit" class="button" value="Добавить ребро" />
            </form>

            <div class="context-menu-section">
                <label for="toggle-faces-visible-checkbox">
                    Метки граней
                    <input
                        type="checkbox"
                        name="toggle-faces-visible"
                        id="toggle-faces-visible-checkbox"
                        v-model="faceLabelsVisible"
                    />
                </label>
                <label for="toggle-vertex-visible-checkbox">
                    Метки вершин
                    <input
                        type="checkbox"
                        name="toggle-vertex-visible"
                        id="toggle-vertex-visible-checkbox"
                        v-model="vertexLabelsVisible"
                    />
                </label>
            </div>
        </div>
    </div>
    <button @click="handleExport()" class="button">Скачать изображение</button>
</template>

<style scoped>
.graph-container {
    border: 1px solid black;
    width: v-bind("graphContainerWidth");
}

.context-menu {
    position: absolute;
    z-index: 10;
    width: 300px;
    border: 1px solid black;
    background-color: rgb(235, 229, 246);
    padding: 5px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.context-menu-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 3px;
    border-bottom: 1px solid black;
    width: 100%;
}

.context-menu-section:last-child {
    border-bottom: 0;
}
</style>
