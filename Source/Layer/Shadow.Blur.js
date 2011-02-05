/*
---
 
script: Shadow.Blur.js
 
description: SVG Filter powered shadow
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Layer.Shadow
 
provides: [LSD.Layer.Shadow.Blur]
 
...
*/

LSD.Layer.Shadow.Blur = new Class({
  //Extends: LSD.Layer.Shadow,

  paint: function(color, blur, x, y, stroke) {
    this.produce(stroke);
    this.shape.fill.apply(this.shape, color ? $splat(color) : null);
    if (blur > 0) this.shape.blur(blur);
    else this.shape.unblur();
    return {
      move: {
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