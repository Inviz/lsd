/*
---
 
script: Ellipse.js
 
description: Draw ellipses and circles without a hassle
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Shape
 
provides: [ART.Shape.Ellipse]
 
...
*/

ART.Shape.Ellipse = new Class({
  
  Extends: ART.Shape,
  
  properties: ['width', 'height'],
  
  initialize: function(width, height){
    this.parent();
    if (width != null && height != null) this.draw(width, height);
  },
  
  draw: function(width, height){
    var path = new ART.Path;
    var rx = width / 2, ry = height / 2;
    path.move(0, ry).arc(width, 0, rx, ry).arc(-width, 0, rx, ry);
    return path;
  },
  
  produce: function(delta) {
    return new ART.Shapes.Ellipse(this.style.width + delta * 2, this.style.height + delta * 2)
  }

});