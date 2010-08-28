/*
---
 
script: ART.SVG.js
 
description: Some extensions (filters, dash, shadow blur)
 
license: MIT-style license.

requires: [ART/ART.SVG]

provides: [ART.SVG.Extensions]
 
...
*/

(function() {
var NS = 'http://www.w3.org/2000/svg', XLINK = 'http://www.w3.org/1999/xlink', UID = 0, createElement = function(tag){
	return document.createElementNS(NS, tag);
};
  
ART.SVG.Base.implement({
  dash: function(dash) {
    if (dash) {
      this.dashed = true;
      this.element.setAttribute('stroke-dasharray', dash);
    } else if (this.dashed) {
      this.dashed = false;
      this.element.removeAttribute('stroke-dasharray')
    }
  },
  
  
	inject: function(container){
		this.eject();
		if (container instanceof ART.SVG.Group) container.children.push(this);
		this.container = container;
		this._injectGradient('fill');
		this._injectGradient('stroke');
		this._injectFilter('blur');
		this.parent(container);
		return this;
	},
	
	strokeLinear: function(stops, angle){
		var gradient = this._createGradient('stroke', 'linear', stops);

		angle = ((angle == null) ? 270 : angle) * Math.PI / 180;

		var x = Math.cos(angle), y = -Math.sin(angle),
			l = (Math.abs(x) + Math.abs(y)) / 2;

		x *= l; y *= l;

		gradient.setAttribute('x1', 0.5 - x);
		gradient.setAttribute('x2', 0.5 + x);
		gradient.setAttribute('y1', 0.5 - y);
		gradient.setAttribute('y2', 0.5 + y);

		return this;
	},
	
	_writeTransform: function(){
	  if ($equals(this.transformed, this.transform)) return;
		this.transformed = $unlink(this.transform);
		var transforms = [];
		for (var transform in this.transform) transforms.push(transform + '(' + this.transform[transform].join(',') + ')');
		this.element.setAttribute('transform', transforms.join(' '));
	},

	fill: function(color){
	  var args = arguments;
    if ($equals(args, this.filled)) return;
    this.filled = args;
		if (args.length > 1) {
	    if (color == 'radial') {
	      var opts = args.length == 3 ? args[2] : {}
	      this.fillRadial(args[1], opts.fx, opts.fy, opts.r, opts.cx, opts.cy)
	    } else this.fillLinear(arguments);
		} else this._setColor('fill', color);
		return this;
	},
	
	stroke: function(color, width, cap, join){
		var element = this.element;
		element.setAttribute('stroke-width', (width != null) ? width : 1);
		element.setAttribute('stroke-linecap', (cap != null) ? cap : 'round');
		element.setAttribute('stroke-linejoin', (join != null) ? join : 'round');
		if (color && color.length > 1) this.strokeLinear(color);
		else this._setColor('stroke', color);
		
		return this;
	},

  blur: function(radius){
	  if (radius == null) radius = 4;
    if (radius == this.blurred) return;
    this.blurred = radius;
    
  	var filter = this._createFilter();
  	var blur = createElement('feGaussianBlur');
  	blur.setAttribute('stdDeviation', radius * 0.25);
  	blur.setAttribute('result', 'blur');
  	filter.appendChild(blur);
  	//in=SourceGraphic
  	//stdDeviation="4" result="blur"
  	return this;
  },

  unblur: function() {
    delete this.blurred;
    this._ejectFilter();
  },
  
  
	
	/* styles */
	
	_createGradient: function(type, style, stops){
		this._ejectGradient(type);

		var gradient = createElement(style + 'Gradient');

		this[type + 'Gradient'] = gradient;

		var addColor = function(offset, color){
			color = Color.detach(color);
			var stop = createElement('stop');
			stop.setAttribute('offset', offset);
			stop.setAttribute('stop-color', color[0]);
			stop.setAttribute('stop-opacity', color[1]);
			gradient.appendChild(stop);
		};

		// Enumerate stops, assumes offsets are enumerated in order
		// TODO: Sort. Chrome doesn't always enumerate in expected order but requires stops to be specified in order.
		if ('length' in stops) for (var i = 0, l = stops.length - 1; i <= l; i++) addColor(i / l, stops[i]);
		else for (var offset in stops) addColor(offset, stops[offset]);

		var id = 'g' + ART.uniqueID();
		gradient.setAttribute('id', id);

		this._injectGradient(type);

		this.element.removeAttribute('fill-opacity');
		this.element.setAttribute(type, 'url(#' + id + ')');
		
		return gradient;
	},
	
	_setColor: function(type, color){
		this._ejectGradient(type);
		this[type + 'Gradient'] = null;
		var element = this.element;
		if (color == null){
			element.setAttribute(type, 'none');
			element.removeAttribute(type + '-opacity');
		} else {
			color = Color.detach(color);
			element.setAttribute(type, color[0]);
			element.setAttribute(type + '-opacity', color[1]);
		}
	},

	fillRadial: function(stops, focusX, focusY, radius, centerX, centerY){
		var gradient = this._createGradient('fill', 'radial', stops);

		if (focusX != null) gradient.setAttribute('fx', focusX);
		if (focusY != null) gradient.setAttribute('fy', focusY);

		if (radius) gradient.setAttribute('r', radius);

		if (centerX == null) centerX = focusX;
		if (centerY == null) centerY = focusY;

		if (centerX != null) gradient.setAttribute('cx', centerX);
		if (centerY != null) gradient.setAttribute('cy', centerY);

		//gradient.setAttribute('spreadMethod', 'reflect'); // Closer to the VML gradient
		
		return this;
	},

	fillLinear: function(stops, angle){
		var gradient = this._createGradient('fill', 'linear', stops);

		angle = ((angle == null) ? 270 : angle) * Math.PI / 180;

		var x = Math.cos(angle), y = -Math.sin(angle),
			l = (Math.abs(x) + Math.abs(y)) / 2;

		x *= l; y *= l;

		gradient.setAttribute('x1', 0.5 - x);
		gradient.setAttribute('x2', 0.5 + x);
		gradient.setAttribute('y1', 0.5 - y);
		gradient.setAttribute('y2', 0.5 + y);

		return this;
	},
	
  _injectFilter: function(type){
  	if (!this.container) return;
  	var filter = this.filter;
  	if (filter) this.container.defs.appendChild(filter);
  },
  
  _ejectFilter: function(type){
  	if (!this.container) return;
  	var filter = this.filter;
  	delete this.filter;
  	if (filter) this.container.defs.removeChild(filter);
  },
  
  _createFilter: function(){
  	this._ejectFilter();
  
  	var filter = this.filter = createElement('filter');
  
  	var id = 'filter-e' + this.uid;
  	filter.setAttribute('id', id);
  
  	this._injectFilter();
  
  	this.element.setAttribute('filter', 'url(#' + id + ')');
  
  	return filter;
  },

	stroke: function(color, width, cap, join){
		var element = this.element;
		element.setAttribute('stroke-width', (width != null) ? width : 1);
		element.setAttribute('stroke-linecap', (cap != null) ? cap : 'round');
		element.setAttribute('stroke-linejoin', (join != null) ? join : 'round');

		this._setColor('stroke', color);
		return this;
	}
});

})();