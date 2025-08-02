let sceneIndex = 0;

d3.csv("data/population-with-un-projections.csv").then(data => {
  data.forEach(d => {
    d.Year = +d.Year;
    if (d.Year <= 2023) {
      d.population = +d.population__sex_all__age_all__variant_estimates;
    } else {
      d.population = +d.population__sex_all__age_all__variant_medium;
    }
  });

  const filteredData = data.filter(d => d.Year >= 2020 && d.Year <= 2100);

  const worldData = filteredData.filter(d => d.Entity === "World" && !isNaN(d.population));

  const regions = [
    "Africa",
    "Asia",
    "Europe",
    "Latin America",
    "Northern America",
    "Oceania"
  ];
  const regionData = regions.map(region => ({
    name: region,
    values: filteredData.filter(d => d.Entity === region && !isNaN(d.population))
  }));

  renderScene(worldData, regionData);

  d3.select("#nextBtn").on("click", () => {
    sceneIndex++;
    renderScene(worldData, regionData);
  });

  d3.select("#prevBtn").on("click", () => {
    sceneIndex = Math.max(0, sceneIndex - 1);
    renderScene(worldData, regionData);
  });
});

function renderScene(worldData, regionData) {
  d3.select("#vis-container").html("");

  updateButtonStates();

  if (sceneIndex === 0) {
    drawScene0(worldData);
  } else if (sceneIndex === 1) {
    drawScene1(regionData);
  } else if (sceneIndex === 2) {
    drawScene2Slowest();
  } else if (sceneIndex === 3) {
    drawScene3Fastest();
  } else {
    d3.select("#vis-container").append("p").text("Scene " + sceneIndex + " coming soon...");
  }
  
}

function updateButtonStates() {
  const prevBtn = d3.select("#prevBtn");
  const nextBtn = d3.select("#nextBtn");

  if (sceneIndex === 0) {
    prevBtn.style("opacity", 0.5).style("pointer-events", "none");
  } else {
    prevBtn.style("opacity", 1).style("pointer-events", "auto");
  }
  
  if (sceneIndex === 3) {
    nextBtn.style("opacity", 0.5).style("pointer-events", "none");
  } else {
    nextBtn.style("opacity", 1).style("pointer-events", "auto");
  }
}

function drawScene0(data) {
  const margin = { top: 60, right: 40, bottom: 50, left: 70 },
        width = 800 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

  const svg = d3.select("#vis-container")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
    .domain([2020, 2100])
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([d3.min(data, d => d.population), d3.max(data, d => d.population)])
    .range([height, 0]);

  const line = d3.line()
    .x(d => x(d.Year))
    .y(d => y(d.population));


  const defs = svg.append("defs");
  const gradient = defs.append("linearGradient")
    .attr("id", "lineGradient")
    .attr("gradientUnits", "userSpaceOnUse");
    
  gradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "#667eea");
    
  gradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#764ba2");


  const area = d3.area()
    .x(d => x(d.Year))
    .y0(height)
    .y1(d => y(d.population));

  svg.append("path")
    .datum(data)
    .attr("fill", "url(#lineGradient)")
    .attr("opacity", 0.1)
    .attr("d", area);


  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "url(#lineGradient)")
    .attr("stroke-width", 3)
    .attr("stroke-linecap", "round")
    .attr("d", line)
    .style("cursor", "pointer")


  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

 
  svg.selectAll(".data-point")
    .data(data.filter((d, i) => i % 10 === 0))
    .enter()
    .append("circle")
    .attr("class", "data-point")
    .attr("cx", d => x(d.Year))
    .attr("cy", d => y(d.population))
    .attr("r", 3)
    .attr("fill", "#667eea")
    .attr("stroke", "white")
    .attr("stroke-width", 2)
    .on("mouseover", function(event, d) {
      tooltip.style("opacity", .9);
      tooltip.html(`
        <strong>Year: ${d.Year}</strong><br/>
        Population: ${(d.population / 1e9).toFixed(2)} billion<br/>
      `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
      
      d3.select(this)
        .attr("r", 6)
        .attr("fill", "#f093fb");
    })
    .on("mouseout", function(d) {
      tooltip.style("opacity", 0);
      
      d3.select(this)
        .attr("r", 3)
        .attr("fill", "#667eea");
    });

  const annoYear = 2080;
  const annoData = data.find(d => d.Year === annoYear);
  if (annoData) {
    const annotations = [
      {
        note: {
          label: "World Population will peak at 10.5 billion in 2080 and then decline.",
          title: "Global Summit"
        },
        x: x(annoData.Year),
        y: y(annoData.population),
        dy: 40,
        dx: 0,
        type: d3.annotationLabel
      }
    ];
    const makeAnnotations = d3.annotation()
      .type(d3.annotationLabel)
      .annotations(annotations);
    svg.append("g")
      .attr("class", "annotation-group")
      .call(makeAnnotations);
  }

  const xAxis = d3.axisBottom(x).ticks(10).tickFormat(d3.format("d"));
  const yAxis = d3.axisLeft(y).tickFormat(d => d / 1e9 + "B");

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0, ${height})`)
    .call(xAxis);

  svg.append("g")
    .attr("class", "axis")
    .call(yAxis);

  svg.append("text")
    .attr("class", "axis-label")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .attr("text-anchor", "middle")
    .text("Year");

  svg.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -50)
    .attr("text-anchor", "middle")
    .text("Population (Billions)");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -40)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "600")
    .text("World Population Over Time (2020-2100)");


}

function drawScene1(regionData) {
  const margin = { top: 60, right: 120, bottom: 50, left: 70 },
        width = 800 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

  const svg = d3.select("#vis-container")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const allYears = regionData.flatMap(region => region.values.map(d => d.Year));
  const x = d3.scaleLinear()
    .domain(d3.extent(allYears))
    .range([0, width]);

  const allPops = regionData.flatMap(region => region.values.map(d => d.population));
  const y = d3.scaleLinear()
    .domain([d3.min(allPops), d3.max(allPops)])
    .range([height, 0]);

  const color = d3.scaleOrdinal()
    .domain(regionData.map(d => d.name))
    .range(d3.schemeCategory10);

  const line = d3.line()
    .x(d => x(d.Year))
    .y(d => y(d.population));

  regionData.forEach(region => {
    svg.append("path")
      .datum(region.values)
      .attr("fill", "none")
      .attr("stroke", color(region.name))
      .attr("stroke-width", 2.5)
      .attr("d", line);

    svg.append("text")
      .datum(region.values[region.values.length - 1])
      .attr("transform", d => {
        let xOffset = x(d.Year);
        let yOffset = y(d.population);

        if (region.name === "Latin America") {
          yOffset -= 12;
        }
        if(region.name === "Northern America") {
          yOffset += 6;
        }
        return `translate(${xOffset},${yOffset})`;
      })
      .attr("x", 5)
      .attr("dy", "0.35em")
      .style("font-size", "12px")
      .style("fill", color(region.name))
      .text(region.name);


    svg.selectAll(`.data-point-${region.name.replace(/\s/g, '')}`)
      .data(region.values.filter((d, i) => i % 10 === 0))
      .enter()
      .append("circle")
      .attr("class", `data-point data-point-${region.name.replace(/\s/g, '')}`)
      .attr("cx", d => x(d.Year))
      .attr("cy", d => y(d.population))
      .attr("r", 4)
      .attr("fill", color(region.name))
      .attr("stroke", "white")
      .attr("stroke-width", 1.5)
      .on("mouseover", function(event, d) {
        tooltip.style("opacity", .95);
        tooltip.html(`
          <strong>Region:</strong> ${region.name}<br/>
          <strong>Year:</strong> ${d.Year}<br/>
          <strong>Population:</strong> ${(d.population / 1e9).toFixed(2)} billion
        `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
        d3.select(this)
          .attr("r", 7)
          .attr("fill", "#f093fb");
      })
      .on("mouseout", function() {
        tooltip.style("opacity", 0);
        d3.select(this)
          .attr("r", 4)
          .attr("fill", color(region.name));
      });
  });

  let tooltip = d3.select("body").select(".tooltip");
  if (tooltip.empty()) {
    tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);
  }

  const annoSpecs = [
    { region: "Asia", year: 2050, label: "Asia will continue to grow until 2050, then decline.", title: "Asia Summit" },
    { region: "Africa", year: 2100, label: "Whereas other regions face population decline, Africa will continue to grow linearly.", title: "Africa's Rise" },
    { region: "Europe", year: 2100, label: "Other regions will keep most of their population steady.", title: "Outlook of other regions" }
  ];
  const annotations = annoSpecs.map(spec => {
    const regionObj = regionData.find(r => r.name === spec.region);
    if (!regionObj) return null;
    const d = regionObj.values.find(v => v.Year === spec.year);
    if (!d) return null;
    return {
      note: {
        label: spec.label,
        title: spec.title
      },
      x: x(d.Year),
      y: y(d.population),
      dx: 0,
      dy: regionObj.name === "Europe" ? -40 : 40,
      type: d3.annotationLabel
    };
  }).filter(Boolean);
  if (annotations.length > 0) {
    const makeAnnotations = d3.annotation()
      .type(d3.annotationLabel)
      .annotations(annotations);
    svg.append("g")
      .attr("class", "annotation-group")
      .call(makeAnnotations);
  }


  const xAxis = d3.axisBottom(x).ticks(10).tickFormat(d3.format("d"));
  const yAxis = d3.axisLeft(y).tickFormat(d => d / 1e9 + "B");

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0, ${height})`)
    .call(xAxis);

  svg.append("g")
    .attr("class", "axis")
    .call(yAxis);


  svg.append("text")
    .attr("class", "axis-label")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .attr("text-anchor", "middle")
    .text("Year");

  svg.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -50)
    .attr("text-anchor", "middle")
    .text("Population (Billions)");

  svg.append("text")
    .attr("x", 700 / 2)
    .attr("y", -40)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "600")
    .text("Population Trends by Region (2020-2100)");

  
}
function drawScene2Slowest() {
  d3.csv("data/population-with-un-projections.csv").then(data => {
    data.forEach(d => {
      d.Year = +d.Year;
      if (d.Year <= 2023) {
        d.population = +d.population__sex_all__age_all__variant_estimates;
      } else {
        d.population = +d.population__sex_all__age_all__variant_medium;
      }
    });

    const filteredData = data.filter(d => d.Year >= 2020 && d.Year <= 2100);

    const regions = ["World", "Africa", "Asia", "Europe", "Latin America", "Northern America", "Oceania"];
    const countryData = filteredData.filter(d => !regions.includes(d.Entity) && !isNaN(d.population));
    const countryGrowthRates = [];
    const countries = [...new Set(countryData.map(d => d.Entity))];
    countries.forEach(country => {
      const countryRecords = countryData.filter(d => d.Entity === country);
      const startYear = countryRecords.find(d => d.Year === 2020);
      const endYear = countryRecords.find(d => d.Year === 2100);
      
      if (startYear && endYear && startYear.population > 0) {
        const growthRate = (endYear.population - startYear.population) / startYear.population;
        countryGrowthRates.push({
          country: country,
          growthRate: growthRate
        });
      }
    });
    countryGrowthRates.sort((a, b) => a.growthRate - b.growthRate);
    const slowestGrowing = countryGrowthRates.slice(0, 5);
    const countryLines = slowestGrowing.map(country => ({
      name: country.country,
      growthRate: country.growthRate,
      values: countryData.filter(d => d.Entity === country.country)
    }));
    drawCountryLinesChart(countryLines, 'Top 5 Countries with the Most Population Decline (2020-2100)', '#2166ac');
  });
}

function drawScene3Fastest() {
  d3.csv("data/population-with-un-projections.csv").then(data => {
    data.forEach(d => {
      d.Year = +d.Year;
      if (d.Year <= 2023) {
        d.population = +d.population__sex_all__age_all__variant_estimates;
      } else {
        d.population = +d.population__sex_all__age_all__variant_medium;
      }
    });

    const filteredData = data.filter(d => d.Year >= 2020 && d.Year <= 2100);

    const regions = ["World", "Africa", "Asia", "Europe", "Latin America", "Northern America", "Oceania"];
    const countryData = filteredData.filter(d => !regions.includes(d.Entity) && !isNaN(d.population));
    const countryGrowthRates = [];
    const countries = [...new Set(countryData.map(d => d.Entity))];
    countries.forEach(country => {
      const countryRecords = countryData.filter(d => d.Entity === country);
      const startYear = countryRecords.find(d => d.Year === 2020);
      const endYear = countryRecords.find(d => d.Year === 2100);
      
      if (startYear && endYear && startYear.population > 0) {
        const growthRate = (endYear.population - startYear.population) / startYear.population;
        countryGrowthRates.push({
          country: country,
          growthRate: growthRate
        });
      }
    });
    countryGrowthRates.sort((a, b) => b.growthRate - a.growthRate);
    const fastestGrowing = countryGrowthRates.slice(0, 5);
    const countryLines = fastestGrowing.map(country => ({
      name: country.country,
      growthRate: country.growthRate,
      values: countryData.filter(d => d.Entity === country.country)
    }));
    drawCountryLinesChart(countryLines, 'Top 5 Countries with the Most Population Growth (2020-2100)', '#2166ac');
  });
}

function drawCountryLinesChart(countryLines, title, colorBase) {
  const margin = { top: 60, right: 180, bottom: 50, left: 70 },
        width = 800 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;
  const svg = d3.select("#vis-container")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  const x = d3.scaleLinear()
    .domain([2020, 2100])
    .range([0, width]);
  const allPops = countryLines.flatMap(country => country.values.map(d => d.population));
  const y = d3.scaleLinear()
    .domain([0, d3.max(allPops)])
    .range([height, 0]);
  const color = d3.scaleOrdinal()
    .domain(countryLines.map(d => d.name))
    .range(d3.schemeCategory10);
  const line = d3.line()
    .x(d => x(d.Year))
    .y(d => y(d.population));
  countryLines.forEach((country, idx) => {
    svg.append("path")
      .datum(country.values)
      .attr("fill", "none")
      .attr("stroke", color(country.name))
      .attr("stroke-width", 2.5)
      .attr("d", line);
    svg.selectAll(`.data-point-${country.name.replace(/\s/g, '')}`)
      .data(country.values.filter((d, i) => i % 20 === 0))
      .enter()
      .append("circle")
      .attr("class", `data-point data-point-${country.name.replace(/\s/g, '')}`)
      .attr("cx", d => x(d.Year))
      .attr("cy", d => y(d.population))
      .attr("r", 3)
      .attr("fill", color(country.name))
      .attr("stroke", "white")
      .attr("stroke-width", 1.5)
      .on("mouseover", function(event, d) {
        tooltip.style("opacity", .95);
        tooltip.html(`
          <strong>Country:</strong> ${country.name}<br/>
          <strong>Year:</strong> ${d.Year}<br/>
          <strong>Population:</strong> ${(d.population / 1e6).toFixed(1)}M<br/>
          <strong>Growth Rate:</strong> ${(country.growthRate * 100).toFixed(1)}%
        `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
        d3.select(this)
          .attr("r", 6)
          .attr("fill", "#f093fb");
      })
      .on("mouseout", function() {
        tooltip.style("opacity", 0);
        d3.select(this)
          .attr("r", 3)
          .attr("fill", color(country.name));
      });
  });

  
  const ukraine = countryLines.find(c => c.name === "Ukraine");
  
  if (ukraine) {
    const annoData = ukraine.values.find(d => d.Year === 2026);
    if (annoData) {
      const annotations = [
        {
          note: {
            label: "Ukraine's population will face the most decline after the year of 2026 with a projected 66% decline.",
            title: "Ukraine's Decline"
          },
          x: x(annoData.Year),
          y: y(annoData.population),
          dx: 40,
          dy: 50,
          type: d3.annotationLabel
        }
      ];
      const makeAnnotations = d3.annotation()
        .type(d3.annotationLabel)
        .annotations(annotations);
      svg.append("g")
        .attr("class", "annotation-group")
        .call(makeAnnotations);
    }
  }

    const drc = countryLines.find(c => c.name === "Democratic Republic of Congo");
    if (drc) {
    const annoData = drc.values.find(d => d.Year === 2060);
    if (annoData) {
        const annotations = [
        {
            note: {
            label: "DR Congo is projected to become one of the fastest-growing countries, with population nearly tripling by 2060.",
            title: "DR Congo’s Surge"
            },
            x: x(annoData.Year),
            y: y(annoData.population),
            dx: 0,
            dy: -40,
            type: d3.annotationLabel
        }
        ];
        const makeAnnotations = d3.annotation()
        .type(d3.annotationLabel)
        .annotations(annotations);
        svg.append("g")
        .attr("class", "annotation-group")
        .call(makeAnnotations);
    }
  }

  
  
  let tooltip = d3.select("body").select(".tooltip");
  if (tooltip.empty()) {
    tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);
  }
  const xAxis = d3.axisBottom(x).ticks(10).tickFormat(d3.format("d"));
  const yAxis = d3.axisLeft(y).tickFormat(d => d / 1e6 + "M");
  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0, ${height})`)
    .call(xAxis);
  svg.append("g")
    .attr("class", "axis")
    .call(yAxis);
  svg.append("text")
    .attr("class", "axis-label")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .attr("text-anchor", "middle")
    .text("Year");
  svg.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -50)
    .attr("text-anchor", "middle")
    .text("Population (Millions)");
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -40)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "600")
    .text(title);
  
  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width + 20}, 0)`);
  legend.append("text")
    .attr("x", 0)
    .attr("y", 0)
    .style("font-size", "14px")
    .style("font-weight", "600")
    .style("fill", colorBase)
    .text("Countries");
  countryLines.forEach((country, i) => {
    legend.append("line")
      .attr("x1", 0)
      .attr("x2", 15)
      .attr("y1", 20 + i * 15)
      .attr("y2", 20 + i * 15)
      .attr("stroke", color(country.name))
      .attr("stroke-width", 2.5);
    legend.append("text")
      .attr("x", 20)
      .attr("y", 20 + i * 15)
      .attr("dy", "0.35em")
      .style("font-size", "11px")
      .style("fill", colorBase)
      .text(`${country.name}`);
  });
  
  
}

