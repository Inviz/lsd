/*
---
 
script: Stroke.js
 
description: Fills shape with color and strokes with a stroke
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Layer
 
provides: [LSD.Layer.Stroke]
 
...
*/

LSD.Layer.Stroke = new Class({
  Extends: LSD.Layer,
  
  properties: {
    required: ['strokeColor'],
    numerical: ['strokeWidth'],
    alternative: ['fillColor'],
    optional: ['strokeColor', 'strokeDash']
  },
  
  paint: function(strokeColor, stroke, color, cap, dash) {
    this.produce(stroke / 2);
    this.shape.stroke(strokeColor, stroke, cap);
    this.shape.fill.apply(this.shape, color ? $splat(color) : null);
    this.shape.dash(dash);
    return {
      translate: {
        x: stroke / 2, 
        y: stroke / 2
      },
      inside: {
        left: stroke,
        top: stroke,
        right: stroke,
        bottom: stroke
      }
    };
  }
});
