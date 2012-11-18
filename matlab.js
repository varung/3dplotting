function plot3d(element, data, fillPly)
      {

        // Define a colour gradient.
        var colour1 = {red:0, green:0, blue:255};
        var colour2 = {red:0, green:255, blue:255};
        var colour3 = {red:0, green:255, blue:0};
        var colour4 = {red:255, green:255, blue:0};
        var colour5 = {red:255, green:0, blue:0};
        var colours = [colour1, colour2, colour3, colour4, colour5];
        
        // Axis labels.
        var xAxisHeader = ""; // "X-axis";
        var yAxisHeader = ""; // "Y-axis";
        var zAxisHeader = ""; // "Z-axis";
        var xAxisHeader =  "X";
        var yAxisHeader =  "Y";
        var zAxisHeader =  "Z";

        var xticks = 10;
        var yticks = 10;
        var zticks = 10;
        
        var renderDataPoints = false;
        var background = '#ffffff';
        var axisForeColour = '#000000';
        var hideFloorPolygons = true;
        var chartOrigin = {x: 200, y:300};
        //var chartOrigin = {x: 150, y:150};
        
        // Options for the basic canvas pliot.
        var options = {
          fillPolygons: fillPly, 
          tooltips: data.tooltips,
          renderPoints: renderDataPoints,
          xPos: 0, yPos: 0, 
          width: 400, height: 400, 
          colourGradient: colours, 
          xTitle: xAxisHeader, yTitle: yAxisHeader, zTitle: zAxisHeader, 
          xTicks: xticks, yTicks: yticks, zTicks: zticks, 
          backColour: background, 
          axisTextColour: axisForeColour, 
          hideFlatMinPolygons: hideFloorPolygons, 
          origin: chartOrigin};

        surfacePlot = new SurfacePlot(element);
        surfacePlot.draw(data, options);
}
      
// data has the following fields:
//  - zValues:  required
//  - xValues, yValues:  specify x and y coordinates.  Default to mesh([1, ... , n], [1, ... , m])
//  - Colors:  defaults to using normalized z values

function surf(element, data) {
  plot3d(element, data, true)
}

function mesh(element, data) {
  plot3d(element, data, false)
}
