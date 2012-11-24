function plot3d(element, data, options)
      {

        var numRows = data.zValues.length;
        var numCols = data.zValues[0].length;

        if (! (("xValues" in data) && ("yValues" in data)) ) {
           var xVals = new Array();
           var yVals = new Array();
           for (var i = 0; i < numRows; i++){
               xVals[i] = new Array();
               yVals[i] = new Array();
               for (var j = 0; j < numCols; j++) {
                 xVals[i][j] = i + 1;
                 yVals[i][j] = j + 1;
               }
           }
           if (!("xValues" in data)) {
             data.xValues = xVals;
           }
           if (!("yValues" in data)) {
             data.yValues = yVals;
           }
        }

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

        // Define a colour gradient.
        var colour1 = {red:0, green:0, blue:255};
        var colour2 = {red:0, green:255, blue:255};
        var colour3 = {red:0, green:255, blue:0};
        var colour4 = {red:255, green:255, blue:0};
        var colour5 = {red:255, green:0, blue:0};
        var colours = [colour1, colour2, colour3, colour4, colour5];
        
        // Axis labels.
        var xAxisHeader =  "X";
        var yAxisHeader =  "Y";
        var zAxisHeader =  "Z";

        var renderDataPoints = false;
        var background = '#ffffff';
        var axisForeColour = '#000000'; // Color of axis stuff
        var chartOrigin = {x: 200, y:300}; // Move the whole plot!
        
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
        //options.xTicks = [0, 5, 10, 20];
        //options.yTicks = [-0.4, 0, 0.4, 30];
        //options.zTicks = [-100, 1000, 0];
        options.backColour = background;
        options.axisTextColour = axisForeColour;
        options.origin = chartOrigin;

        var surfaces_data = new Array();
        surfaces_data[0] = data;
        surfacePlot = new SurfacePlot(element);
        surfacePlot.draw(surfaces_data, options);
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
