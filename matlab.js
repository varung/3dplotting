function plot3d(element, data, options)
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

        var xticks = [0, 5, 10, 20];
        var yticks = [-0.4, 0, 0.4, 30];
        var zticks = [-100, 1000, 0];
        //var xticks; 
        //var yticks;
        //var zticks;
        
        var renderDataPoints = false;
        var background = '#ffffff';
        var axisForeColour = '#000000';
        var hideFloorPolygons = true;
        var chartOrigin = {x: 200, y:300};
        //var chartOrigin = {x: 150, y:150};
        
        var numRows = data.zValues.length;
        var numCols = data.zValues[0].length;

        if (! ("tooltips" in options)) {
          var tooltipStrings = new Array();
          var idx = 0;
          for (var i = 0; i < numRows; i++) 
          {   
            for (var j = 0; j < numCols; j++)
            {   
              tooltipStrings[idx] = "x:" + data.xValues[i][j]
                               + ",\ny:" + data.yValues[i][j]
                               + ",\nz:" + data.zValues[i][j];
              idx++;
            }   
          }   
          options.tooltips = tooltipStrings;
        }

        // Options for the basic canvas pliot.
        options.renderPoints = renderDataPoints;
        options.xPos = 0;
        options.yPos  = 0; 
        options.width  = 400;
        options.height = 400;
        options.colourGradient = colours;
        options.xTitle = xAxisHeader;
        options.yTitle = yAxisHeader;
        options.zTitle = zAxisHeader;
        options.xTicks = xticks;
        options.yTicks = yticks; 
        options.zTicks = zticks;
        options.backColour = background;
        options.axisTextColour = axisForeColour;
        options.hideFlatMinPolygons = hideFloorPolygons; 
        options.origin = chartOrigin;

        surfacePlot = new SurfacePlot(element);
        surfacePlot.draw(data, options);
}
      
// data has the following fields:
//  - zValues:  required
//  - xValues, yValues:  specify x and y coordinates.  Default to mesh([1, ... , n], [1, ... , m])
//  - Colors:  defaults to using normalized z values

function surf(element, data, options) {
  options.fillPolygons = true
  plot3d(element, data, options)
}

function mesh(element, data, options) {
  options.fillPolygons = false
  plot3d(element, data, options)
}
