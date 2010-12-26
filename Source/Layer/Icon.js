/*
---
 
script: Icon.js
 
description: For the times you need both icon and glyph on one widget. Ugly, I know.
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Layer
 
provides: [LSD.Layer.Icon]
 
...
*/


LSD.Layer.Icon = new Class({
  Extends: LSD.Layer.Shaped,
  
  properties: {
    required: ['icon', 'iconColor'],
    optional: ['iconLeft', 'iconTop', 'iconScale']
  },
  
  paint: function(icon, color, x, y, scale) {
    if (scale == null) scale = 1;
    this.shape.draw(icon);
    this.shape.fill.apply(this.shape, $splat(color));
    return {translate: {x: x, y: y}}
  }
});