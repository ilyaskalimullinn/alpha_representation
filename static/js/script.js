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

class Face {
    constructor(vertices, edges, label) {
        this.vertices = vertices;
        this.edges = edges;
        this.label = label;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // --- Konva Setup ---
    const graphContainer = document.getElementById("graphContainer");
    const width = graphContainer.offsetWidth;
    const height = graphContainer.offsetHeight;

    const adjacencyMatrixTable = document.getElementById(
        "adjacencyMatrixTable"
    );
    const buttonForAddEdge = document.getElementById("buttonForAddEdge");
    const buttonForDeleteEdge = document.getElementById("buttonForDeleteEdge");
    const buttonForDeleteVertex = document.getElementById(
        "buttonForDeleteVertex"
    );
    const formForAddVertex = document.getElementById("formForAddVertex");
    const inputForAddVertex = document.getElementById("inputForAddVertex");
    const buttonForFindingFaces = document.getElementById(
        "buttonForFindingFaces"
    );
    const facesListUl = document.getElementById("facesListUl");

    const buttonForGraphExport = document.getElementById(
        "buttonForGraphExport"
    );
    const formForGraphImport = document.getElementById("formForGraphImport");
    const inputForGraphImport = document.getElementById("inputForGraphImport");

    const stage = new Konva.Stage({
        container: "graphContainer",
        width: width,
        height: height,
        y: height,
        scaleY: -1,
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
            scaleY: -1,
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
            } else if (mode === "deleteVertex") {
                deleteVertex(vertexGroup);
                mode = "normal";
                buttonForDeleteVertex.textContent = "Удалить вершину";
            }
        });
        vertexGroup.on("mouseover", function () {
            document.body.style.cursor = "pointer";
            this.children[0].strokeWidth(4);
        });
        vertexGroup.on("mouseout", function () {
            document.body.style.cursor = "default";
            this.children[0].strokeWidth(2);
        });

        layer.add(vertexGroup);
        layer.draw();
        inputForAddVertex.setAttribute("placeholder", `${vertices.length + 1}`);
        inputForAddVertex.value = "";
        updateAdjacencyMatrix();
        updateFaces([]);
    }

    formForAddVertex.addEventListener("submit", (e) => {
        e.preventDefault();

        let vertexLabel = inputForAddVertex.value;
        if (!vertexLabel) {
            vertexLabel = inputForAddVertex.attributes.placeholder.value;
        }

        addVertex(width / 2, height / 2, vertexLabel);
    });

    function updateVertexPosition(vertexGroup) {
        const vertex = vertices.find((v) => v.konvaObject === vertexGroup);
        if (vertex) {
            vertex.x = vertexGroup.x();
            vertex.y = vertexGroup.y();
        }
    }

    // --- Delete Vertex ---

    buttonForDeleteVertex.addEventListener("click", () => {
        if (mode === "normal") {
            mode = "deleteVertex";
            buttonForDeleteVertex.textContent =
                "Нажмите на вершину, которую хотите удалить";
        } else {
            mode = "normal";
            buttonForDeleteVertex.textContent = "Удалить вершину";
        }
    });

    function deleteVertex(vertexGroup) {
        const vertexIndex = vertices.findIndex(
            (v) => v.konvaObject === vertexGroup
        );
        if (vertexIndex === -1) {
            console.warn("Could not find vertex");
            return;
        }
        const vertex = vertices[vertexIndex];

        // Remove edges connected to the vertex
        edges = edges.filter((edgeData) => {
            if (
                edgeData.startVertex === vertex ||
                edgeData.endVertex === vertex
            ) {
                edgeData.konvaObject.destroy(); // Remove Konva object
                return false; // Filter out this edge
            }
            return true;
        });

        // Remove vertex
        vertex.konvaObject.destroy();
        vertices.splice(vertexIndex, 1);

        updateAdjacencyMatrix();
        layer.draw();
        updateFaces([]);
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

    function addEdgeFromVertexIndices(startVertexIndex, endVertexIndex) {
        const startVertex = vertices[startVertexIndex];
        const endVertex = vertices[endVertexIndex];

        const edgeLine = new Konva.Line({
            points: [startVertex.x, startVertex.y, endVertex.x, endVertex.y],
            stroke: "red",
            strokeWidth: 3,
            tension: 0.5, // For curved lines
        });
        const edge = new Edge(startVertex, endVertex, edgeLine);

        edgeLine.on("mouseover", function () {
            document.body.style.cursor = "pointer";
            this.strokeWidth(5);
        });
        edgeLine.on("mouseout", function () {
            document.body.style.cursor = "default";
            this.strokeWidth(3);
        });
        edgeLine.on("click", function () {
            if (mode == "deleteEdge") {
                deleteEdge(edgeLine);
            }
        });

        edges.push(edge);
        layer.add(edgeLine);
        edgeLine.moveToBottom(); // Keep edges behind vertices
        layer.draw();
        updateAdjacencyMatrix();
        updateFaces([]);
    }

    function addEdge(startVertexKonva, endVertexKonva) {
        const startVertexIndex = vertices.findIndex(
            (v) => v.konvaObject === startVertexKonva
        );
        const endVertexIndex = vertices.findIndex(
            (v) => v.konvaObject === endVertexKonva
        );

        if (endVertexIndex === -1 || startVertexIndex === -1) {
            // Vertices must exist
            console.warn(
                "Something went wrong, can't find start or end vertex"
            );
            return;
        }

        addEdgeFromVertexIndices(startVertexIndex, endVertexIndex);
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

    // --- Delete Edge ---
    buttonForDeleteEdge.addEventListener("click", () => {
        if (mode === "deleteEdge") {
            mode = "normal";
            buttonForDeleteEdge.textContent = "Удалить ребро";
        } else {
            mode = "deleteEdge";
            buttonForDeleteEdge.textContent = "Выберите ребро для удаления";
        }
    });

    function deleteEdge(edgeLine) {
        const edgeIndex = edges.findIndex((e) => e.konvaObject === edgeLine);
        const edge = edges[edgeIndex];
        const startIndex = vertices.findIndex((v) => v === edge.startVertex);
        const endIndex = vertices.findIndex((v) => v === edge.endVertex);
        if (edgeIndex === -1) {
            console.warn("Edge not found");
            return;
        }
        if ((startIndex === -1) | (endIndex === -1)) {
            console.warn("Start and end of edge can't be found");
            return;
        }
        adjacencyMatrix[startIndex][endIndex] = 0;
        adjacencyMatrix[endIndex][startIndex] = 0;

        edges.splice(edgeIndex, 1);
        edge.konvaObject.destroy();

        updateAdjacencyMatrix();
        layer.draw();
        updateFaces([]);
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
            const start = vertices.findIndex((v) => v === edge.startVertex);
            const end = vertices.findIndex((v) => v === edge.endVertex);
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

    // --- Exporting graph as JSON ---
    buttonForGraphExport.addEventListener("click", () => {
        const dataString = JSON.stringify(collectGraphInfo());
        download("graph.json", dataString);
    });

    function collectGraphInfo() {
        return {
            adjacencyMatrix: adjacencyMatrix,
            vertices: vertices.map((v) => {
                return { x: v.x, y: v.y, label: v.label };
            }),
        };
    }

    // -- Importing graph as JSON ---
    formForGraphImport.addEventListener("submit", (e) => {
        e.preventDefault();
        const file = inputForGraphImport.files[0];
        const reader = new FileReader();
        reader.onload = function (e) {
            let contents = e.target.result;
            let graphData = JSON.parse(contents);
            buildGraph(graphData);
        };
        reader.readAsText(file);
    });

    async function buildGraph(graphData) {
        if (graphData.adjacencyMatrix === undefined) {
            console.warn("No adjacency matrix");
        }

        if (graphData.vertices === undefined) {
            graphData.vertices = await fetchVertexPositions(
                graphData.adjacencyMatrix
            );
            console.log(graphData.vertices);
        } else {
            const len1 = graphData.adjacencyMatrix.length;
            const len2 = graphData.adjacencyMatrix[0].length;
            if (len1 !== len2 || len2 !== graphData.vertices.length) {
                console.warn(
                    "Graph data has invalid shapes of adjacency matrix and vertices"
                );
                return;
            }
        }
        for (let i = 0; i < vertices.length; i++) {
            vertices[i].konvaObject.destroy();
        }
        for (let i = 0; i < edges.length; i++) {
            edges[i].konvaObject.destroy();
        }
        vertices = [];
        for (let i = 0; i < graphData.vertices.length; i++) {
            let vertexData = graphData.vertices[i];
            addVertex(vertexData.x, vertexData.y, vertexData.label);
        }

        for (let i = 0; i < vertices.length; i++) {
            for (let j = i + 1; j < vertices.length; j++) {
                if (graphData.adjacencyMatrix[i][j] == 1) {
                    addEdgeFromVertexIndices(i, j);
                }
            }
        }

        updateAdjacencyMatrix();
        inputForAddVertex.placeholder = `${vertices.length + 1}`;
        updateFaces([]);
    }

    // --- Finding faces ---
    async function findFaces() {
        let facesList = await fetchFaceData();
        updateFaces(facesList);
    }

    function updateFaces(facesList) {
        faces = [];
        let facesHtml = "";
        for (let i = 0; i < facesList.length; i++) {
            let vList = [];
            let vLabelList = [];
            for (let vIndex of facesList[i]) {
                vList.push(vertices[vIndex]);
                vLabelList.push(vertices[vIndex].label);
            }

            let edgeList = [];
            for (let vIndex = 0; vIndex < facesList[i].length - 1; vIndex++) {
                let v1 = vList[vIndex];
                let v2 = vList[vIndex + 1];
                let edgeIndex = edges.findIndex((e) => {
                    return (
                        (e.startVertex == v1 && e.endVertex == v2) ||
                        (e.startVertex == v2 && e.endVertex == v1)
                    );
                });
                if (edgeIndex === -1) {
                    console.warn("Could not find edge");
                    return [];
                }
                edgeList.push(edges[edgeIndex]);
            }
            let face = new Face(vList, edgeList, `${i + 1}`);
            faces.push(face);
            facesHtml += `<li>(${face.label}): ${vLabelList}</li>`;
        }

        facesListUl.innerHTML = facesHtml;

        for (let i = 0; i < facesListUl.childNodes.length; i++) {
            let li = facesListUl.childNodes[i];
            let face = faces[i];
            li.addEventListener("mouseover", () => {
                for (let v of face.vertices) {
                    v.konvaObject.children[0].strokeWidth(4);
                }
                for (let e of face.edges) {
                    e.konvaObject.strokeWidth(5);
                    e.konvaObject.stroke("blue");
                }
                document.body.style.cursor = "pointer";
            });
            li.addEventListener("mouseout", () => {
                for (let v of face.vertices) {
                    v.konvaObject.children[0].strokeWidth(2);
                }
                for (let e of face.edges) {
                    e.konvaObject.strokeWidth(3);
                    e.konvaObject.stroke("red");
                }
                document.body.style.cursor = "default";
            });
        }
    }

    buttonForFindingFaces.addEventListener("click", () => {
        findFaces();
    });

    // --- Utils ---
    function download(filename, text) {
        var element = document.createElement("a");
        element.setAttribute(
            "href",
            "data:text/plain;charset=utf-8," + encodeURIComponent(text)
        );
        element.setAttribute("download", filename);

        element.style.display = "none";
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }

    function getVertexPositionsList() {
        let positions = [];
        for (let i = 0; i < vertices.length; i++) {
            positions.push([vertices[i].x, vertices[i].y]);
        }
        return positions;
    }

    // --- Fetching from backend ---
    async function fetchVertexPositions(adjacencyMatrix) {
        console.log(JSON.stringify({ adjacency_matrix: adjacencyMatrix }));
        const resp = await fetch("/api/v1/positions", {
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({ adjacency_matrix: adjacencyMatrix }),
        });
        let responseBody = await resp.json();

        if (responseBody["status"] !== "ok") {
            console.warn(responseBody["data"]["message"]);
            return;
        }

        let positions = responseBody.data.positions;

        let min_x = positions[0][0];
        let max_x = min_x;
        let min_y = positions[0][1];
        let max_y = min_y;

        for (let i = 1; i < positions.length; i++) {
            if (positions[i][0] < min_x) {
                min_x = positions[i][0];
            }
            if (positions[i][1] < min_y) {
                min_y = positions[i][1];
            }
            if (positions[i][0] > max_x) {
                max_x = positions[i][0];
            }
            if (positions[i][1] > max_y) {
                max_y = positions[i][1];
            }
        }

        // now min coordinate goes to 10% of canvas, max - to 90%
        const width_80 = width * 0.8;
        const width_10 = width * 0.1;
        const height_80 = height * 0.8;
        const height_10 = height * 0.1;

        let vertices = [];
        for (let i = 0; i < positions.length; i++) {
            let x =
                ((positions[i][0] - min_x) / (max_x - min_x)) * width_80 +
                width_10;
            let y =
                ((positions[i][1] - min_y) / (max_y - min_y)) * height_80 +
                height_10;
            vertices.push({ x: x, y: y, label: `${i + 1}` });
        }

        return vertices;
    }

    async function fetchFaceData() {
        let resp = await fetch("/api/v1/find_faces", {
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({
                adjacency_matrix: adjacencyMatrix,
                positions: getVertexPositionsList(),
            }),
        });
        if (!resp.ok) {
            console.warn("Ошибка при нахождении граней");
            return [];
        }
        resp = await resp.json();
        if (resp["status"] !== "ok") {
            console.warn("Ошибка при нахождении граней");
            return [];
        }
        return resp["data"]["faces"];
    }
});
