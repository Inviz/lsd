/*
---
 
script: GlyphShadow.js
 
description: Glyph shadow. Accepts blur as float.
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Layer.Glyph
 
provides: [LSD.Layer.GlyphShadow]
 
...
*/

LSD.Layer.GlyphShadow = new Class({
  Extends: LSD.Layer.Shaped,
  
  properties: {
    required: ['glyph', 'glyphColor', 'glyphShadowColor'],
    numerical: ['glyphShadowBlur', 'glyphShadowOffsetX', 'glyphShadowOffsetY'],
    optional: ['glyphLeft', 'glyphTop', 'glyphScale']
  },
  
  paint: function(glyph, color, shadow, blur, x, y, left, top, scale) {
    if (scale == null) scale = 1;
    if (!color) return false;
    this.shape.draw(glyph);
    this.shape.fill.apply(this.shape, $splat(shadow));
    if (scale + blur) this.shape.scale(scale + blur);
    return {translate: {x: x + (left || 0), y: y + (top || 0)}}
  }
});

LSD.Styles.Paint.push('glyphShadowBlur', 'glyphShadowOffsetX', 'glyphShadowOffsetY', 'glyphShadowColor')