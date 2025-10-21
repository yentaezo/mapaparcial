const CANVAS = {
    w: 1000,
    h: 1000
};

const topoData = await d3
    .json(`./prueba2.json`)
    .catch(e => console.error(e));

const geoData = {};
const arrOfKeys = ['buildings'];

arrOfKeys.forEach(key => {
    geoData[key] = topojson.feature(topoData, topoData.objects[key]);
});

const d3Identity = d3.geoIdentity();

const d3Projection = d3Identity
    .fitSize([CANVAS.w, CANVAS.h], geoData["buildings"]);

const d3Path = d3.geoPath(d3Projection);

// --- PREPARACIÓN: Ordenar los "buildings" para la animación ---
const pathGenerator = d3.geoPath(d3Projection);
const buildingsFeatures = geoData.buildings?.features || [];

buildingsFeatures.forEach(d => {
    d.properties.centroid = pathGenerator.centroid(d);
});

buildingsFeatures.sort((a, b) => {
    const centroidA = a.properties.centroid;
    const centroidB = b.properties.centroid;
    if (centroidA[1] === centroidB[1]) {
        return centroidA[0] - centroidB[0];
    }
    return centroidA[1] - centroidB[1];
});

// --- DIBUJO ---
const svgContainer = d3
    .select("#svg_container")
    .append("svg")
    .attr("viewBox", `0 0 ${CANVAS.w} ${CANVAS.h}`)
    .classed("floormap", true);

const groups = svgContainer
    .selectAll("g")
    .data(arrOfKeys)
    .enter()
    .append("g")
    .attr("class", (d) => d);

const assets = groups
    .selectAll("path")
    .data(d => geoData[d]?.features)
    .enter()
    .append("path")
    .attr("d", d3Path);


// --- ANIMACIÓN E INTERACTIVIDAD (VERSIÓN FINAL) ---

const buildingsSelection = svgContainer.selectAll(".buildings path");

// 1. AÑADIMOS LA INTERACTIVIDAD
buildingsSelection
    .on("click", (event, d) => {
        if (d.properties.url) {
            window.location.href = d.properties.url;
        } else {
            console.log(`El área "${d.properties.name}" no tiene una URL de destino.`);
        }
    })
    .on("mouseover", function(event, d) {
        svgContainer.selectAll(".hover-text").remove();

        let posX = d.properties.centroid[0];
        let posY = d.properties.centroid[1];
            if (d.properties.name === "Auditorio") {
            posX += 13; // Añade 10px para moverlo a la derecha (ajusta este valor si es necesario)
            posY += 20;
            }

        d3.select(this)
            .transition()
            .duration(250)
            .style("fill", "#0c3566");


          //Animacion de texto
        svgContainer.append("text")
            .attr("class", "hover-text") // Class for styling
            .attr("x", posX)
            .attr("y", posY+30) // Start 20px below center
            .attr("opacity", 0) // Start invisible
            .text(d.properties.name)
            .transition()
            .duration(300) // Animation duration
            .attr("y", posY+12) // Move to final Y position
            .attr("opacity", 1); // Fade in
    })
    .on("mouseout", function() {
        // Vuelve al color blanco original
        d3.select(this)
          .transition()
          .duration(250)
          .style("fill", "transparent");

        // Desvanece y elimina el texto
        svgContainer.selectAll(".hover-text")
          .transition()
          .duration(250)
          .attr("opacity", 0)
          .remove();
    });

// 2. EJECUTAMOS LA ANIMACIÓN DE APARICIÓN
buildingsSelection
    // Empezamos con el borde y el relleno COMPLETAMENTE TRANSPARENTES
    .style("fill", "transparent")
    .transition()
    .delay((d, i) => i * 200)
    .duration(500) // Una duración más corta se siente mejor
    .style("fill", "white") // Color base final
    .transition()
    .delay(1000) // Mantiene el estado visible por 500ms
    .duration(500)
    .style("fill", "transparent");
