/*
---
 
script: Stroke.js
 
description: Fills shape with color and strokes with a stroke
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Layer
  - LSD.Layer.Color
 
provides: 
  - LSD.Layer.Stroke
 
...
*/

LSD.Layer.Stroke = {
  
  properties: {
    stroke:    ['width', ['cap', 'join', 'dash'], 'color'], 
    color:     ['gradient', 'color'],
    width:     ['length'],
    cap:       ['butt', 'round', 'square'],
    join:      ['butt', 'round', 'square'],
    dash:      ['tokens']
  },
  
  paint: function(color, width, cap, join, dash) {
    if (!width) width = 0;
    var gradient = color && (color['gradient'] || color['linear-gradient']);
    var result = {    
      dash: dash,
      size: {
        width: width,
        height: width
      },
      move: {
        x: width / 2,
        y: width / 2
      },
      inside: {
        left: width,
        top: width,
        right: width,
        bottom: width
      },
      stroke: [!gradient && color || null, width, cap, join]
    };
    if (this.radius != null) {
      var radius = result.radius = []
          for (var i = 0; i < 4; i++) radius[i] = (this.radius[i] > 0) ? width / 1.5 : 0;
    }
    if (gradient) result.strokeLinear = [gradient]
    return result;
  }
}