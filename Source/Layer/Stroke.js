ART.Layer.Stroke = new Class({
  Extends: ART.Layer,
  
  properties: ['strokeColor', 'strokeWidth', 'strokeCap', 'strokeDash', 'fillColor'],
  
  paint: function(strokeColor, stroke, cap, dash, color) {
    if (!color && (!stroke || !strokeColor)) return false;
    if (!stroke) stroke = 0;
    this.produce(stroke / 2)
  	this.shape.stroke(strokeColor, stroke, cap);
  	this.shape.fill.apply(this.shape, color ? $splat(color) : null);
  	this.shape.dash(dash);
  	return {
  	  translate: {
  	    x: stroke / 2, 
  	    y: stroke / 2
  	  },
  	  outside: {
  	    x: stroke,
  	    y: stroke
  	  },
  	  inside: {
  	    x: stroke,
  	    y: stroke
  	  }
  	}
  },
  
  
})
