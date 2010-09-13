/*
---
 
script: Icon.js
 
description: For the times you need both icon and glyph on one widget. Ugly, I know.
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Layer
 
provides: [ART.Layer.Icon]
 
...
*/


ART.Layer.Icon = new Class({
  Extends: ART.Layer.Shaped,
  
  properties: ['icon', 'iconColor', 'iconLeft', 'iconTop', 'iconScale'],
  
  paint: function(icon, color, x, y, scale) {
    if (!icon || !color) return false;
    if (!x) x = 0;
    if (!y) y = 0;
    if (!$defined(scale)) scale = 1;
    this.shape.draw(icon);
		this.shape.fill.apply(this.shape, $splat(color));
	  return {translate: {x: x, y: y}}
  }
});