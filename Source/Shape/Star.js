/*
---
 
script: Star.js
 
description: A star with variable number of edges
 
license: MIT-style license.
 
requires:
- ART.Shape
 
provides: [ART.Shape.Star]
 
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
	  if (!$defined(rays)) rays = 5;
 		var path = new ART.Path;
 		var outer = width / 2;
 		var angle = Math.PI / rays;
 		offset = angle / (offset || 2.1);
	  if (!$defined(radius)) radius = outer *.582;
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

ART.Styles.push('starRays', 'starRadius', 'starOffset');
//
//Raphael.fn.star = function (cx, cy, r, r2, rays) 
//{ 
//    r2 = r2 || r * .382; 
//    rays = rays || 5; 
//    var points = ["M", cx, cy + r2, "L"],R; 
//    for (var i = 1; i < rays * 2; i++) 
//    { 
//        R = i % 2 ? r : r2; 
//        points = points.concat([(cx + R * Math.sin(i * Math.PI / rays)), (cy + R * Math.cos(i * Math.PI / rays))]); 
//    } 
//    points.push("z"); 
//    return this.path(points.join()); 
//};