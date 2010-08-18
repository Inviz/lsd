ART.Layer.Shadow = new Class({
  Extends: ART.Layer,
    
  properties: ['strokeWidth', 'shadowBlur', 'shadowColor', 'shadowOffsetX', 'shadowOffsetY', 'shadowQuality'],
  
  layers: [],
  
  paint: function(stroke, shadow, color, x, y, quality) {
    if (!color || (!shadow && !x && !y)) return false;
    if (!stroke) stroke = 0;
    if (!shadow) shadow = 0;
    if (!x) x = 0;
    if (!y) y = 0;
    
    if (ART.Features.Blur && (quality == 'best' || shadow > 10)) {
      return ART.Layer.ShadowBlur.prototype.paint.apply(this, arguments);
    } else {
      return ART.Layer.ShadowOnion.prototype.paint.apply(this, arguments);
    }
  },

  inject: function(node) {
    this.parent.apply(this, arguments);
    this.update(node);
  },
  
  update: function(node) {
    for (var i = 0, j = this.layers.length; i < j; i++) if (this.layers[i]) this.layers[i].inject(node)
  },
  
  eject: function() {
    this.parent.apply(this, arguments)
    for (var i = 0, j = this.layers.length; i < j; i++) {
      var layer = this.layers[i];
      if (layer && layer.shape.element.parentNode) {
        layer.shape.element.parentNode.removeChild(layer.shape.element);
      }
    }
  },
  
  translate: function(x, y) {
    this.parent.apply(this, arguments);
    for (var i = 0, j = this.layers.length; i < j; i++) 
      if (this.layers[i]) 
        this.layers[i].translate(x + i + j / 2, y + i + j / 2)
  }
});

ART.Layer.ShadowBlur = new Class({
  Extends: ART.Layer.Shadow,

  paint: function(stroke, shadow, color, x, y) {
    this.produce(stroke);
  	this.shape.fill.apply(this.shape, color ? $splat(color) : null);
  	if (shadow > 0) this.shape.blur(shadow);
  	else this.shape.unblur();
  	return {
  	  translate: {
  	    x: x + shadow, 
  	    y: y + shadow
  	  },
  	  outside: {
  	    x: Math.max(shadow - x, 0),
  	    y: Math.max(shadow - y, 0)
  	  }
  	}
  }
})

ART.Layer.ShadowOnion = new Class({
  Extends: ART.Layer.Shadow,
  
  paint: function(stroke, shadow, color, x, y) {
    if (shadow > 0 || y > 0 || x > 0) {
      var fill = new Color(color);
      fill.base = fill.alpha;
      //var node = this.element.parentNode;
      var layers = Math.max(shadow, 1);
      for (var i = 0; i < layers; i++) {
        if (shadow == 0) {
          fill.alpha = Math.min(fill.base * 2, 1)
        } else {
          fill.alpha = fill.base / 2 * (i == shadow ? .29 : (.2 - shadow * 0.017) + Math.sqrt(i / 100));
        }
        if (fill.alpha < 0.02) continue;
        var rectangle = this.layers[i];
        if (!rectangle) rectangle = this.layers[i] = ART.Layer.Shadow.Layer.getInstance(this);
        rectangle.base = this.base;
        rectangle.shadow = this;
        rectangle.produce(stroke / 2 + shadow / 2 - i);
        rectangle.fill(fill);
      }
      var length = this.layers.length;
      for (var i = layers; i < length; i++) if (this.layers[i]) ART.Layer.Shadow.Layer.release(this.layers[i]);
      this.layers.splice(layers, length);      
    } else {
      this.layers.each(ART.Layer.Shadow.Layer.release);
      this.layers = [];
    }
    return {
  	  translate: {
  	    x: x, 
  	    y: y
  	  },
  	  outside: {
  	    x: Math.max(shadow - x, 0),
  	    y: Math.max(shadow - y, 0)
  	  }
  	}
  }
});

ART.Layer.Shadow.Layer = new Class({
  Extends: ART.Layer,
  
	
	inject: function(container){
		this.eject();
		if (container instanceof ART.SVG.Group) container.children.push(this);
		this.container = container;
		if (container.defs && container.defs.nextSibling) container.element.insertBefore(this.shape.element, container.defs.nextSibling);
    else container.element.appendChild(this.shape.element);
		return this;
	}
});
ART.Layer.Shadow.Layer.stack = [];
ART.Layer.Shadow.Layer.getInstance = function() {
  return ART.Layer.Shadow.Layer.stack.pop() || (new ART.Layer.Shadow.Layer);
}
ART.Layer.Shadow.Layer.release = function(layer) {
  var shape = layer.shape;
  if (shape) shape.element.parentNode.removeChild(shape.element);
  ART.Layer.Shadow.Layer.stack.push(layer);
};
