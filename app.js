// --- 1. D3.js Initialization ---
// (This function remains exactly the same as before)
function renderGraph(data) {
    const container = document.getElementById('graph-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Clear any existing SVGs
    d3.select("#graph-container").selectAll("*").remove();

    const svg = d3.select("#graph-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Initialize the physics simulation
    const simulation = d3.forceSimulation(data.nodes)
        .force("link", d3.forceLink(data.links).id(d => d.id).distance(150))
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(width / 2, height / 2));

    // Render the edges (links)
    const link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(data.links)
        .enter().append("line")
        .attr("class", "link")
        .attr("stroke-width", d => Math.sqrt(d.value));

    // Render the vertices (nodes)
    const node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(data.nodes)
        .enter().append("g")
        .attr("class", "node")
        .call(d3.drag() // Enable drag physics
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    node.append("circle")
        .attr("r", d => d.radius)
        .attr("fill", d => d.color);

    node.append("text")
        .attr("dx", 15)
        .attr("dy", ".35em")
        .text(d => d.id);

    // Tick function to update positions on every animation frame
    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Drag event handlers
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}

// --- 2. Asynchronous Data Fetching ---
async function fetchAndRenderTopology() {
    try {
        // Fetch the data through the local Go proxy
        const response = await fetch('/api/v1/topology');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const topologyData = await response.json();
        
        // Render the graph with the live data
        renderGraph(topologyData);
    } catch (error) {
        console.error("Failed to fetch topology data:", error);
        // Fallback or error state could be handled here in the UI
    }
}

// --- 3. Execution ---
// Fetch and render the data when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', fetchAndRenderTopology);

// Handle window resizing
window.addEventListener('resize', fetchAndRenderTopology);