/*
---
 
script: InnerShadow.js
 
description: Dropps inner shadow with offsets 
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Layer
- ART.Layer.Shadow
 
provides: [ART.Layer.InnerShadow, ART.Layer.InnerShadow.Layer]
 
...
*/

ART.Layer.InnerShadow = new Class({
  Extends: ART.Layer.Shadow,
  
  properties: ['strokeWidth', 'innerShadowBlur', 'innerShadowColor', 'innerShadowOffsetX', 'innerShadowOffsetY'],

  paint: function(stroke, shadow, color, x, y) {
    if (!stroke) stroke = 0;
    if (!shadow) shadow = 0;
    if (!x) x = 0;
    if (!y) y = 0;
    if (shadow > 0 || y > 0 || x > 0) {
      var fill = new Color(color);
      fill.base = fill.alpha;
      var transition = function(p){
    		return 1 - Math.sin((1 - p) * Math.PI / 2);
    	};
      var offset = Math.max(Math.abs(x), Math.abs(y));
      shadow += offset;
      //if (!shadow) shadow = 1;;
      //console.log(['x', x], ['y', y], ['s', shadow])
      for (var i = 0; i < shadow; i++) {
        if (shadow == 0) {
          fill.alpha = Math.min(fill.base * 2, 1)
        } else {
          fill.alpha = fill.base * transition((shadow - i) / shadow)
        }
        //if (fill.alpha < 0.02) continue;
        var layer = this.layers[i];
        if (!layer) layer = this.layers[i] = ART.Layer.InnerShadow.Layer.getInstance(this);
        layer.layer = this;
        layer.base = this.base;
        layer.shadow = shadow
        layer.dy = y - x
        layer.y = Math.max(Math.min(layer.dy, 0) + i, 0);
        layer.dx = x - y;
        layer.x = Math.max(Math.min(layer.dx, 0) + i, 0);
        layer.produce([
          Math.min(((layer.x > 0) ? ((layer.dx - i < 0) ? 1 : 0.5) * - layer.x  - 0.25 : 0), 0),
          Math.min(((layer.y > 0) ? (layer.dy + i < 0 ? 1 : 0.5) * - layer.y  - 0.25: 0), 0)
        ]);
         // console.log(
         //   layer.shape.element,
         //   [layer.y, layer.x], 
         //   [layer.dy, layer.dx, i],
         //   [
         //     Math.min(((layer.x > 0) ? (layer.dx + i <= 0 ? 1 : 0.5) * - layer.x  - 0.25: i / 2), 0),
         //     Math.min(((layer.y > 0) ? (layer.dy + i <= 0 ? 1 : 0.5) * - layer.y  - 0.25: i / 2), 0)
         //   ])
        layer.stroke(fill, 1);
      }
      var length = this.layers.length;
      for (var i = shadow; i < length; i++) if (this.layers[i]) ART.Layer.InnerShadow.Layer.release(this.layers[i]);
      this.layers.splice(shadow, length);
    } else {
      this.layers.each(ART.Layer.InnerShadow.Layer.release);
      this.layers = [];
    }
  },
  
  translate: function(x, y) {
    this.parent.apply(this, arguments);
    for (var i = 0, j = this.layers.length; i < j; i++) {
      var layer = this.layers[i];
      if (layer) layer.translate(x + layer.x, y + layer.y);
    }
  } 
});
ART.Layer.InnerShadow.Layer = new Class({
  Extends: ART.Layer
});
ART.Layer.InnerShadow.Layer.stack = [];
ART.Layer.InnerShadow.Layer.getInstance = function() {
  return ART.Layer.InnerShadow.Layer.stack.pop() || (new ART.Layer.InnerShadow.Layer);
}
ART.Layer.InnerShadow.Layer.release = function(layer) {
  layer.element.parentNode.removeChild(layer.element);
  ART.Layer.InnerShadow.Layer.stack.push(layer);
};