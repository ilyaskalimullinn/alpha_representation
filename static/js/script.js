class Vertex {
    constructor(label, x, y, konvaObject) {
        this.label = label;
        this.x = x;
        this.y = y;
        this.konvaObject = konvaObject;
    }
}

class Edge {}

class Face {}

document.addEventListener("DOMContentLoaded", () => {
    // --- Konva Setup ---
    const graphContainer = document.getElementById("graph_container");
    const width = graphContainer.offsetWidth;
    const height = graphContainer.offsetHeight;

    const adjacencyMatrixTable = document.getElementById("adjacency_matrix");

    const stage = new Konva.Stage({
        container: "graph_container",
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

    function addVertex(x, y, label) {
        const vertexCircle = new Konva.Circle({
            x: x,
            y: y,
            radius: 20,
            fill: "lightblue",
            stroke: "black",
            strokeWidth: 2,
        });
        const vertexText = new Konva.Text({
            x: x - 7,
            y: y - 7,
            text: label,
            width: 40,
            fontSize: 20,
        });
        const vertexGroup = new Konva.Group({ draggable: true });
        vertexGroup.add(vertexCircle);
        vertexGroup.add(vertexText);

        const vertex = new Vertex(label, x, y, vertexGroup);
        vertices.push(vertex);

        vertexGroup.on("dragmove", () => {
            updateVertexPosition(vertexGroup);
        });
        vertexGroup.on("click", () => {
            // do something, e.g. deleting vertex or adding edge
        });

        layer.add(vertexGroup);
        layer.draw();
    }

    const formForAddVertex = document.getElementById("formForAddVertex");
    const inputForAddVertex = document.getElementById("inputForAddVertex");
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
            const end = vertices.findIndex((v) => v === edge.vertexStart);
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
