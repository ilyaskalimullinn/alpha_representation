<script setup>
import { useGraphStore } from "@/stores/graphStore";
import { defineProps, ref } from "vue";

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

const handleDrag = (vertex, event) => {
    vertex.x = event.target.x();
    vertex.y = event.target.y();
};

const updateStrokeWidth = (event, strokeWidth) => {
    event.target.strokeWidth(strokeWidth);
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

// Close menu when clicking outside
document.addEventListener("click", closeContextMenu);
</script>

<template>
    <div class="graphContainer">
        <v-stage :config="stageConfig">
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
                        stroke: 'red',
                        strokeWidth: 3,
                        tension: 0.5,
                    }"
                    @mouseover="updateStrokeWidth($event, 5)"
                    @mouseleave="updateStrokeWidth($event, 3)"
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
                    @mouseover="updateStrokeWidth($event, 4)"
                    @mouseleave="updateStrokeWidth($event, 2)"
                    @contextmenu="handleVertexRightClick(vertex, $event)"
                >
                    <v-circle
                        :config="{
                            radius: 20,
                            fill: 'lightblue',
                            stroke: 'blue',
                            strokeWidth: 2,
                        }"
                    />
                    <v-text
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
            </v-layer>
        </v-stage>

        <!-- Context Menu -->
        <div
            v-if="contextMenu.visible"
            class="contextMenu"
            :style="{
                left: `${contextMenu.x}px`,
                top: `${contextMenu.y}px`,
            }"
            @click.stop
        >
            <button
                v-if="contextMenu.vertex"
                class="menu-item"
                @click="deleteVertex"
            >
                Удалить вершину {{ contextMenu.vertex.label }}
            </button>

            <button
                v-if="contextMenu.edge"
                class="menu-item"
                @click="deleteEdge"
            >
                Удалить ребро
                {{ graphStore.getVertexById(contextMenu.edge.vertexId1).label }}
                -
                {{ graphStore.getVertexById(contextMenu.edge.vertexId2).label }}
            </button>
        </div>
    </div>
</template>

<style scoped>
.graphContainer {
    border: 1px solid black;
    width: v-bind("graphContainerWidth");
}

.contextMenu {
    position: absolute;
    z-index: 10;
    width: 200px;
    border: 1px solid black;
    background-color: rgb(186, 186, 186);
    padding: 5px;
}
</style>
