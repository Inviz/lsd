/*
---

script: Flower.js

description: Ever wanted a flower button? Here you go

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
- ART/ART.Shape

provides: [ART.Shape.Flower]

...
*/

ART.Shape.Flower = new ART.Class({

  Extends: ART.Shape,

  properties: ['width', 'height', 'leaves', 'radius'],

  draw: function(width, height, leaves, radius){
     var path = new ART.Path,
         outside = width / 2,
         cx = width / 2,
         cy = cx,
         inside = outside * (radius || 0.5);

    leaves = Math.max(leaves || 0, 5);
    path.move(0, inside);
    var points = ["M", cx, cy + rin, "Q"],
        R;
    for (var i = 1; i < leaves * 2 + 1; i++) {
        R = i % 2 ? rout : rin;
        points = points.concat([+(cx + R * Math.sin(i * Math.PI / n)).toFixed(3), +(cy + R * Math.cos(i * Math.PI / n)).toFixed(3)]);
    }
    points.push("z");
    return this.path(points);


    return this.parent(path.close());
  },

  getOffset: function(styles, offset) {
    var stroke = (styles.strokeWidth || 0);
    return {
      left: ((styles.width == 'auto') ? Math.max(stroke - offset.left, 0) : stroke),
      top: 0,
      right: ((styles.width == 'auto') ? Math.max(stroke - offset.right, 0) : stroke),
      bottom: stroke
    }
  }

});

//Raphael.fn.flower = function (cx, cy, rout, rin, n) {
//    rin = rin || rout * .5;
//    n = +n < 3 || !n ? 5 : n;
//    var points = ["M", cx, cy + rin, "Q"],
//        R;
//    for (var i = 1; i < n * 2 + 1; i++) {
//        R = i % 2 ? rout : rin;
//        points = points.concat([+(cx + R * Math.sin(i * Math.PI / n)).toFixed(3), +(cy + R * Math.cos(i * Math.PI / n)).toFixed(3)]);
//    }
//    points.push("z");
//    return this.path(points);
//};
