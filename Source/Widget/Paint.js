/*
---
 
script: Paint.js
 
description: Base class for widgets that use SVG layers in render
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Widget
- ART.Widget.Trait.Shape
- ART.Widget.Trait.Dimensions
- ART.Widget.Trait.Layers

provides: [ART.Widget.Paint]
 
...
*/

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
  
  setHeight: function() {
    var value = this.parent.apply(this, arguments);
    if (value) {
      this.outdated = true;
      if (this.style.expressed.height) this.setElementStyle('height', value - (this.style.current.paddingTop || 0) - (this.style.current.paddingBottom || 0))
    }
    return value;
  },
  
  setWidth: function() {
    var value = this.parent.apply(this, arguments);
    if (value) {
      this.outdated = true;
      if (this.style.expressed.width) this.setElementStyle('width', value - (this.style.current.paddingLeft || 0) - (this.style.current.paddingRight || 0))
    }
    return value;
  },
  
  //getClientWidth: function() {
  //  var expression = this.style.expressed.width;
  //  if (expression) {
  //    console.log('width difference', [expression.call(this), this.parent.apply(this, arguments)])
  //    return expression.call(this);
  //  } else {
  //    return this.parent.apply(this, arguments);
  //  }
  //},
  //
  //getClientHeight: function() {
  //  var expression = this.style.expressed.height;
  //  if (expression) {
  //    return expression.call(this);
  //  } else {
  //    return this.parent.apply(this, arguments);
  //  }
  //},
  
  setStyle: function(property, value) {
    var value = this.parent.apply(this, arguments);
    if (!$defined(value)) return;
    return (this.setPaintStyle(property, value) || this.setElementStyle(property, value));
  },
  
  getStyle: function(property, value) {
    if (this.style.computed[property]) return this.style.computed[property]; 
    var properties = ART.Styles.Complex[property];
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
    if (!ART.Styles.Paint[property]) return false;
    this.style.paint[property] = value;
    var properties = ART.Styles.Complex[property];
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
  },
  
  tween: function(property, from, to) {
    if (!this.tweener) this.tweener = new ART.Fx(this, this.options.tween);
    this.tweener.start(property, from, to);
    return this;
  }
});

ART.Widget.Paint.redraws = 0;