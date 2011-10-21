/*
---

script: Position.js

description: Positions layer in the box

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Layer

provides:
  - LSD.Layer.Position

...
*/

LSD.Layer.Position = {
  properties: {
    position: [['x', 'y']],
    x:        ['length', 'percentage', 'left', 'right', 'center'],
    y:        ['length', 'percentage', 'top', 'bottom', 'center']
  },


  paint: function(x, y) {
    if (!x && !y) return;
    return {
      move: LSD.position(this.box, this.size, x || 'center', y || 'center')
    }
  }
}