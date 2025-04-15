class Vertex {
    constructor(label, x, y, konvaObject) {
        this.label = label;
        this.x = x;
        this.y = y;
        this.konvaObject = konvaObject;
    }
}

class Edge {
    constructor(startVertex, endVertex, konvaObject) {
        this.startVertex = startVertex;
        this.endVertex = endVertex;
        this.konvaObject = konvaObject;
    }
}

class Face {}

document.addEventListener("DOMContentLoaded", () => {
    // --- Konva Setup ---
    const graphContainer = document.getElementById("graphContainer");
    const width = graphContainer.offsetWidth;
    const height = graphContainer.offsetHeight;

    const adjacencyMatrixTable = document.getElementById(
        "adjacencyMatrixTable"
    );
    const buttonForAddEdge = document.getElementById("buttonForAddEdge");
    const formForAddVertex = document.getElementById("formForAddVertex");
    const inputForAddVertex = document.getElementById("inputForAddVertex");

    const stage = new Konva.Stage({
        container: "graphContainer",
        width: width,
        height: height,
    });

    const layer = new Konva.Layer();
    stage.add(layer);

    // --- Graph Data Structures ---
    let vertices = []; // Array to store vertex objects (with x, y, konva object)
    let edges = []; // Array to store edge objects (with start, end, konva object)
    let adjacencyMatrix = []; // 2D array representing connections
    let faces = [];

    // --- Modes ---
    let mode = "normal"; // 'normal', 'addEdgeStart', 'deleteVertex', 'deleteEdge', 'addFace'
    let edgeStartVertex = null; // Vertex where edge creation starts
    let selectedVertex = null; // Currently selected vertex (for deletion)
    let selectedEdge = null; // Currently selected edge (for deletion)

    // --- Vertex creation ---
    function addVertex(x, y, label) {
        const vertexCircle = new Konva.Circle({
            radius: 20,
            fill: "lightblue",
            stroke: "black",
            strokeWidth: 2,
        });
        const vertexText = new Konva.Text({
            text: label,
            width: 40,
            fontSize: 20,
        });
        const vertexGroup = new Konva.Group({ x: x, y: y, draggable: true });
        vertexGroup.add(vertexCircle);
        vertexGroup.add(vertexText);

        const vertex = new Vertex(label, x, y, vertexGroup);
        vertices.push(vertex);

        vertexGroup.on("dragmove", () => {
            updateVertexPosition(vertexGroup);
            updateEdges();
        });
        vertexGroup.on("click", () => {
            if (mode === "addEdgeStart") {
                if (edgeStartVertex) {
                    addEdge(edgeStartVertex, vertexGroup);
                    mode = "normal";
                    edgeStartVertex = null;
                    buttonForAddEdge.textContent = "Добавить ребро";
                } else {
                    edgeStartVertex = vertexGroup;
                    buttonForAddEdge.textContent = "Выберите вторую вершину";
                }
            }
        });

        layer.add(vertexGroup);
        layer.draw();
    }

    formForAddVertex.addEventListener("submit", (e) => {
        e.preventDefault();

        let vertexLabel = inputForAddVertex.value;
        if (!vertexLabel) {
            vertexLabel = inputForAddVertex.attributes.placeholder.value;
        }

        addVertex(width / 2, height / 2, vertexLabel);
        inputForAddVertex.setAttribute("placeholder", `${vertices.length + 1}`);
        inputForAddVertex.value = "";
        updateAdjacencyMatrix();
    });

    function updateVertexPosition(vertexGroup) {
        const vertex = vertices.find((v) => v.konvaObject === vertexGroup);
        if (vertex) {
            vertex.x = vertexGroup.x();
            vertex.y = vertexGroup.y();
        }
    }

    // --- Edge creation ---
    buttonForAddEdge.addEventListener("click", () => {
        if (mode === "normal") {
            mode = "addEdgeStart";
            buttonForAddEdge.textContent = "Выберите первую вершину";
        } else {
            mode = "normal";
            edgeStartVertex = null;
            buttonForAddEdge.textContent = "Добавить ребро";
        }
    });

    function addEdge(startVertexKonva, endVertexKonva) {
        const startVertex = vertices.find(
            (v) => v.konvaObject === startVertexKonva
        );
        const endVertex = vertices.find(
            (v) => v.konvaObject === endVertexKonva
        );

        if (!startVertex || !endVertex) {
            // Vertices must exist
            console.warn(
                "Something went wrong, can't find start or end vertex"
            );
            return;
        }
        const edgeLine = new Konva.Line({
            points: [startVertex.x, startVertex.y, endVertex.x, endVertex.y],
            stroke: "red",
            strokeWidth: 3,
            tension: 0.5, // For curved lines
        });
        const edge = new Edge(startVertex, endVertex, edgeLine);

        edges.push(edge);
        layer.add(edgeLine);
        edgeLine.moveToBottom(); // Keep edges behind vertices
        layer.draw();
        updateAdjacencyMatrix();
    }

    function updateEdges() {
        edges.forEach((edge) => {
            const start = vertices.find((v) => v === edge.startVertex);
            const end = vertices.find((v) => v === edge.endVertex);
            if (start && end) {
                edge.konvaObject.points([start.x, start.y, end.x, end.y]);
            }
        });
        layer.draw();
    }

    // --- Adjacency Matrix ---
    function updateAdjacencyMatrix() {
        adjacencyMatrix = []; // Reset matrix

        // Initialize matrix with 0s
        for (let i = 0; i < vertices.length; i++) {
            adjacencyMatrix[i] = new Array(vertices.length).fill(0);
        }

        // Populate matrix based on edges
        edges.forEach((edge) => {
            const start = vertices.findIndex((v) => v === edge.vertexStart);
            const end = vertices.findIndex((v) => v === edge.vertexEnd);
            if (start !== -1 && end !== -1) {
                adjacencyMatrix[start][end] = 1;
                adjacencyMatrix[end][start] = 1; // Assuming undirected graph
            }
        });

        displayAdjacencyMatrix();
    }

    function displayAdjacencyMatrix() {
        let matrixString = "";

        if (adjacencyMatrix.length > 0) {
            // first row is vertex labels
            const n = vertices.length;
            matrixString += "<tr>";
            matrixString += "<th>Метка вершины</th>";
            for (let i = 0; i < n; i++) {
                matrixString += `<th>${vertices[i].label}</th>`;
            }
            matrixString += "</tr>";

            for (let i = 0; i < n; i++) {
                matrixString += "<tr>";
                matrixString += `<td>${vertices[i].label}</td>`;
                for (let j = 0; j < n; j++) {
                    matrixString += `<td>${adjacencyMatrix[i][j]}</td>`;
                }
                matrixString += "</tr>";
            }
        } else {
            matrixString = "Empty";
        }
        adjacencyMatrixTable.innerHTML = matrixString;
    }
});
