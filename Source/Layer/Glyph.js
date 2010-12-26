/*
---
 
script: Glyph.js
 
description: A separate layer for glyph
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Layer
 
provides: [LSD.Layer.Glyph]
 
...
*/

LSD.Layer.Glyph = new Class({
  Extends: LSD.Layer.Shaped,
  
  properties: {
    required: ['glyph', 'glyphColor'],
    optional: ['glyphLeft', 'glyphTop', 'glyphScale']
  },
  
  paint: function(glyph, color, x, y, scale) {
    if (scale == null) scale = 1;
    this.shape.draw(glyph);
    this.shape.fill.apply(this.shape, $splat(color));
    if (scale) this.shape.scale(scale);
    return {translate: {x: x || 0, y: y || 0}}
  }
});