ART.Widget.Paint = new Class({
  Includes: [
    ART.Widget,
    ART.Widget.Trait.Shape,
    ART.Widget.Trait.Dimensions,
    ART.Widget.Trait.Layers
  ],
	
	States: {
	  'outdated': ['outdate', 'actualize']
	},
	
	properties: [],
	redraws: 0,
  
	build: Macro.onion(function() {
		this.paint = new ART();
		this.element.setStyle('position', this.style.current.position || this.position || 'relative');
		$(this.paint).setStyles({
			'position': 'absolute',
			'top': 0,
			'left': 0
		}).inject(this.getWrapper(), 'top');
	}),
	
	renderStyles: function(style) {
	  this.parent.apply(this, arguments);
	  this.renderOffsets();
	},
	
	renderOffsets: function() {
	  var inside = this.offset.inside = this.getInsideOffset();
		var paint = this.offset.paint = this.getPaintOffset();
    var padding = this.offset.padding;
    var margin = this.offset.margin;
	  
		for (var property in inside) {
		  var last = padding[property];
      padding[property] = inside[property] + paint[property];
      var cc = 'padding' + property.capitalize();
      if ($defined(last) ? (last != padding[property]) : padding[property]) this.element.style[cc] = padding[property] + 'px';
      
      cc = 'margin' + property.capitalize();
      last = margin[property];
      margin[property] =(this.style.current[cc] || 0) - paint[property]
      if ($defined(last) ? (last != margin[property]) : (margin[property] != 0)) this.element.style[cc] = margin[property] + 'px';
		}
	},
	
	render: function() {
		if (!this.parent.apply(this, arguments)) return;
		if (!this.paint) return;
		if (!this.outdated) return;
	  
		this.outdated = false;
		
		if (!this.halted) this.fireEvent('redraw');
	  this.redraws++;
	  ART.Widget.Paint.redraws++;
		
		return true;
	},
	
	getCanvasOffset: function() {
	  var styles = this.style.current;
		var blur = (styles.shadowBlur || 0);
		var offset = {
			x: (styles.shadowOffsetX || 0),
			y: (styles.shadowOffsetY || 0)
		}
		return {
			left: Math.max(blur - offset.x, 0),
			top: Math.max(blur - offset.y, 0),
			right: blur + offset.x,
			bottom: blur + offset.y
		}
	},
		
	getPaintOffset: function() {
		var offset = this.getCanvasOffset();
		if (!this.shape) return offset;
		var shape = this.shape.getOffset(this.style.current, offset);
		for (var i in offset) offset[i] += shape[i];
		return offset;
	},
	
	getOffset: function() {
		return this.getPaintOffset();
	},
	
	getPadding: function() {
	  var styles = this.style.current;
	  return {
			top: styles.paddingTop || 0,
			left: styles.paddingLeft || 0,
			bottom: styles.paddingBottom || 0,
			right: styles.paddingRight || 0
		}
	},
	
	getInsideOffset: function() {
		var stroke = (this.style.current.strokeWidth || 0);
		var padding = this.getPadding();
		for (var side in padding) padding[side] += stroke;
		return padding;
	},
	
	inheritStyle: function(property) {
		switch (property) {
			case "height": case "width":
				this.outdated = true;
		}
		return this.parent.apply(this, arguments);
	},
	
	calculateStyle: function(property) {
		switch (property) {
			case "height": case "width":
				this.outdated = true;
		}
    return this.parent.apply(this, arguments);
	},
	
	setStyle: function(property, value) {
		if (!this.parent.apply(this, arguments)) return;
		switch(property) {
			case "height": case "width":
				this.outdated = true;
		}
		return (this.setPaintStyle(property, value) || this.setElementStyle(property, value));
	},
	
	getStyle: function(property, value) {
	  if (this.style.computed[property]) return this.style.computed[property]; 
		var properties = ART.ComplexStyles[property];
		if (properties) {
			if (properties.set) properties = properties.get;
			var current = this.style.current;
		  var result = [];
		  var property;
		  var i = 0;
		  while (property = properties[i++]) {
			  var value = current[property];
				result.push(((isFinite(value)) ? value : this.getStyle(property)) || 0)
		  }
			return (this.style.computed[property] = result);
		} else {
			return this.parent.apply(this, arguments);
		}
	},
	
	setPaintStyle: function(property, value) {
		if (ART.Styles[property] || this.properties.contains[property]) {
			this.style.paint[property] = value;
			var properties = ART.ComplexStyles[property];
			if (properties) {
				if (properties.set) properties = properties.set;
				if (!(value instanceof Array)) {
					var array = [];
					for (var i = 0, j = properties.length; i < j; i++) array.push(value); 
					value = array;
				}
				var count = value.length;
				
				properties.each(function(property, i) {
					this.setStyle(property, value[i % count])
				}, this);
			}
			this.outdated = true;
			return true;
		}	
		return false;
	}
	
});

ART.Widget.Paint.Fx = new Class({

	Extends: Fx.CSS,

	initialize: function(widget, options){
	  this.widget = widget;
		this.element = this.subject = document.id(widget);
		this.parent(options);
	},

	prepare: function(widget, property, values){
		values = $splat(values);
		var values1 = values[1];
		if (!$chk(values1)){
			values[1] = values[0];
			values[0] = widget.getStyle(property);
		}
		var parsed = values.map(this.parse);
		return {from: parsed[0], to: parsed[1]};
	},
	
	set: function(property, now){
		if (arguments.length == 1){
			now = property;
			property = this.property || this.options.property;
		}
		this.widget.setStyle(property, now[0].value);
		this.widget.render();
		return this;
	},

	start: function(property, from, to){
		if (!this.check(property, from, to)) return this;
		var args = Array.flatten(arguments);
		this.property = this.options.property || args.shift();
		var parsed = this.prepare(this.widget, this.property, args);
		return this.parent(parsed.from, parsed.to);
	}

});

ART.Widget.Paint.implement({
  tween: function(property, from, to) {
    if (!this.tweener) this.tweener = new ART.Widget.Paint.Fx(this, this.options.tween);
    this.tweener.start(property, from, to);
    return this;
  }
});

ART.Widget.Paint.redraws = 0;