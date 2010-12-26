/*
---
 
script: Star.js
 
description: A star with variable number of edges
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - ART.Shape
 
provides: 
  - ART.Shape.Star
 
...
*/

ART.Shape.Star = new Class({
  
  Extends: ART.Shape,
  
  properties: ['width', 'height', 'starRays', 'starRadius', 'starOffset'],
  
  initialize: function(width, height){
    this.parent();
    if (width != null && height != null) this.draw(width, height);
  },
  
  paint: function(width, height, rays, radius, offset){
    if (rays == null) rays = 5;
     var path = new ART.Path;
     var outer = width / 2;
     var angle = Math.PI / rays;
     offset = angle / (offset || 2.1);
    if (radius == null) radius = outer *.582;
    var lx = 0, ly = 0;
    for (var i = 0; i < rays * 2; i++) { 
        var r = i % 2 ? outer : radius; 
        var x = r * Math.cos(i * angle + offset);
        var y = r * Math.sin(i * angle + offset);
        if (i == 0) {
          path.move(x - lx + outer, y - ly + outer)
        } else {
          path.line(x - lx, y - ly);
        }
        lx = x;
        ly = y;
    }
    return path.close();
  },

  change: function(delta) {
    return this.paint(
        this.style.width + delta * 2, 
        this.style.height + delta * 2,  
        this.style.starRays,
        this.style.starRadius,
        this.style.starOffset);
  },

  getOffset: function(styles, offset) {
    var stroke = (styles.strokeWidth || 0);
    return {
      left: ((styles.width == 'auto') ? Math.max(stroke - offset.left, 0) : stroke),
      top: 0,
      right: stroke,
      bottom: stroke
    }
  }

});