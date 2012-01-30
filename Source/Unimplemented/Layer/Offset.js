/*
---
 
script: Offset.js
 
description: Positions layer around the canvas
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Layer
 
provides: [LSD.Layer.Offset]
 
...
*/

LSD.Layer.Offset = {
  properties: {  
    offset:    [['top', 'right', 'bottom', 'left']],
    top:       ['length', 'percentage'],
    left:      ['length', 'percentage'],
    bottom:    ['length', 'percentage'],
    right:     ['length', 'percentage'],
  },

  paint: function(top, right, bottom, left) {
    return {
      move: {
        x: left == null && right != null ? (this.size.width - (right || 0)) : (left || 0), 
        y: top == null && bottom != null ? (this.size.height - (bottom || 0)) : (top || 0)
      }
    }
  }
};