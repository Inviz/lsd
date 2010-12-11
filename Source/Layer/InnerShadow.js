/*
---
 
script: InnerShadow.js
 
description: Dropps inner shadow with offsets 
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Layer
- LSD.Layer.Shadow
 
provides: [LSD.Layer.InnerShadow, LSD.Layer.InnerShadow.Layer]
 
...
*/

LSD.Layer.InnerShadow = new Class({
  Extends: LSD.Layer.Shadow,
  
  properties: {
    required: ['innerShadowColor'],
    numerical: ['innerShadowBlur', 'innerShadowOffsetX', 'innerShadowOffsetY']
  },

  paint: function(color, blur, x, y) {
    var fill = new Color(color);
    fill.base = fill.alpha;
    var transition = function(p){
      return 1 - Math.sin((1 - p) * Math.PI / 2);
    };
    var offset = Math.max(Math.abs(x), Math.abs(y));
    blur += offset;
    for (var i = 0; i < blur; i++) {
      if (blur == 0) {
        fill.alpha = Math.min(fill.base * 2, 1)
      } else {
        fill.alpha = fill.base * transition((blur - i) / blur)
      }
      var layer = this.layers[i];
      if (!layer) layer = this.layers[i] = LSD.Layer.InnerShadow.Layer.getInstance(this);
      layer.layer = this;
      layer.base = this.base;
      layer.blur = blur
      layer.dy = y - x
      layer.y = Math.max(Math.min(layer.dy, 0) + i, 0);
      layer.dx = x - y;
      layer.x = Math.max(Math.min(layer.dx, 0) + i, 0);
      layer.produce([
        Math.min(((layer.x > 0) ? ((layer.dx - i < 0) ? 1 : 0.5) * - layer.x  - 0.25 : 0), 0),
        Math.min(((layer.y > 0) ? (layer.dy + i < 0 ? 1 : 0.5) * - layer.y  - 0.25: 0), 0)
      ]);
      layer.stroke(fill, 1);
    }
    var length = this.layers.length;
    for (var i = blur; i < length; i++) if (this.layers[i]) LSD.Layer.InnerShadow.Layer.release(this.layers[i]);
    this.layers.splice(blur, length);
  },
  
  translate: function(x, y) {
    this.parent.apply(this, arguments);
    for (var i = 0, j = this.layers.length; i < j; i++) {
      var layer = this.layers[i];
      if (layer) layer.translate(x + layer.x, y + layer.y);
    }
  },
  
  eject: function() {
    for (var i = 0, j = this.layers.length; i < j; i++) {
      var layer = this.layers[i];
      if (!layer) continue;
      LSD.Layer.InnerShadow.Layer.release(layer)
      if (layer.shape.element.parentNode) layer.shape.element.parentNode.removeChild(layer.shape.element);
    }
  },

  inject: function(node) {
    this.parent.apply(this, arguments);
    this.update.apply(this, arguments);
  },
  
  update: function() {
    for (var i = 0, j = this.layers.length; i < j; i++) if (this.layers[i]) this.layers[i].inject.apply(this.layers[i], arguments);
  }
});
LSD.Layer.InnerShadow.Layer = new Class({
  Extends: LSD.Layer
});
LSD.Layer.InnerShadow.Layer.stack = [];
LSD.Layer.InnerShadow.Layer.getInstance = function() {
  return LSD.Layer.InnerShadow.Layer.stack.pop() || (new LSD.Layer.InnerShadow.Layer);
}
LSD.Layer.InnerShadow.Layer.release = function(layer) {
  layer.element.parentNode.removeChild(layer.element);
  LSD.Layer.InnerShadow.Layer.stack.push(layer);
};