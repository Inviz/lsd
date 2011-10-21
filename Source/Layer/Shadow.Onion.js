/*
---

script: Shadow.Onion.js

description: Draws shadow with layers stack upon each others

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
- LSD.Layer.Shadow

provides: [LSD.Layer.Shadow.Onion]

...
*/

LSD.Layer.Shadow.Onion = new Class({
  //Extends: LSD.Layer.Shadow,

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
      move: {
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
