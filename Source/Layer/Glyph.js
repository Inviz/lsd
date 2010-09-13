/*
---
 
script: Glyph.js
 
description: A separate layer for glyph
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Layer
 
provides: [ART.Layer.Glyph]
 
...
*/

ART.Layer.Glyph = new Class({
  Extends: ART.Layer.Shaped,
  
  properties: ['glyph', 'glyphColor', 'glyphLeft', 'glyphTop', 'glyphScale'],
  
  paint: function(glyph, color, x, y, scale) {
    if (!glyph || !color) return false
    if (!x) x = 0;
    if (!y) y = 0;
    if (!$defined(scale)) scale = 1;
    this.shape.draw(glyph);
		this.shape.fill.apply(this.shape, $splat(color));
	  if (scale) this.shape.scale(scale);
	  return {translate: {x: x, y: y}}
  }
});