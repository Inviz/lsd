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
      move: LSD.Position.calculate(this.box, this.size, x || 'center', y || 'center')
    }
  }
}

LSD.Position = {};
LSD.Position.calculate = function(box, size, x, y) {
  var position = {x: 0, y: 0};
  
  switch (x) {
    case "left":
      position.x = 0;
    case "right":
      position.x = box.width - size.width;
    case "center":
      position.x = (box.width - size.width) / 2;
  }
  switch (y) {
    case "top":
      position.y = 0;
    case "bottom":
      position.y = box.height - size.height;
    case "center":
      position.y = (box.height- size.height) / 2;
  }
  return position;
}