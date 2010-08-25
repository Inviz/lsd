/*
---
 
script: ART.js
 
description: ART namespace definition
 
license: MIT-style license.
 
requires:
- Core/Class
- Core/Events
- Core/Options
- Core/Browser
- Ext/Macro
- Ext/Class.Stateful
- ART/ART
- ART/ART.Path
- ART/ART.SVG
- ART/ART.VML
- ART/ART.Base
 
provides: [Exception, $equals, ART]
 
...
*/

(function() {
	
	var toArgs = function(args, strings) {
		var results = [];
		for (var i = 0, arg; arg = args[i++];) {
			switch($type(arg)) {
				case "hash":
					if (strings) arg = JSON.encode(arg);
					break;
				case "element":
					if (strings) {
						var el = arg.get('tag');
						if (arg.get('id')) el += "#" + arg.get('id');
						if (arg.get('class').length) el += "." + arg.get('class').replace(/\s+/g, '.');
						arg = el;
					}
					break;
				default: 
					if (strings) {
						if (!$defined(arg)) arg = 'undefined';
						else if (!arg) arg = 'false';
						else if (arg.name) arg = arg.name;
				
						if ($type(arg) != "string") {
							if (arg.toString) arg = arg.toString();
							if ($type(arg) != "string") arg = '[Object]'
						}
					}
			}
			
			results.push(arg)
		}
		
		return results;
	};
	
	var toString = function(args) {
		return toArgs(args, true).join(" ")
	}

	Exception = new Class({
		name: "Exception",

		initialize: function(object, message) {
			this.object = object;
			this.message = message;
			console.error(this.object, this.message)
		},
		
		toArgs: function() {
			return toArgs([this.object, this.message])
		}
	});

	Exception.Misconfiguration = new Class({
		Extends: Exception,

		name: "Misconfiguration"
	});

})();

$equals = function(one, another) {
	if (one == another) return true;
	if ((!one) ^ (!another)) return false;
	if (!$defined(one)) return false;
	
	if ((one instanceof Array) || one.callee) {
	  var j = one.length;
		if (j != another.length) return false;
		for (var i = 0; i < j; i++) if (!$equals(one[i], another[i])) return false;
		return true;
	} else if (one instanceof Color) {
	  return (one.red == another.red) && (one.green == another.green) && (one.blue == another.blue) && (one.alpha == another.alpha)
	} else if (typeof one == 'object') {
		if (one.equals) return one.equals(another)
		for (var i in one) if (!$equals(one[i], another[i])) return false;
		return true;
	}
	return false;
}

ART.implement({

	setHeight: function(height) {
	  this.element.setAttribute('height', height);
	  return this;
	},

	setWidth: function(width) {
	  this.element.setAttribute('width', width);
	  return this;
	}

});


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
  }
});

ART.Features = {};
ART.Features.Blur = Browser.Engine.gecko; //TODO: Figure it out
