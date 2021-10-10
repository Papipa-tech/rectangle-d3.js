"use-strict";

// Rectangle data: position x, y(center), width, height
data = [{ id: 1, x: -175, y: -75, width: 250, height: 125 }];

// Map movable area
let mapHeight = 2500;
let mapWidth = mapHeight * Math.sqrt(2);

// Max, min / X, Y
let maxTranslateX = mapWidth / 2;
let minTranslateX = -maxTranslateX;

let maxTranslateY = mapHeight / 2;
let minTranslateY = -maxTranslateY;

// Min rectangle width and height while downsizing
let minRectWidth = 100;
let minRectHeight = 100;

// Corner circle size + on hover
let handleR = 4;
let handleRactive = 8;

// HTML DOM manipulation
const wrapper = document.getElementById("svgWrapper");

// Height, Width variables
const height = wrapper.offsetHeight;
const width = wrapper.offsetWidth;

const svg = d3.select("svg");

// For the background (map)
svg
  .append("rect")
  .style("fill", "grey")
  .attr("width", "100%")
  .attr("height", "100%");

const g = svg.append("g");

g.append("rect")
  .style("fill", "white")
  .attr("x", minTranslateX)
  .attr("y", minTranslateY)
  .attr("width", mapWidth)
  .attr("height", mapHeight);

function zoomed() {
  g.attr("transform", d3.event.transform);
}

let zoom = d3
  .zoom()
  .scaleExtent([1 / 4, 4])
  .translateExtent([
    [minTranslateX, minTranslateY],
    [maxTranslateX, maxTranslateY],
  ])
  .constrain(function (transform, extent, translateExtent) {
    let cx = transform.invertX((extent[1][0] - extent[0][0]) / 2),
      cy = transform.invertY((extent[1][1] - extent[0][1]) / 2),
      dcx0 = Math.min(0, cx - translateExtent[0][0]),
      dcx1 = Math.max(0, cx - translateExtent[1][0]),
      dcy0 = Math.min(0, cy - translateExtent[0][1]),
      dcy1 = Math.max(0, cy - translateExtent[1][1]);
    return transform.translate(
      Math.min(0, dcx0) || Math.max(0, dcx1),
      Math.min(0, dcy0) || Math.max(0, dcy1)
    );
  })
  .on("zoom", zoomed);

svg.call(zoom);

// Hovering corners
function resizerHover() {
  let el = d3.select(this),
    isEntering = d3.event.type === "mouseenter";
  el.classed("hovering", isEntering).attr(
    "r",
    isEntering || el.classed("resizing") ? handleRactive : handleR
  );
}

function rectResizeStartEnd() {
  let el = d3.select(this),
    isStarting = d3.event.type === "start";
  d3.select(this)
    .classed("resizing", isStarting)
    .attr("r", isStarting || el.classed("hovering") ? handleRactive : handleR);
}

// Rect resizing
function rectResizing(d) {
  let dragX = Math.max(Math.min(d3.event.x, maxTranslateX), minTranslateX);

  let dragY = Math.max(Math.min(d3.event.y, maxTranslateY), minTranslateY);

  if (d3.select(this).classed("topleft")) {
    let newWidth = Math.max(d.width + d.x - dragX, minRectWidth);

    d.x += d.width - newWidth;
    d.width = newWidth;

    let newHeight = Math.max(d.height + d.y - dragY, minRectHeight);

    d.y += d.height - newHeight;
    d.height = newHeight;
  } else {
    d.width = Math.max(dragX - d.x, minRectWidth);
    d.height = Math.max(dragY - d.y, minRectHeight);
  }

  update();
}

function rectMoveStartEnd(d) {
  d3.select(this).classed("moving", d3.event.type === "start");
}

function rectMoving(d) {
  let dragX = Math.max(
    Math.min(d3.event.x, maxTranslateX - d.width),
    minTranslateX
  );

  let dragY = Math.max(
    Math.min(d3.event.y, maxTranslateY - d.height),
    minTranslateY
  );

  d.x = dragX;
  d.y = dragY;

  update();
}

function update() {
  let rects = g.selectAll("g.rectangle").data(data, function (d) {
    return d;
  });

  rects.exit().remove();

  let newRects = rects.enter().append("g").classed("rectangle", true);

  newRects
    .append("rect")
    .classed("bg", true)
    .attr("fill", "blue")
    .attr("stroke", "black")
    .attr("stroke-width", 2)
    .call(
      d3
        .drag()
        .container(g.node())
        .on("start end", rectMoveStartEnd)
        .on("drag", rectMoving)
    );

  newRects
    .append("g")
    .classed("circles", true)
    .each(function (_d) {
      const circleG = d3.select(this);

      // Top left
      circleG
        .append("circle")
        .classed("topleft", true)
        .attr("r", handleR)
        .on("mouseenter mouseleave", resizerHover)
        .call(
          d3
            .drag()
            .container(g.node())
            .subject(function () {
              return { x: d3.event.x, y: d3.event.y };
            })
            .on("start end", rectResizeStartEnd)
            .on("drag", rectResizing)
        );

      // Bottom right
      circleG
        .append("circle")
        .classed("bottomright", true)
        .attr("r", handleR)
        .on("mouseenter mouseleave", resizerHover)
        .call(
          d3
            .drag()
            .container(g.node())
            .subject(function () {
              return { x: d3.event.x, y: d3.event.y };
            })
            .on("start end", rectResizeStartEnd)
            .on("drag", rectResizing)
        );
    });

  // Rect transform
  const allRects = newRects.merge(rects);

  allRects.attr("transform", function (d) {
    return "translate(" + d.x + "," + d.y + ")";
  });

  allRects
    .select("rect.bg")
    .attr("height", function (d) {
      return d.height;
    })
    .attr("width", function (d) {
      return d.width;
    });

  allRects
    .select("circle.bottomright")
    .attr("cx", function (d) {
      return d.width;
    })
    .attr("cy", function (d) {
      return d.height;
    });
}

//Beckground (map) zoom
function windowResize() {
  let zoomTransform = d3.zoomTransform(svg.node());

  let k = zoomTransform.k,
    x = zoomTransform.x,
    y = zoomTransform.y;

  x -= width / 2;
  y -= height / 2;

  height = wrapper.offsetHeight;
  width = wrapper.offsetWidth;
  zoom.extent([
    [0, 0],
    [width, height],
  ]);

  x += width / 2;
  y += height / 2;

  zoom.transform(svg, d3.zoomIdentity.translate(x, y).scale(k));
}

zoom.transform(svg, d3.zoomIdentity.translate(width / 2, height / 2));

window.addEventListener("resize", windowResize);

//windowResize();
update();
