/*
 * SurfacePlot.js
 *
 *
 * Written by Greg Ross
 *
 * Copyright 2012 ngmoco, LLC.  Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.  You may obtain a copy of 
 * the License at http://www.apache.org/licenses/LICENSE-2.0.  Unless required by applicable 
 * law or agreed to in writing, software distributed under the License is distributed on an 
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  
 * See the License for the specific language governing permissions and limitations under the 
 * License.
 *
 */

/*
 * This is the main class and entry point of the tool
 * and represents the Google viz API.
 * ***************************************************
 */
SurfacePlot = function(container)
{
    this.containerElement = container;
    
    this.redraw = function()
    {
        this.surfacePlot.init();
        this.surfacePlot.redraw();
    }
};


SurfacePlot.prototype.draw = function(surfaces_data, options)
{
    var xPos = options.xPos;
    var yPos = options.yPos;
    var w = options.width;
    var h = options.height;
    if ("colourGradient" in options) {
      var colourGradient = options.colourGradient;
    }
    else {
      // Default colour gradient.
      var colour1 = {red:0, green:0, blue:255};
      var colour2 = {red:0, green:255, blue:255};
      var colour3 = {red:0, green:255, blue:0};
      var colour4 = {red:255, green:255, blue:0};
      var colour5 = {red:255, green:0, blue:0};
      var colours = [colour1, colour2, colour3, colour4, colour5];
      var colourGradient = colours;
    }
    
    var fillPolygons = options.fillPolygons;
    var tooltips = options.tooltips;
    var renderPoints = options.renderPoints;
    
    var xTitle = options.xTitle;
    var yTitle = options.yTitle;
    var zTitle = options.zTitle;
    var backColour = options.backColour;
    var axisTextColour = options.axisTextColour;
    var tooltipColour = options.tooltipColour;
    var origin = options.origin;
    var startXAngle = options.startXAngle;
    var startZAngle = options.startZAngle;
    
    if (this.surfacePlot == undefined)
        this.surfacePlot = new JSSurfacePlot(xPos, yPos, w, h, colourGradient, this.containerElement, 
        fillPolygons, tooltips, 
        xTitle, yTitle, zTitle, 
        options.xTicks, options.yTicks, options.zTicks, 
        renderPoints, backColour, axisTextColour,
        tooltipColour, origin, startXAngle, startZAngle, surfaces_data);

    this.surfacePlot.redraw();
};

SurfacePlot.prototype.getChart = function()
{
	return this.surfacePlot;
}

SurfacePlot.prototype.cleanUp = function()
{
	if (this.surfacePlot == null)
		return;
		
	this.surfacePlot.cleanUp();
	this.surfacePlot = null;
}

/*
 * This class does most of the work.
 * *********************************
 */
JSSurfacePlot = function(x, y, width, height, colourGradient, targetElement,
    fillRegions, tooltips, 
    xTitle, yTitle, zTitle, 
    xTicks, yTicks, zTicks,
    renderPoints, backColour, axisTextColour,
    tooltipColour, origin, startXAngle, startZAngle, surfaces_data)
{
    this.xTitle = xTitle;
    this.yTitle = yTitle;
    this.zTitle = zTitle;
    this.xTicks = xTicks;
    this.yTicks = yTicks;
    this.zTicks = zTicks;

    this.tickLength = 0.05
    this.gridOn = true
    this.ticksOn = true

    this.backColour = backColour;
    this.axisTextColour = axisTextColour;
    var targetDiv;
    var id;
    var canvas;
    var canvasContext = null;
    this.context2D = null;
    var scale = JSSurfacePlot.DEFAULT_SCALE;
    var currentXAngle = JSSurfacePlot.DEFAULT_X_ANGLE;
    var currentZAngle = JSSurfacePlot.DEFAULT_Z_ANGLE;
    
    if (startXAngle != null && startXAngle != void 0)
        currentXAngle = startXAngle;
    
    if (startZAngle != null && startZAngle != void 0)
        currentZAngle = startZAngle;
        
    this.surfaces_data = surfaces_data;
    var surfaces_points = null;
    var displayValues = null;
    var transformation;
    var cameraPosition;
    var colourGradient;
    
    var mouseDown1 = false;
    var mouseDown3 = false;
    var mousePosX = null;
    var mousePosY = null;
    var lastMousePos = new Point(0, 0);
    var mouseButton1Up = null;
    var mouseButton3Up = null;
    var mouseButton1Down = new Point(0, 0);
    var mouseButton3Down = new Point(0, 0);
    var wheeldelta = 0;
    var closestPointToMouse = null;
    var closestSurfaceToMouse = null;
    var xAxisHeader = "";
    var yAxisHeader = "";
    var zAxisHeader = "";
    var xAxisTitleLabel = new Tooltip(true);
    var yAxisTitleLabel = new Tooltip(true);
    var zAxisTitleLabel = new Tooltip(true);
    var tTip = new Tooltip(false, tooltipColour);
    
  	var canvas_support_checked = false;
  	var canvas_supported = true;
	
	function getInternetExplorerVersion()    // Returns the version of Internet Explorer or a -1
    // (indicating the use of another browser).
    {
        var rv = -1; // Return value assumes failure.
        if (navigator.appName == 'Microsoft Internet Explorer') {
            var ua = navigator.userAgent;
            var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
            if (re.exec(ua) != null) 
                rv = parseFloat(RegExp.$1);
        }
        return rv;
    }
    
    function supports_canvas(){
        if (canvas_support_checked) return canvas_supported;
        
         canvas_support_checked = true;
         canvas_supported = !!document.createElement('canvas').getContext;
         return canvas_supported;
    }
    
    this.init = function()
    {
        if (id)
            targetElement.removeChild(targetDiv);
            
        id = this.allocateId();
        transformation = new Th3dtran();
        
        this.createTargetDiv(); 
        
        if (!targetDiv) 
            return;
        
        this.prepareData();
        this.createCanvas();
    };
    
    this.prepareData = function()
    {

    	this.minXValue = Number.MAX_VALUE;
      this.maxXValue = Number.MIN_VALUE;
    	this.minYValue = Number.MAX_VALUE;
      this.maxYValue = Number.MIN_VALUE;
    	this.minZValue = Number.MAX_VALUE;
      this.maxZValue = Number.MIN_VALUE;
        
      for (var k = 0; k < this.surfaces_data.length; k++) {
        surface_data = this.surfaces_data[k];
        surface_data.n = surface_data.zValues.length;
        surface_data.m = surface_data.zValues[0].length;

        for (var i = 0; i < surface_data.n; i++) {
          for (var j = 0; j < surface_data.m; j++) {
            var x = surface_data.xValues[i][j];
            var y = surface_data.yValues[i][j];
            var z = surface_data.zValues[i][j];
            
            if (x < this.minXValue) this.minXValue = x;
            if (x > this.maxXValue) this.maxXValue = x;
            if (y < this.minYValue) this.minYValue = y;
            if (y > this.maxYValue) this.maxYValue = y;
            if (z < this.minZValue) this.minZValue = z;
            if (z > this.maxZValue) this.maxZValue = z;
          }
        }
      }

      this.maxZDataValue = this.maxZValue;
      this.minZDataValue = this.minZValue;

      if (this.xTicks == undefined) 
        this.xTicks = this.calculateTicks(this.minXValue, this.maxXValue);
      if (this.yTicks == undefined) 
        this.yTicks = this.calculateTicks(this.minYValue, this.maxYValue);
      if (this.zTicks == undefined) 
        this.zTicks = this.calculateTicks(this.minZValue, this.maxZValue);

      for (i = 0; i < this.xTicks.length; i++) {
        var x = this.xTicks[i];
        if (x < this.minXValue) this.minXValue = x;
        if (x > this.maxXValue) this.maxXValue = x;
      }
      for (i = 0; i < this.yTicks.length; i++) {
        var y = this.yTicks[i];
        if (y < this.minYValue) this.minYValue = y;
        if (y > this.maxYValue) this.maxYValue = y;
      }
      for (i = 0; i < this.zTicks.length; i++) {
        var z = this.zTicks[i];
        if (z < this.minZValue) this.minZValue = z;
        if (z > this.maxZValue) this.maxZValue = z;
      }

    }
    
    this.cleanUp = function()
    {
    	canvas.onmousedown = null;
  		document.onmouseup = null;
  		document.onmousemove = null;
      document.onmousewheel = null;
		
      canvasContext = null;
      this.surfaces_data = null;
      this.colourGradientObject = null;
    }
    
    function hideTooltip()
    {
        tTip.hide();
    }
    
    function displayTooltip(e)
    {
        var position = new Point(e.x, e.y);
        tTip.show(tooltips[closestPointToMouse], 200);
    }
    
    this.render = function()
    {
          canvasContext.clearRect(0, 0, canvas.width, canvas.height);
          canvasContext.fillStyle = this.backColour;
          canvasContext.fillRect(0, 0, canvas.width, canvas.height);
          
          var canvasWidth = width;
          var canvasHeight = height;
          
          var minMargin = 20;
          var drawingDim = canvasWidth - minMargin * 2;
          var marginX = minMargin;
          var marginY = minMargin;
          
          transformation.init();
          transformation.rotate(currentXAngle, 0.0, currentZAngle);
          transformation.scale(scale);
          
          if (origin != null && origin != void 0)
              transformation.translate(origin.x, origin.y, 0.0);  
          else
              transformation.translate(drawingDim / 2.0 + marginX, drawingDim / 2.0 + marginY, 0.0);
          
          cameraPosition = new Point3D(drawingDim / 2.0 + marginX, drawingDim / 2.0 + marginY, -1000.0);
        
          //if (renderPoints)
          //{
          //    for (i = 0; i < surface_points.length; i++) {
          //        canvasContext.fillStyle = '#ff2222';
          //        var point = transformation.transformPoint(surface_points[i]);
          //        point.dist = distance({x:point.ax, y:point.ay}, {x:cameraPosition.ax, y:cameraPosition.ay});
          //        
          //        var x = point.ax;
          //        var y = point.ay;
          //        
          //        canvasContext.beginPath();
          //        var dotSize = JSSurfacePlot.DATA_DOT_SIZE;
          //        
          //        canvasContext.arc(x, y, dotSize, 0, self.Math.PI * 2, true);
          //        canvasContext.fill();
          //    }
          //}

          var yzFaceCenterPoint = transformation.transformPoint(new Point3D(-0.5, 0, 0));
          var xzFaceCenterPoint = transformation.transformPoint(new Point3D(0, 0.5, 0));
          var xyFaceCenterPoint = transformation.transformPoint(new Point3D(0, 0, -0.5));
  
          var yzOppositePoint = transformation.transformPoint(new Point3D(0.5, 0, 0));
          var xzOppositePoint = transformation.transformPoint(new Point3D(0, -0.5, 0));
          var xyOppositePoint = transformation.transformPoint(new Point3D(0, 0, 0.5));
  
          this.showX = ((euclidian_distance(cameraPosition, xzFaceCenterPoint) > euclidian_distance(cameraPosition, xzOppositePoint)) ||
              (euclidian_distance(cameraPosition, xyFaceCenterPoint) > euclidian_distance(cameraPosition, xyOppositePoint)))
  
          this.showY = ((euclidian_distance(cameraPosition, xyFaceCenterPoint) > euclidian_distance(cameraPosition, xyOppositePoint)) ||
              (euclidian_distance(cameraPosition, yzFaceCenterPoint) > euclidian_distance(cameraPosition, yzOppositePoint)))
  
          this.showZ = ((euclidian_distance(cameraPosition, xzFaceCenterPoint) > euclidian_distance(cameraPosition, xzOppositePoint)) ||
              (euclidian_distance(cameraPosition, yzFaceCenterPoint) > euclidian_distance(cameraPosition, yzOppositePoint)))
  
          var polygons = new Array();

          for (k = 0; k < surfaces_points.length; k++) {
            var surface_points = surfaces_points[k];
            var surface_polygons = this.createPolygons(surface_points);

            for (i = 0; i < surface_polygons.length; i++)
              polygons[polygons.length] = surface_polygons[i];
          }

          var axes = this.createAxes();
          for (i = 0; i < axes.length; i++)
            polygons[polygons.length] = axes[i];

          if (this.gridOn) {
            var grid = this.createGrid();
            for (i = 0; i < grid.length; i++)
              polygons[polygons.length] = grid[i];
          }

          if (this.ticksOn) {
            var ticks = this.createTicks();
            for (i = 0; i < ticks.length; i++)
              polygons[polygons.length] = ticks[i];
          }
        
          // Sort the polygons so that the closest ones are rendered last
          // and therefore are not occluded by those behind them.
          // This is really Painter's algorithm.
          polygons.sort(PolygonComparator);
          
          canvasContext.lineWidth = 1;
          canvasContext.lineJoin = "round";
        
          for (i = 0; i < polygons.length; i++)
          {
              var polygon = polygons[i];
              
              if (polygon.type == "data") 
              {
                  var p1 = polygon.getPoint(0);
                  var p2 = polygon.getPoint(1);
                  var p3 = polygon.getPoint(2);
                  var p4 = polygon.getPoint(3);

                  var colourValue = (p1.color * 1.0 + p2.color * 1.0 + p3.color * 1.0 + p4.color * 1.0) / 4.0;
                  
                  var rgbColour = this.colourGradientObject.getColour(colourValue);
                  var colr = "rgb(" + rgbColour.red + "," + rgbColour.green + "," + rgbColour.blue + ")";
                  canvasContext.fillStyle = colr;
                  canvasContext.strokeStyle = colr;
          
                  canvasContext.beginPath();
                  canvasContext.moveTo(p1.ax, p1.ay);
                  canvasContext.lineTo(p2.ax, p2.ay);
                  canvasContext.lineTo(p3.ax, p3.ay);
                  canvasContext.lineTo(p4.ax, p4.ay);
                  canvasContext.lineTo(p1.ax, p1.ay);
                  
                  if (fillRegions)
                      canvasContext.fill();
                  else
                      canvasContext.stroke();
              }
              else  // drawing a line of some sort
              {
                  var p1 = polygon.getPoint(0);
                  var p2 = polygon.getPoint(1);
                  canvasContext.beginPath();
                  canvasContext.moveTo(p1.ax, p1.ay);
                  canvasContext.lineTo(p2.ax, p2.ay);
                  if (polygon.type == "axis") {
                      canvasContext.strokeStyle='rgb(0, 0, 0)'; // axis color
                  } else if (polygon.type == "tick") {
                      canvasContext.strokeStyle='rgba(0, 0, 0, 0.5)'; // axis color
                  } else if (polygon.type == "grid") {
                      canvasContext.strokeStyle='rgba(0, 0, 0, 0.1)'; // axis color
                  }
                  canvasContext.stroke();
              }
          }
          
          if (supports_canvas())
              this.renderAxisText();
        
    };
    

    // Draw axis labels
    this.renderAxisText = function()
    {
        var axisshift = 0.1
        var labelshift = this.tickLength + 0.05;

        var xLabelPoint = transformation.transformPoint(new Point3D(0.5 + axisshift, 0.5, -0.5));
        var yLabelPoint = transformation.transformPoint(new Point3D(-0.5, -0.5 - axisshift, -0.5));
        var zLabelPoint = transformation.transformPoint(new Point3D(-0.5, 0.5, 0.5 + axisshift));

        var axisfont = 'bold 18px sans-serif'
        var labelfont = '12px sans-serif'
        canvasContext.textAlign = 'center'; 

        canvasContext.fillStyle = this.axisTextColour;

        if (this.showX) {
            canvasContext.font = axisfont; 
            canvasContext.fillText(xTitle, xLabelPoint.ax, xLabelPoint.ay);

            if (this.ticksOn) {
              for (i = 0; i < this.xTicks.length; i+= 1) {
                val = this.xTicks[i];
                x = this.scale_to(val, this.minXValue, this.maxXValue);
                var point = transformation.transformPoint(
                                new Point3D(x, 0.5 + labelshift, -0.5));
                canvasContext.font = labelfont; 
                canvasContext.fillText(val, point.ax, point.ay);
              }
            }
        }
        
        if (this.showY) {
            canvasContext.font = axisfont; 
            canvasContext.fillText(yTitle, yLabelPoint.ax, yLabelPoint.ay);

            if (this.ticksOn) {
              for (i = 0; i < this.yTicks.length; i+= 1) {
                val = this.yTicks[i];
                y = this.scale_to(val, this.minYValue, this.maxYValue);
                var point = transformation.transformPoint(
                                new Point3D(-0.5 - labelshift, y, -0.5));
                canvasContext.font = labelfont; 
                canvasContext.fillText(val, point.ax, point.ay);
              }
            }
        }
        
        if (this.showZ) {
            canvasContext.font = axisfont; 
            canvasContext.fillText(zTitle, zLabelPoint.ax, zLabelPoint.ay);

            if (this.ticksOn) {
              for (i = 0; i < this.zTicks.length; i+= 1) {
                val = this.zTicks[i];
                z = this.scale_to(val, this.minZValue, this.maxZValue);
                var point = transformation.transformPoint(
                                new Point3D(-0.5 - labelshift, 0.5 + labelshift, z));
                canvasContext.font = labelfont; 
                canvasContext.fillText(val, point.ax, point.ay);
              }
            }
        }
    };
    
    this.createAxes = function()
    {
        var axisOrigin = transformation.transformPoint(new Point3D(-0.5, 0.5, -0.5));
        var xAxisEndPoint = transformation.transformPoint(new Point3D(0.5, 0.5, -0.5));
        var yAxisEndPoint = transformation.transformPoint(new Point3D(-0.5, -0.5, -0.5));
        var zAxisEndPoint = transformation.transformPoint(new Point3D(-0.5, 0.5, 0.5));

        var axes = new Array();

        var xAxis = new Polygon(cameraPosition, "axis");
        xAxis.addPoint(axisOrigin);
        xAxis.addPoint(xAxisEndPoint);
        xAxis.done()
        axes[axes.length] = xAxis;

        var yAxis = new Polygon(cameraPosition, "axis");
        yAxis.addPoint(axisOrigin);
        yAxis.addPoint(yAxisEndPoint);
        yAxis.done()
        axes[axes.length] = yAxis;

        var zAxis = new Polygon(cameraPosition, "axis");
        zAxis.addPoint(axisOrigin);
        zAxis.addPoint(zAxisEndPoint);
        zAxis.done()
        axes[axes.length] = zAxis;
        
        return axes;
    };
    
    this.createTicks = function()
    {
        var ticks = new Array();

        if (this.showX) {
          for (xi = 0; xi < this.xTicks.length; xi ++) {
            x = this.scale_to(this.xTicks[xi], this.minXValue, this.maxXValue)
            var line = new Polygon(cameraPosition, "tick");
            line.addPoint(transformation.transformPoint(new Point3D(x, 0.5, -0.5)));
            line.addPoint(transformation.transformPoint(new Point3D(x, 0.5 + this.tickLength, -0.5)));
            line.done()
            ticks[ticks.length] = line;
          }
        }

        if (this.showY) {
          for (yi = 0; yi < this.yTicks.length; yi ++) {
            y = this.scale_to(this.yTicks[yi], this.minYValue, this.maxYValue)
            var line = new Polygon(cameraPosition, "tick");
            line.addPoint(transformation.transformPoint(new Point3D(-0.5, y, -0.5)));
            line.addPoint(transformation.transformPoint(new Point3D(-0.5 - this.tickLength, y, -0.5)));
            line.done()
            ticks[ticks.length] = line;
          }
        }

        if (this.showZ) {
          for (zi = 0; zi < this.zTicks.length; zi ++) {
            z = this.scale_to(this.zTicks[zi], this.minZValue, this.maxZValue)
            var line = new Polygon(cameraPosition, "tick");
            line.addPoint(transformation.transformPoint(new Point3D(-0.5, 0.5, z)));
            line.addPoint(transformation.transformPoint(new Point3D(-0.5 - this.tickLength, 0.5 + this.tickLength, z)));
            line.done()
            ticks[ticks.length] = line;
          }
        }

        return ticks
    }
        
    this.createGrid = function()
    {
        var gridlines = new Array();

        for (yi = 0; yi < this.yTicks.length; yi ++) {
          for (zi = 0; zi < this.zTicks.length; zi ++) {
            y = this.scale_to(this.yTicks[yi], this.minYValue, this.maxYValue)
            z = this.scale_to(this.zTicks[zi], this.minZValue, this.maxZValue)
            var line = new Polygon(cameraPosition, "grid");
            line.addPoint(transformation.transformPoint(new Point3D(-0.5, y, z)));
            line.addPoint(transformation.transformPoint(new Point3D(0.5, y, z)));
            line.done()
            gridlines[gridlines.length] = line;
          }
        }
        
        for (xi = 0; xi < this.xTicks.length; xi ++) {
          for (zi = 0; zi < this.zTicks.length; zi ++) {
            x = this.scale_to(this.xTicks[xi], this.minXValue, this.maxXValue)
            z = this.scale_to(this.zTicks[zi], this.minZValue, this.maxZValue)
            var line = new Polygon(cameraPosition, "grid");
            line.addPoint(transformation.transformPoint(new Point3D(x, -0.5, z)));
            line.addPoint(transformation.transformPoint(new Point3D(x, 0.5, z)));
            line.done()
            gridlines[gridlines.length] = line;
          }
        }
        
        for (xi = 0; xi < this.xTicks.length; xi ++) {
          for (yi = 0; yi < this.yTicks.length; yi ++) {
            x = this.scale_to(this.xTicks[xi], this.minXValue, this.maxXValue)
            y = this.scale_to(this.yTicks[yi], this.minYValue, this.maxYValue)
            var line = new Polygon(cameraPosition, "grid");
            line.addPoint(transformation.transformPoint(new Point3D(x, y, -0.5)));
            line.addPoint(transformation.transformPoint(new Point3D(x, y, 0.5)));
            line.done()
            gridlines[gridlines.length] = line;
          }
        }
        
        return gridlines;
    };
    
    this.createPolygons = function(surface_points)
    {
        var polygons = new Array();
        var n = surface_points.length
        var m = surface_points[0].length
        for (var i = 0; i < n - 1; i++)
        {
            for (var j = 0; j < m-1; j++)
            {
                var polygon = new Polygon(cameraPosition, "data");
                
                polygon.addPoint(transformation.transformPoint(
                                     surface_points[i][j]));
                polygon.addPoint(transformation.transformPoint(
                                     surface_points[i+1][j]));
                polygon.addPoint(transformation.transformPoint(
                                     surface_points[i+1][j+1]));
                polygon.addPoint(transformation.transformPoint(
                                     surface_points[i][j+1]));
                polygon.done()

                polygons[polygons.length] = polygon;
            }
        }
        return polygons;
    };
    
    var sort = function(array)
    {
        var len = array.length;

        if(len < 2) { return array; }
        
        var pivot = Math.ceil(len/2);
        return merge(sort(array.slice(0,pivot)), sort(array.slice(pivot)));
    };
 
    var merge = function(left, right)
    {
        var result = [];
        while((left.length > 0) && (right.length > 0))
        {
            if(left[0].distanceFromCamera < right[0].distanceFromCamera)
                result.push(left.shift());
            else
                result.push(right.shift());
        }
        return result.concat(left, right);
    };
    
    this.getDefaultColourRamp = function()
    {
        var colour1 = {red:0, green:0, blue:255};
        var colour2 = {red:0, green:255, blue:255};
        var colour3 = {red:0, green:255, blue:0};
        var colour4 = {red:255, green:255, blue:0};
        var colour5 = {red:255, green:0, blue:0};
        return [colour1, colour2, colour3, colour4, colour5];
    };
    
    this.redraw = function()
    {
        var cGradient;
        
        if (colourGradient)
            cGradient = colourGradient;
        else
            cGradient = getDefaultColourRamp();
        
        this.colourGradientObject = new ColourGradient(-1, 1, cGradient);
        
        var canvasWidth = width;
        var canvasHeight = height;
        
        var minMargin = 20;
        var drawingDim = canvasWidth - minMargin * 2;
        var marginX = minMargin;
        var marginY = minMargin;
        
        if (canvasWidth > canvasHeight)
        {
            drawingDim = canvasHeight - minMargin * 2;
            marginX = (canvasWidth - drawingDim) / 2;
        }
        else if (canvasWidth < canvasHeight)
        {
            drawingDim = canvasWidth - minMargin * 2;
            marginY = (canvasHeight - drawingDim) / 2;
        }
        
        surfaces_points = new Array();
        for (var k = 0; k < this.surfaces_data.length; k++) {
            var surface_data = surfaces_data[k];
            var numPoints = surface_data.n * surface_data.m;
            surface_points = new Array();
            for (var i = 0; i < surface_data.n; i++) {
                surface_points_row = new Array();
                for (var j = 0; j < surface_data.m; j++) {
                    var x = this.scale_to(surface_data.xValues[i][j], this.minXValue, this.maxXValue);
                    var y = this.scale_to(surface_data.yValues[i][j], this.minYValue, this.maxYValue);
                    var z = this.scale_to(surface_data.zValues[i][j], this.minZValue, this.maxZValue);
                    if ("Colors" in surface_data) {
                      var color = surface_data.Colors[i][j];
                    } else {
                      var color = this.scale_to(surface_data.zValues[i][j], this.minZDataValue, this.maxZDataValue, -1, 1);
                    }
                    surface_points_row[surface_points_row.length] = new Point3D(x, y, z, color);
                }
                surface_points[surface_points.length] = surface_points_row;
            }
            surfaces_points[surfaces_points.length] = surface_points;
        }
        
        this.render();
    };
    
    this.allocateId = function()
    {
        var count = 0;
        var name = "surfacePlot";
        
        do
        {
            count++;
        }
        while(document.getElementById(name+count))
            return name+count;
    };
    
    this.createTargetDiv = function()
    {
        targetDiv = document.createElement("div");
        targetDiv.id = id;
        targetDiv.className = "surfaceplot";
        targetDiv.style.background = '#ffffff';
        targetDiv.style.position = 'absolute';
        
        if (!targetElement) 
            return;//document.body.appendChild(this.targetDiv);
        else 
        {
            targetDiv.style.position = 'relative';
            targetElement.appendChild(targetDiv);
        }
        
        targetDiv.style.left = x + "px";
        targetDiv.style.top = y + "px";
    };
    
    
    this.initCanvas = function()
    {
        canvas.className = "surfacePlotCanvas";
        canvas.setAttribute("width", width);
        canvas.setAttribute("height", height);
        canvas.style.left = '0px';
        canvas.style.top =  '0px';
        
        targetDiv.appendChild(canvas);
    };
    
    this.log = function(base, value)
  	{
  		return Math.log(value) / Math.log(base);
  	}
  
    this.scale_to = function(x, min, max, scaled_min, scaled_max)
    {
      if (scaled_min == undefined) scaled_min = -0.5;
      if (scaled_max == undefined) scaled_max = 0.5;
      var a = (scaled_max - scaled_min) / (max - min + 0.0)
      var b = scaled_max - a * max
      return a * x + b
    }

  	this.nice_num = function(x, rounddown)
  	{
      if (x == 0) {
        return 0;
      } else if (x < 0) {
        return - this.nice_num(-x, !rounddown)
      }

	  	var exp = Math.floor(this.log(10, x));
	  	var f = x/Math.pow(10, exp);
	  	var nf;
  	
	  	if (rounddown)
	  	{
        if (f >= 10)	nf = 10;
        else if (f >= 5)	nf = 5;
        else if (f >= 2)	nf = 2;
        else nf = 1;
	  	}	else {
        if (f <= 1)	nf = 1;
        else if (f <= 2)	nf = 2;
        else if (f <= 5)	nf = 5;
        else nf = 10;
	  	}
	  	
	  	return nf * Math.pow(10, exp);
	}
    
    this.calculateTicks = function(min, max)
    {
      	// Automatically generate ticks, given a min and max value.
        var tickwidth = this.nice_num((max - min) / 2, true);
      	var tick = tickwidth * Math.floor( min / tickwidth);
		    var ticks = [];
		    
		    while (tick < max)
		    {
		    	ticks.push(tick);
          tick += tickwidth;
		    }
		    ticks.push(tick);

        return ticks
    }
    
    this.createCanvas = function()
    {
        canvas = document.createElement("canvas");
        
        if (!supports_canvas())
        {
            G_vmlCanvasManager.initElement(canvas);
            canvas.style.width = width;
            canvas.style.height = height;
        }
        else
        {
            this.initCanvas();
        }
            
        
        targetDiv.removeChild(canvas);
        canvas = document.createElement("canvas");
       
        this.initCanvas();
        
        canvasContext = canvas.getContext("2d");
        canvasContext.font = "bold 18px sans-serif";
        canvasContext.clearRect(0, 0, canvas.width, canvas.height);
        
        canvasContext.fillStyle = '#000';
        
        canvasContext.fillRect(0, 0, canvas.width, canvas.height);
        
        canvasContext.beginPath();
        canvasContext.rect(0, 0, canvas.width, canvas.height);
        canvasContext.strokeStyle='#888';
        canvasContext.stroke();
        
        canvas.owner = this;
        canvas.onmousemove = this.mouseIsMoving;
        canvas.onmouseout = hideTooltip;
        canvas.onmousedown = this.mouseDownd;
        canvas.onmouseup = this.mouseUpd;
        canvas.onmousewheel = this.mouseWheel;
    };
    
    this.createHiddenCanvasForGLText = function()
    {
        var hiddenCanvas = document.createElement("canvas");
        hiddenCanvas.setAttribute("width", 512);
        hiddenCanvas.setAttribute("height", 512);
        this.context2D = hiddenCanvas.getContext('2d');
        hiddenCanvas.style.display = 'none';
        targetDiv.appendChild(hiddenCanvas);
    };
    
    this.mouseWheel = function(e)
    {
        wheeldelta = 0;
        if (!e) /* For IE. */
                e = window.event;
        if (e.wheelDelta) { /* IE/Opera. */
                wheeldelta = e.wheelDelta/120;
        } else if (e.detail) { /** Mozilla case. */
                /** In Mozilla, sign of delta is different than in IE.
                 * Also, delta is multiple of 3.
                 */
                wheeldelta = -e.detail/3;
        }
        /** If delta is nonzero, handle it.
         * Basically, delta is now positive if wheel was scrolled up,
         * and negative, if wheel was scrolled down.
         */
        if (wheeldelta) {
            //var self = e.target.owner;
            //var currentPos = getMousePositionFromEvent(e);
            //self.calculateScale(currentPos);
            scale *= (wheeldelta > 0) ? 1.05 : 0.95;
            e.target.owner.render()
            //(1 + 0.000001 * wheeldelta) * JSSurfacePlot.SCALE_FACTOR;
        }
        /** Prevent default actions caused by mouse wheel.
         * That might be ugly, but we handle scrolls somehow
         * anyway, so don't bother here..
         */
        if (e.preventDefault)
                e.preventDefault();
        e.returnValue = false;
    }

    // Mouse events for the non-webGL version of the surface plot.
    this.mouseDownd = function(e)
    {   
        if (isShiftPressed(e))
        {
            mouseDown3 = true;
            mouseButton3Down = getMousePositionFromEvent(e);
        }
        else
        {
            mouseDown1 = true;
            mouseButton1Down = getMousePositionFromEvent(e);
        }
    };
    
    this.mouseUpd = function(e)
    {
        if (mouseDown1)
        {
            mouseButton1Up = lastMousePos;
        }
        else if (mouseDown3)
            {
                mouseButton3Up = lastMousePos;
            }
            
        mouseDown1 = false;
        mouseDown3 = false;
    };
    
    this.mouseIsMoving = function(e)
    {
        var self = e.target.owner;
        var currentPos = getMousePositionFromEvent(e);
        
        if (mouseDown1)
        {
            hideTooltip();
            self.calculateRotation(currentPos);
        }
        else if (mouseDown3)
        {
            hideTooltip();
            self.calculateScale(currentPos);
        }
        else
        {
            closestPointToMouse = null;
            closestSurfaceToMouse = null;
            var closestDist = Number.MAX_VALUE;
            
            for (var k = 0; i < surfaces_points.length; k++) {
              surface_points = surfaces_points[k];
              var n = surface_points.length;
              var m = surface_points[0].length;
              for (var i = 0; i < n; i++) {
                for (var j = 0; j < n; j++) {
                  var point = surface_points[i][j];
                  var dist = distance({x:point.ax, y:point.ay}, currentPos);
    
                  if (dist < closestDist)
                  {
                      closestDist = dist;
                      closestXToMouse = i;
                      closestYToMouse = j;
                      closestSurfaceToMouse = k;
                  }
                }
              }
            }

            if (closestDist > 32)
            {
                hideTooltip();
                return;
            }
            
            displayTooltip(currentPos);
        }
    };
    
    function isShiftPressed(e)
    {
        var shiftPressed=0;

         if (parseInt(navigator.appVersion)>3)
         {
            var evt = navigator.appName=="Netscape" ? e:event;

            if (navigator.appName=="Netscape" && parseInt(navigator.appVersion)==4)
            {
                // NETSCAPE 4 CODE
                var mString =(e.modifiers+32).toString(2).substring(3,6);
                shiftPressed=(mString.charAt(0)=="1");
            }
            else
            {
                // NEWER BROWSERS [CROSS-PLATFORM]
                shiftPressed=evt.shiftKey;
            }
            
            if (shiftPressed) 
                return true;
        }
        
        return false;
    }
    
    function getMousePositionFromEvent(e)
    {
        if (getInternetExplorerVersion() > -1)
        {
            var e = window.event;
            
            if (e.srcElement.getAttribute('Stroked'))
            {
                if (mousePosX == null || mousePosY == null)
                    return;
            }
            else
            {
                mousePosX = e.offsetX;
                mousePosY = e.offsetY;
            }
        }
        else if (e.layerX || e.layerX == 0) // Firefox
        {
            mousePosX = e.layerX;
            mousePosY = e.layerY;
        }
        else if (e.offsetX || e.offsetX == 0) // Opera
        {
            mousePosX = e.offsetX;
            mousePosY = e.offsetY;
        }
        
        var currentPos = new Point(mousePosX, mousePosY);
        
        return currentPos;
    }
    
    this.calculateRotation = function(e)
    {
        lastMousePos = new Point(JSSurfacePlot.DEFAULT_Z_ANGLE, JSSurfacePlot.DEFAULT_X_ANGLE);

        if (mouseButton1Up == null)
        {
            mouseButton1Up = new Point(JSSurfacePlot.DEFAULT_Z_ANGLE, JSSurfacePlot.DEFAULT_X_ANGLE);
        }

        if (mouseButton1Down != null)
        {
            lastMousePos = new Point(mouseButton1Up.x + (mouseButton1Down.x - e.x),//
            mouseButton1Up.y + (mouseButton1Down.y - e.y));
        }

        currentZAngle = lastMousePos.x % 360;
        currentXAngle = lastMousePos.y % 360;

        closestPointToMouse = null;
        closestSurfaceToMouse = null;
        this.render();
    };
    
    this.calculateScale = function(e)
    {
        lastMousePos = new Point(0, JSSurfacePlot.DEFAULT_SCALE/JSSurfacePlot.SCALE_FACTOR);

        if (mouseButton3Up == null)
        {
            mouseButton3Up = new Point(0, JSSurfacePlot.DEFAULT_SCALE/JSSurfacePlot.SCALE_FACTOR);
        }

        if (mouseButton3Down != null)
        {
            lastMousePos = new Point(mouseButton3Up.x + (mouseButton3Down.x - e.x),//
            mouseButton3Up.y + (mouseButton3Down.y - e.y));
        }

          scale = lastMousePos.y * JSSurfacePlot.SCALE_FACTOR;

        if (scale < JSSurfacePlot.MIN_SCALE)
            scale = 0.95 // JSSurfacePlot.MIN_SCALE + 1;
        else if (scale > JSSurfacePlot.MAX_SCALE)
            scale = 1.05 // JSSurfacePlot.MAX_SCALE - 1;

        lastMousePos.y = scale / JSSurfacePlot.SCALE_FACTOR;

        closestPointToMouse = null;
        closestSurfaceToMouse = null;
        this.render();
    };
    
    this.init();
};


/**
* Given two coordinates, return the Euclidean distance
* between them
*/
function distance(p1, p2)
{
    return Math.sqrt(((p1.x - p2.x) * (p1.x - 
        p2.x)) + ((p1.y - p2.y) * (p1.y - p2.y)));
}

/*
 * Matrix3d: This class represents a 3D matrix.
 * ********************************************
 */
Matrix3d = function()
{
    this.matrix = new Array();
    this.numRows = 4;
    this.numCols = 4;
    
    this.init = function()
    {
        this.matrix = new Array();
        
        for (var i = 0; i < this.numRows; i++)
        {
            this.matrix[i] = new Array();
        }
    };

    this.getMatrix = function()
    {
        return this.matrix;
    };

    this.matrixReset = function()
    {
        for (var i = 0; i < this.numRows; i++)
        {
            for (var j = 0; j < this.numCols; j++)
            {
                this.matrix[i][j] = 0;
            }
        }
    };

    this.matrixIdentity = function()
    {
        this.matrixReset();
        this.matrix[0][0] = this.matrix[1][1] = this.matrix[2][2] = this.matrix[3][3] = 1;
    };

    this.matrixCopy = function(newM)
    {
        var temp = new Matrix3d();
        var i, j;

        for (i = 0; i < this.numRows; i++)
        {
            for (j = 0; j < this.numCols; j++)
            {
                temp.getMatrix()[i][j] = (this.matrix[i][0] * newM.getMatrix()[0][j]) + (this.matrix[i][1] * newM.getMatrix()[1][j]) + (this.matrix[i][2] * newM.getMatrix()[2][j]) + (this.matrix[i][3] * newM.getMatrix()[3][j]);
            }
        }

        for (i = 0; i < this.numRows; i++)
        {
            this.matrix[i][0] = temp.getMatrix()[i][0];
            this.matrix[i][1] = temp.getMatrix()[i][1];
            this.matrix[i][2] = temp.getMatrix()[i][2];
            this.matrix[i][3] = temp.getMatrix()[i][3];
        }
    };

    this.matrixMult = function(m1, m2)
    {
        var temp = new Matrix3d();
        var i, j;
        
        for (i = 0; i < this.numRows; i++)
        {
            for (j = 0; j < this.numCols; j++)
            {
                temp.getMatrix()[i][j] = (m2.getMatrix()[i][0] * m1.getMatrix()[0][j]) + (m2.getMatrix()[i][1] * m1.getMatrix()[1][j]) + (m2.getMatrix()[i][2] * m1.getMatrix()[2][j]) + (m2.getMatrix()[i][3] * m1.getMatrix()[3][j]);
            }
        }
        
        for (i = 0; i < this.numRows; i++)
        {
            m1.getMatrix()[i][0] = temp.getMatrix()[i][0];
            m1.getMatrix()[i][1] = temp.getMatrix()[i][1];
            m1.getMatrix()[i][2] = temp.getMatrix()[i][2];
            m1.getMatrix()[i][3] = temp.getMatrix()[i][3];
        }
    };
    
    this.toString = function()
    {
    	return this.matrix.toString();
    }
    
    this.init();
};

/*
 * Point3D: This class represents a 3D point.
 * ******************************************
 */
Point3D = function(x, y, z, color)
{
    this.displayValue = "";

    this.lx;
    this.ly;
    this.lz;
    this.lt;

    this.color;
    
    this.wx;
    this.wy;
    this.wz;
    this.wt;
    
    this.ax;
    this.ay;
    this.az;
    this.at;
    
    this.dist;

    this.initPoint = function()
    {
        this.lx = this.ly = this.lz = this.ax = this.ay = this.az = this.at = this.wx = this.wy = this.wz = 0;
        this.lt = this.wt = 1;
        this.color = 0;
    };
    
    this.init = function(x, y, z, color)
    {
        this.initPoint();
        this.lx = x;
        this.ly = y;
        this.lz = z;

        if (color === undefined) {
          this.color = this.lz
        } else {
          this.color = color;
        }
        
        this.ax = this.lx;
        this.ay = this.ly;
        this.az = this.lz;
    };

    this.init(x, y, z, color);
};

euclidian_distance = function(p1, p2)
{
    return ((p1.ax-p2.ax)*(p1.ax-p2.ax))+((p1.ay-p2.ay)*(p1.ay-p2.ay))+((p1.az-p2.az)*(p1.az-p2.az));
};

/*
 * Polygon: This class represents a polygon on the surface plot.
 * ************************************************************
 */
Polygon = function(cameraPosition, type)
{
    this.points = new Array();
    this.cameraPosition = cameraPosition;
    this.type = type;
    this.centroid = null;
    this.distanceFromCamera = null;
    
    this.addPoint = function(point)
    {
        this.points[this.points.length] = point;
    };
    
    this.done = function()
    {
        var xCentre = 0;
        var yCentre = 0;
        var zCentre = 0;
        
        var numPoints = this.points.length * 1.0;
        
        for (var i = 0; i < numPoints; i++)
        {
            xCentre += this.points[i].ax;
            yCentre += this.points[i].ay;
            zCentre += this.points[i].az;
        }
        
        xCentre /= numPoints;
        yCentre /= numPoints;
        zCentre /= numPoints;
        
        this.centroid = new Point3D(xCentre, yCentre, zCentre);

        this.distanceFromCamera = euclidian_distance(this.cameraPosition, this.centroid);
    };
    
    this.getPoint = function(i)
    {
        return this.points[i];
    };
};

/*
 * PolygonComparator: Class used to sort arrays of polygons.
 * ************************************************************
 */
PolygonComparator = function(p1, p2)
{
    var diff = p1.distanceFromCamera - p2.distanceFromCamera;
    
    if (diff < 0)
        return -1;
    else if (diff > 0)
        return 1;
    else
        return 0;
};

/*
 * Th3dtran: Class for matrix manipuation.
 * ************************************************************
 */
Th3dtran = function()
{
    this.rMat;
    this.rMatrix;
    this.objectMatrix;

    this.init = function()
    {
        this.rMat = new Matrix3d();
        this.rMatrix = new Matrix3d();
        this.objectMatrix = new Matrix3d();

        this.initMatrix();
    };

    this.initMatrix = function()
    {
        this.objectMatrix.matrixIdentity();
    };

    this.translate = function(x, y, z)
    {
        this.rMat.matrixIdentity();
        this.rMat.getMatrix()[3][0] = x;
        this.rMat.getMatrix()[3][1] = y;
        this.rMat.getMatrix()[3][2] = z;
        
        this.objectMatrix.matrixCopy(this.rMat);
    };

    this.rotate = function(x, y, z)
    {
        var rx = x * (Math.PI/180.0);
        var ry = y * (Math.PI/180.0);
        var rz = z * (Math.PI/180.0);
        
        this.rMatrix.matrixIdentity();
        this.rMat.matrixIdentity();
        this.rMat.getMatrix()[1][1] = Math.cos(rx);
        this.rMat.getMatrix()[1][2] = Math.sin(rx);
        this.rMat.getMatrix()[2][1] = -(Math.sin(rx));
        this.rMat.getMatrix()[2][2] = Math.cos(rx);
        this.rMatrix.matrixMult(this.rMatrix, this.rMat);

        this.rMat.matrixIdentity();
        this.rMat.getMatrix()[0][0] = Math.cos(ry);
        this.rMat.getMatrix()[0][2] = -(Math.sin(ry));
        this.rMat.getMatrix()[2][0] = Math.sin(ry);
        this.rMat.getMatrix()[2][2] = Math.cos(ry);
        this.rMat.matrixMult(this.rMatrix, this.rMat);

        this.rMat.matrixIdentity();
        this.rMat.getMatrix()[0][0] = Math.cos(rz);
        this.rMat.getMatrix()[0][1] = Math.sin(rz);
        this.rMat.getMatrix()[1][0] = -(Math.sin(rz));
        this.rMat.getMatrix()[1][1] = Math.cos(rz);
        this.rMat.matrixMult(this.rMatrix, this.rMat);

        this.objectMatrix.matrixCopy(this.rMatrix);
    };

    this.scale = function(scale)
    {
        this.rMat.matrixIdentity();
        this.rMat.getMatrix()[0][0] = scale;
        this.rMat.getMatrix()[1][1] = scale;
        this.rMat.getMatrix()[2][2] = scale;
        
        this.objectMatrix.matrixCopy(this.rMat);
    };

    this.transformPoint = function(p)
    {
        p.ax = (p.lx * this.objectMatrix.getMatrix()[0][0] + p.ly * this.objectMatrix.getMatrix()[1][0] + p.lz * this.objectMatrix.getMatrix()[2][0] + this.objectMatrix.getMatrix()[3][0]);
        p.ay = (p.lx * this.objectMatrix.getMatrix()[0][1] + p.ly * this.objectMatrix.getMatrix()[1][1] + p.lz * this.objectMatrix.getMatrix()[2][1] + this.objectMatrix.getMatrix()[3][1]) - 100;
        p.az = (p.lx * this.objectMatrix.getMatrix()[0][2] + p.ly * this.objectMatrix.getMatrix()[1][2] + p.lz * this.objectMatrix.getMatrix()[2][2] + this.objectMatrix.getMatrix()[3][2]);
        
        return p;
    };
    
    this.init();
};

/*
 * Point: A simple 2D point.
 * ************************************************************
 */
Point = function(x, y)
{
    this.x = x;
    this.y = y;
};

/*
 * This function displays tooltips and was adapted from original code by Michael Leigeber.
 * See http://www.leigeber.com/
 */
Tooltip = function(useExplicitPositions, tooltipColour)
{
    var top = 3;
    var left = 3;
    var maxw = 300;
    var speed = 10;
    var timer = 20;
    var endalpha = 95;
    var alpha = 0;
    var tt,t,c,b,h;
    var ie = document.all ? true : false;
    
    this.show = function(v,w)
    {
        if (tt == null)
        {
            tt = document.createElement('div');
            tt.style.color = tooltipColour;
            
            tt.style.position = 'absolute';
            tt.style.display =  'block';
            
            t = document.createElement('div');
            
            t.style.display = 'block';
            t.style.height =  '5px';
            t.style.marginleft =  '5px';
            t.style.overflow =  'hidden';
            
            c = document.createElement('div');
            
            b = document.createElement('div');
            
            tt.appendChild(t);
            tt.appendChild(c);
            tt.appendChild(b);
            document.body.appendChild(tt);
            
            if (!ie)
            {
                tt.style.opacity = 0;
                tt.style.filter = 'alpha(opacity=0)';
            }
            else
                tt.style.opacity = 1;
        }
        
        if (!useExplicitPositions)
                document.onmousemove = this.pos;
        
        tt.style.display = 'block';
        c.innerHTML = '<span style="font-weight:bold; font-family: arial;">' + v + '</span>';
        tt.style.width = w ? w + 'px' : 'auto';
        
        if (!w && ie)
        {
            t.style.display = 'none';
            b.style.display = 'none';
            tt.style.width = tt.offsetWidth;
            t.style.display = 'block';
            b.style.display = 'block';
        }
        
        if (tt.offsetWidth > maxw)
        {
            tt.style.width = maxw + 'px';
        }
        
        h = parseInt(tt.offsetHeight) + top;
        
        if (!ie)
        {
            clearInterval(tt.timer);
            tt.timer = setInterval(function(){fade(1)},timer);
        }
    };
    
    this.setPos = function(e)
    {
        tt.style.top = e.y + 'px';
        tt.style.left = e.x + 'px';
    };
    
    this.pos = function(e)
    {
        var u = ie ? event.clientY + document.documentElement.scrollTop : e.pageY;
        var l = ie ? event.clientX + document.documentElement.scrollLeft : e.pageX;
        tt.style.top = (u - h) + 'px';
        tt.style.left = (l + left) + 'px';
        tt.style.zIndex = 999999999999;
    };
    
    function fade(d)
    {
        var a = alpha;
        
        if ((a != endalpha && d == 1) || (a != 0 && d == -1))
        {
            var i = speed;
            
            if (endalpha - a < speed && d == 1)
            {
                i = endalpha - a;
            }
            else if (alpha < speed && d == -1)
            {
                i = a;
            }
        
            alpha = a + (i * d);
            tt.style.opacity = alpha * .01;
            tt.style.filter = 'alpha(opacity=' + alpha + ')';
        } else {
            clearInterval(tt.timer);
            if (d == -1) tt.style.display = 'none';
        }
    }
    
    this.hide = function()
    {
        if (tt == null)
            return;
    
        if (!ie) {
            clearInterval(tt.timer);
            tt.timer = setInterval(function(){fade(-1)},timer);
        } else {
            tt.style.display = 'none';
        }
    };
};

JSSurfacePlot.DEFAULT_X_ANGLE   = 47;
JSSurfacePlot.DEFAULT_Z_ANGLE   = 47;
JSSurfacePlot.DATA_DOT_SIZE     = 5;
JSSurfacePlot.DEFAULT_SCALE     = 200;
JSSurfacePlot.MIN_SCALE         = 50;
JSSurfacePlot.MAX_SCALE         = 1100;
JSSurfacePlot.SCALE_FACTOR      = 1.4;

