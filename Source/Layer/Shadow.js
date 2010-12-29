/*
---
 
script: Shadow.js
 
description: Drops outer shadow with offsets. Like a box shadow!
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Layer
- Ext/Element.Properties.boxShadow
- Ext/Element.Properties.borderRadius
 
provides: [LSD.Layer.Shadow, LSD.Layer.Shadow.Layer]
 
...
*/

                              //only gecko & webkit nightlies                                       AppleWebKit/534.1+ (KHTML, ... plus means nightly
Browser.Features.SVGFilters = Browser.Engine.name == 'gecko' || (Browser.Engine.webkit && navigator.userAgent.indexOf("+ (KHTML") > -1) 

LSD.Layer.Shadow = new Class({
  Extends: LSD.Layer,
  
  properties: {
    required: ['shadowColor'],
    numerical: ['shadowBlur', 'shadowOffsetX', 'shadowOffsetY'],
    optional: ['strokeWidth', 'shadowMethod']
  },  
  
  layers: [],
  
  paint: function(color, blur, x, y, stroke, method) {
    if (!method) {
      if (this.method) method = method
      if (blur < 4) method = 'onion';
      else if (Browser.Features.boxShadow && this.base.name == 'rectangle') method = 'native';
      else if (Browser.Features.SVGFilters) method = 'blur';
      else method = 'onion'
    }
    if (this.method && method != this.method) this.eject();
    return this.setMethod(method).paint.apply(this, arguments);
  },
  
  setMethod: function(method) {
    this.method = method;
    this.adapter = LSD.Layer['Shadow' + method.capitalize()].prototype;
    ['update', 'inject', 'eject', 'translate'].each(function(delegate) {
      var delegated = this.adapter[delegate];
      if (delegated) this[delegate] = delegated;
    }, this);
    return this.adapter;
  }
});

LSD.Layer.ShadowBlur = new Class({
  Extends: LSD.Layer.Shadow,

  paint: function(color, blur, x, y, stroke) {
    this.produce(stroke);
    this.shape.fill.apply(this.shape, color ? $splat(color) : null);
    if (blur > 0) this.shape.blur(blur);
    else this.shape.unblur();
    return {
      translate: {
        x: x + blur, 
        y: y + blur
      },
      outside: {
        left: Math.max(blur - x, 0),
        top: Math.max(blur - y, 0),
        right: Math.max(blur + x, 0),
        bottom: Math.max(blur + y, 0)
      }
    }
  }
})

LSD.Layer.ShadowNative = new Class({
  Extends: LSD.Layer,

  paint: function(color, blur, x, y, stroke) {
    var widget = this.base.widget;
    var element = widget.toElement();
    element.set('borderRadius', widget.getStyle('cornerRadius'));
    element.set('boxShadow', {color: color, blur: blur, x: x, y: y})
  },
  
  eject: function() {
    var widget = this.base.widget;
    var element = widget.element;
    element.set('boxShadow', false)
  }
})

LSD.Layer.ShadowOnion = new Class({
  Extends: LSD.Layer.Shadow,
  
  paint: function(color, blur, x, y, stroke) {
    var fill = new Color(color);
    fill.base = fill.alpha;
    //var node = this.element.parentNode;
    var layers = Math.max(blur, 1);
    for (var i = 0; i < layers; i++) {
      if (blur == 0) {
        fill.alpha = Math.min(fill.base * 2, 1)
      } else {
        fill.alpha = fill.base / 2 * (i == blur ? .29 : (.2 - blur * 0.017) + Math.sqrt(i / 100));
      }
      var rectangle = this.layers[i];
      if (!rectangle) rectangle = this.layers[i] = LSD.Layer.Shadow.Layer.getInstance(this);
      rectangle.base = this.base;
      rectangle.shadow = this;
      rectangle.produce(stroke / 2 + blur / 2 - i);
      rectangle.fill(fill);
    }
    var length = this.layers.length;
    for (var i = layers; i < length; i++) if (this.layers[i]) LSD.Layer.Shadow.Layer.release(this.layers[i]);
    this.layers.splice(layers, length);
    return {
      translate: {
        x: x * 1.5, //multiplying by 1.5 is unreliable. I need a better algorithm altogether
        y: y * 1.5
      },
      outside: {
        left: Math.max(blur - x, 0),
        top: Math.max(blur - y, 0),
        right: Math.max(blur + x, 0),
        bottom: Math.max(blur + y, 0)
      }
    }
  },

  inject: function(node) {
    this.parent.apply(this, arguments);
    this.update.apply(this, arguments);
  },
  
  update: function() {
    for (var i = 0, j = this.layers.length; i < j; i++) if (this.layers[i]) this.layers[i].inject.apply(this.layers[i], arguments);
  },
  
  eject: function() {
    for (var i = 0, j = this.layers.length; i < j; i++) {
      var layer = this.layers[i];
      if (!layer) continue;
      LSD.Layer.Shadow.Layer.release(layer)
      if (layer.shape.element.parentNode) layer.shape.element.parentNode.removeChild(layer.shape.element);
    }
  },

  translate: function(x, y) {
    this.parent.apply(this, arguments);
    for (var i = 0, j = this.layers.length; i < j; i++) 
      if (this.layers[i]) this.layers[i].translate(x + i + j / 2, y + i + j / 2)
  }
});

LSD.Layer.Shadow.Layer = new Class({
  Extends: LSD.Layer,
  
  
  inject: function(container){
    this.eject();
    if (container instanceof ART.SVG.Group) container.children.push(this);
    this.container = container;
    var first = container.element.firstChild;
    if (first) container.element.insertBefore(this.shape.element, first);
    else container.element.appendChild(this.shape.element);
    return this;
  }
});
LSD.Layer.Shadow.Layer.stack = [];
LSD.Layer.Shadow.Layer.getInstance = function() {
  return LSD.Layer.Shadow.Layer.stack.pop() || (new LSD.Layer.Shadow.Layer);
};
LSD.Layer.Shadow.Layer.release = function(layer) {
  var shape = layer.shape;
  if (shape) shape.element.parentNode.removeChild(shape.element);
  LSD.Layer.Shadow.Layer.stack.push(layer);
};


Widget.Styles.Paint.push('shadowColor', 'shadowBlur', 'shadowOffsetX', 'shadowOffsetY')