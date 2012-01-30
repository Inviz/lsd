/*
---
 
script: Arrow.js
 
description: An arrow shape. Useful for all the chat bubbles and validation errors.
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - ART/ART.Shape
 
provides: 
  - ART.Shape.Arrow
 
...
*/

ART.Shape.Arrow = new ART.Class({

  Extends: ART.Shape,
  
  properties: ['width', 'height', 'radius', 'arrowWidth', 'arrowHeight', 'arrowSide', 'arrowPosition', 'arrowX', 'arrowY'],
  
  draw: function(width, height, radius, aw, ah, as, ap, ax, ay){

    var path = new ART.Path;
    
    if (!radius) radius = 0;

    if (typeof radius == 'number') radius = [radius, radius, radius, radius];

    var tl = radius[0], tr = radius[1], br = radius[2], bl = radius[3];

    if (tl < 0) tl = 0;
    if (tr < 0) tr = 0;
    if (bl < 0) bl = 0;
    if (br < 0) br = 0;
    
    var sides = {
      top: Math.abs(width) - (tr + tl),
      right: Math.abs(height) - (tr + br),
      bottom: Math.abs(width) - (br + bl),
      left: Math.abs(height) - (bl + tl)
    };
    
    switch (as){
      case 'top': path.move(0, ah); break;
      case 'left': path.move(ah, 0); break;
    }

    path.move(0, tl);
    
    if (typeof ap == 'string') ap = ((sides[as] - aw) * (ap.toFloat() / 100));
    if (ap < 0) ap = 0;
    else if (ap > sides[as] - aw) ap = sides[as] - aw;
    var ae = sides[as] - ap - aw, aw2 = aw / 2;

    if (width < 0) path.move(width, 0);
    if (height < 0) path.move(0, height);
    
    // top

    if (tl > 0) path.arc(tl, -tl);
    if (as == 'top') path.line(ap, 0).line(aw2, -ah).line(aw2, ah).line(ae, 0);
    else path.line(sides.top, 0);
    
    // right

    if (tr > 0) path.arc(tr, tr);
    if (as == 'right') path.line(0, ap).line(ah, aw2).line(-ah, aw2).line(0, ae);
    else path.line(0, sides.right);
    
    // bottom

    if (br > 0) path.arc(-br, br);
    if (as == 'bottom') path.line(-ap, 0).line(-aw2, ah).line(-aw2, -ah).line(-ae, 0);
    else path.line(-sides.bottom, 0);
    
    // left

    if (bl > 0) path.arc(-bl, -bl);
    if (as == 'left') path.line(0, -ap).line(-ah, -aw2).line(ah, -aw2).line(0, -ae);
    else path.line(0, -sides.left);

    return this.parent(path);
  },

  getOffset: function(styles) {
    return {
      left: (styles.arrowSide == 'left') ? styles.arrowWidth : 0,
      right: (styles.arrowSide == 'right') ? styles.arrowWidth : 0,
      top: (styles.arrowSide == 'top') ? styles.arrowHeight : 0,
      bottom: (styles.arrowSide == 'bottom') ? styles.arrowHeight : 0
    }
  },
  
  render: function(context) {
    return this.draw(context.size.width, context.size.height, context.radius)
  }

});
