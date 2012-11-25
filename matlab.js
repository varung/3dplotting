function get_surface_data_defaults(data) {
  data.n = data.zValues.length;
  data.m = data.zValues[0].length;

  if (! (("xValues" in data) && ("yValues" in data)) ) {
     var xVals = new Array();
     var yVals = new Array();
     for (var i = 0; i < data.n; i++){
         xVals[i] = new Array();
         yVals[i] = new Array();
         for (var j = 0; j < data.m; j++) {
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
    for (var i = 0; i < data.n; i++)  {
      tooltipStrings[i] = new Array();
      for (var j = 0; j < data.m; j++) {
        tooltipStrings[i][j] = "x:" + data.xValues[i][j]
                          + ",\ny:" + data.yValues[i][j]
                          + ",\nz:" + data.zValues[i][j];
      }   
    }   
    data.tooltips = tooltipStrings;
  }

  return data;
}

function get_scatter_data_defaults(data) {
  data.n = data.zValues.length;

  if (! ("size" in options)) {
    data.size = 5;
  }

  if (! ("color" in options)) {
    data.color = 5;
  }

  if (! ("filled" in options)) {
    data.filled = true;
  }

  if (! ("tooltips" in options)) {
    var tooltipStrings = new Array();
    for (var i = 0; i < data.n; i++)  {
        tooltipStrings[i] = "x:" + data.xValues[i]
                       + ",\ny:" + data.yValues[i]
                       + ",\nz:" + data.zValues[i];
    }
    data.tooltips = tooltipStrings;
  }

  return data;
}

function get_surface_plot(element)
      {

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

        var background = '#ffffff';
        var axisForeColour = '#000000'; // Color of axis stuff
        var chartOrigin = {x: 200, y:300}; // Move the whole plot!
        
        options = {};
        // Options for the basic canvas pliot.
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

        // Default colour gradient.
        var colour1 = {red:0, green:0, blue:255};
        var colour2 = {red:0, green:255, blue:255};
        var colour3 = {red:0, green:255, blue:0};
        var colour4 = {red:255, green:255, blue:0};
        var colour5 = {red:255, green:0, blue:0};
        options.colourGradient = [colour1, colour2, colour3, colour4, colour5];

        surfacePlot = new SurfacePlot(element);
        surfacePlot.draw(options);
        // TODO: remove this layer of indirection
        return surfacePlot.surfacePlot;
}
      
// data has the following fields:
//  - zValues:  required
//  - xValues, yValues:  specify x and y coordinates.  Default to mesh([1, ... , n], [1, ... , m])
//  - Colors:  defaults to using normalized z values

/* converts serialized matrix from octave into array of arrays */
function parse_mat(x) 
{
  var res = [];
  var rows = x.rows, cols = x.cols;
  for(var i=0; i<rows; ++i){
    var row = [];
    for(var j=0; j<cols; ++j){
      row.push( x.data[i + j*rows] );
    }
    res.push(row);
  }
  res.rows = rows;
  res.cols = cols;
  return res;
}

function parse_surf_args(arg1, arg2, arg3, arg4) {
  var data = {}
  if (arg3 != undefined) {
    data.xValues = parse_mat(arg1)
    data.yValues = parse_mat(arg2)
    data.zValues = parse_mat(arg3)
    if (arg4 != undefined) {
      data.colors = parse_mat(arg4)
    }
  } else {
    //assert (arg1 != undefined) 
    data.zValues = parse_mat(arg1)
    if (arg2 != undefined) {
      data.colors = parse_mat(arg2)
    }
  } 
  return data;
}

function surf(surface_plot, arg1, arg2, arg3, arg4) {
  options = {}
  options.fill = true;
  data = parse_surf_args(arg1, arg2, arg3, arg4)
  data = get_surface_data_defaults(data);
  data.options = options;
  return surface_plot.add_surface_data(data, options)
}

function mesh(surface_plot, arg1, arg2, arg3, arg4) {
  options = {}
  options.fill = false
  data = parse_surf_args(arg1, arg2, arg3, arg4)
  data = get_surface_data_defaults(data);
  data.options = options;
  return surface_plot.add_surface_data(data, options)
}

//function scatter(element, data, options) {
//  options.fillPolygons = false
//  data = get_scatter_data_defaults(data);
//  plot3d(element, undefined, data, options)
//}
