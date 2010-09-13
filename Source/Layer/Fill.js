/*
---
 
script: Fill.js
 
description: Fills shape with color
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Layer
 
provides: [ART.Layer.Fill]
 
...
*/

ART.Layer.Fill = new Class({
  Extends: ART.Layer,
  
	paint: function(color) {
	  if (!color) return false;
	  this.produce();
		this.shape.fill.apply(this.shape, $splat(color));
	}

});