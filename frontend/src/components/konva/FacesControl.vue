<template>
    <button @click="graphStore.findFacesMatrix()" class="button">
        Найти матрицу граней для графа
    </button>
    <button @click="graphStore.findFaces()" class="button">
        Найти грани в графе
    </button>

    <h3>Матрица граней</h3>
    <button
        @click="copyToClipboard(JSON.stringify(getFacesMatrixData()))"
        v-if="graphStore.facesMatrixWithFreeSpins.length > 0"
        class="button"
    >
        Копировать
    </button>

    <button
        @click="
            downloadjs(
                JSON.stringify(getFacesMatrixData()),
                'faces_matrix.json',
                'text/plain'
            )
        "
        v-if="graphStore.facesMatrixWithFreeSpins.length > 0"
        class="button"
    >
        Скачать JSON
    </button>

    <div class="matrix-container">
        <table
            v-if="graphStore.facesMatrixWithFreeSpins.length > 0"
            class="faces-matrix matrix"
        >
            <tr>
                <th>Грань</th>

                <th
                    v-for="(face, i) in graphStore.faces"
                    :key="`face_${face.id}`"
                    @mouseover="setFaceActive(face, true)"
                    @mouseleave="setFaceActive(face, false)"
                >
                    {{ i + 1 }}
                </th>
            </tr>

            <tr
                v-for="(row, i) in graphStore.facesMatrixWithFreeSpins"
                :key="`faces_matrix_i_${i}`"
            >
                <th
                    @mouseover="setFaceActive(graphStore.faces[i], true)"
                    @mouseleave="setFaceActive(graphStore.faces[i], false)"
                >
                    {{ i + 1 }}
                </th>

                <td
                    v-for="(elem, j) in row"
                    @mouseover="
                        setFaceActive(graphStore.faces[i], true);
                        setFaceActive(graphStore.faces[j], true);
                    "
                    @mouseleave="
                        setFaceActive(graphStore.faces[i], false);
                        setFaceActive(graphStore.faces[j], false);
                    "
                >
                    {{
                        elem
                            .map((i) => graphStore.vertices[i].label)
                            .join("+") || "0"
                    }}
                </td>
            </tr>
        </table>

        <table v-if="graphStore.lFixed.length > 0" class="l_fix matrix">
            <tr>
                <th>l_fixed</th>
            </tr>
            <tr v-for="elem in graphStore.lFixed">
                <td>{{ elem }}</td>
            </tr>
        </table>
    </div>

    <h3>Список граней</h3>
    <draggable
        v-model="graphStore.faces"
        item-key="id"
        tag="ol"
        v-if="graphStore.faces.length > 0"
        @end="graphStore.findFacesMatrix()"
    >
        <template #item="{ element, index }">
            <li
                @mouseover="setFaceActive(element, true)"
                @mouseleave="setFaceActive(element, false)"
                class="graph-face"
            >
                {{ element.vertices.map((v) => v.label).join(", ") }}
            </li>
        </template>
    </draggable>
</template>

<script setup>
import { useGraphStore } from "@/stores/graphStore";
import { copyToClipboard } from "@/services/utils";
import draggable from "vuedraggable";
import downloadjs from "downloadjs";

const graphStore = useGraphStore();

const setFaceActive = (face, active) => {
    face.active = active;
    for (let vertice of face.vertices) {
        vertice.active = active;
    }
    for (let edge of face.edges) {
        edge.active = active;
    }
};

const getFacesMatrixData = () => {
    const data = {
        faces_matrix: graphStore.facesMatrix,
        vertices: graphStore.vertices.map((v) => {
            return {
                id: v.id,
                label: v.label,
                fixedSpin: v.fixedSpin,
            };
        }),
    };

    if (graphStore.fixedVertices.length > 0) {
        data.l_fixed = graphStore.lFixed;
    }

    return data;
};
</script>

<style scoped>
.graph-face:hover {
    cursor: pointer;
    background-color: lightgrey;
    transition: 0.2s;
}

.matrix-container {
    display: flex;
    flex-direction: row;
}

.faces-matrix td {
    padding: 3px;
}

.l_fix {
    margin-left: 10px;
}
</style>
