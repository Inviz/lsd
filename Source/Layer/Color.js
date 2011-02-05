/*
---
 
script: Color.js
 
description: Fills shape with color
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Layer
 
provides: [LSD.Layer.Color, LSD.Layer.Fill]
 
...
*/

LSD.Layer.Color = {
  properties: {
    color: ['color', 'gradient', 'none']
  },
  
  paint: function(color) {
    if (color) var radial = color['radial-gradient'], gradient = color['gradient'] || color ['linear-gradient'];
    return {
      fill: color && ((color != 'none') && !gradient && !radial) && color,
      fillLinear: gradient && [gradient],
      fillRadial: false//radial
    }
  }
};

LSD.Layer.Fill = {
  properties: {
    color: ['color']
  },
  
  prefix: 'fill',
  
  paint: LSD.Layer.Color.paint
};